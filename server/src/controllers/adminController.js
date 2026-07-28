import Admin from '../models/Admin.js';
import Queue from '../models/Queue.js';
import Service from '../models/Service.js';
import Merchant from '../models/Merchant.js';
import PushSubscription from '../models/PushSubscription.js';
import jwt from 'jsonwebtoken';
import webpush from 'web-push';
import { OAuth2Client } from 'google-auth-library';
import env from '../config/env.js';
import { success, error } from '../utils/response.js';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

async function notifyCustomer(queue) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  const subs = await PushSubscription.find({ merchantId: queue.merchantId, subscriptionType: 'customer' });
  if (subs.length === 0) return;
  const merchant = await Merchant.findById(queue.merchantId).select('slug');
  const payload = JSON.stringify({
    title: 'Nomor antrian Anda dipanggil!',
    body: `Nomor ${queue.queueNumber} - Silakan menuju ke loket`,
    url: `/${merchant?.slug || ''}/queue/${queue._id}`,
  });
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
    } catch (err) {
      if (err.statusCode === 410) {
        await PushSubscription.findByIdAndDelete(sub._id);
      } else {
        console.error(`[Push] Failed to send to ${sub.endpoint.substring(0, 50)}...:`, err.message);
      }
    }
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email dan password wajib diisi');
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!admin) {
      return error(res, 'Email atau password salah', 401);
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return error(res, 'Email atau password salah', 401);
    }

    const token = jwt.sign(
      { id: admin._id, merchantId: admin.merchantId, role: admin.role, name: admin.name, email: admin.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('token', token, cookieOptions);

    return success(res, {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        merchantId: admin.merchantId,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) return error(res, 'Nama wajib diisi');
    if (!email || !email.trim()) return error(res, 'Email wajib diisi');
    if (!password || password.length < 8) return error(res, 'Password minimal 8 karakter');

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) return error(res, 'Email sudah terdaftar');

    const admin = await Admin.create({
  name: name.trim(),
  email: email.toLowerCase().trim(),
  password,
  role: 'admin',
    });

    const token = jwt.sign(
      { id: admin._id, merchantId: admin.merchantId, role: admin.role, name: admin.name, email: admin.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('token', token, cookieOptions);

    return success(res, {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        merchantId: admin.merchantId,
      },
      token,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) return error(res, 'Google credential required');

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return error(res, 'Email tidak ditemukan di akun Google');

    const email = payload.email.toLowerCase().trim();
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) return error(res, 'Email Google belum terdaftar. Silakan daftar di halaman register.', 401);
    if (admin.role !== 'admin') return error(res, 'Akun ini bukan admin', 403);

    const token = jwt.sign(
      { id: admin._id, merchantId: admin.merchantId, role: admin.role, name: admin.name, email: admin.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('token', token, cookieOptions);

    return success(res, {
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, merchantId: admin.merchantId },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function googleTokenLogin(req, res, next) {
  try {
    const { accessToken, email, name } = req.body;
    if (!accessToken || !email) return error(res, 'Data tidak lengkap');

    const verifyRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
    if (!verifyRes.ok) return error(res, 'Token Google tidak valid', 401);
    const tokenInfo = await verifyRes.json();
    if (tokenInfo.email !== email) return error(res, 'Email tidak cocok', 401);

    const cleanEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail }).select('+password');
    if (!admin) return error(res, 'Email Google belum terdaftar. Silakan daftar di halaman register.', 401);
    if (admin.role !== 'admin') return error(res, 'Akun ini bukan admin', 403);

    const token = jwt.sign(
      { id: admin._id, merchantId: admin.merchantId, role: admin.role, name: admin.name, email: admin.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('token', token, cookieOptions);

    return success(res, {
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, merchantId: admin.merchantId },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  return success(res, {
    admin: {
      id: req.admin.id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      merchantId: req.admin.merchantId,
    },
  });
}

export async function getMerchant(req, res, next) {
  try {
    const merchant = await Merchant.findById(req.admin.merchantId);
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);
    return success(res, merchant);
  } catch (err) {
    next(err);
  }
}

export async function updateMerchant(req, res, next) {
  try {
    const { name, address, phone, image, banner, description, bank, socialLinks, statusConfig, customFieldsConfig } = req.body;
    const update = {};

    if (name !== undefined) {
      if (!name.trim()) return error(res, 'Nama merchant wajib diisi');
      if (name.trim().length > 100) return error(res, 'Nama maksimal 100 karakter');
      update.name = name.trim();
    }
    if (address !== undefined) {
      if (address.length > 500) return error(res, 'Alamat maksimal 500 karakter');
      update.address = address;
    }
    if (image !== undefined) update.image = image;
    if (banner !== undefined) update.banner = banner;
    if (phone !== undefined) {
      if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) return error(res, 'Format nomor telepon tidak valid');
      update.phone = phone;
    }
    if (description !== undefined) {
      if (description.length > 500) return error(res, 'Deskripsi maksimal 500 karakter');
      update.description = description;
    }
    if (bank !== undefined) {
      if (bank.name !== undefined) update['bank.name'] = bank.name;
      if (bank.account !== undefined) update['bank.account'] = bank.account;
      if (bank.holder !== undefined) update['bank.holder'] = bank.holder;
    }

    if (socialLinks !== undefined) {
      if (!Array.isArray(socialLinks)) return error(res, 'socialLinks harus berupa array');
      if (socialLinks.length > 3) return error(res, 'Maksimal 3 social media');
      const validPlatforms = ['instagram', 'tiktok', 'youtube', 'facebook'];
      for (const link of socialLinks) {
        if (!link.platform || !validPlatforms.includes(link.platform))
          return error(res, 'Platform sosial media tidak valid');
        if (!link.url || !link.url.trim())
          return error(res, 'URL sosial media wajib diisi');
      }
      update.socialLinks = socialLinks.map(l => ({ platform: l.platform, url: l.url }));
    }

    if (statusConfig !== undefined) {
      if (!Array.isArray(statusConfig) || statusConfig.length < 2)
        return error(res, 'statusConfig harus berupa array dengan minimal 2 status');
      for (const s of statusConfig) {
        if (!s.key || !s.key.trim())
          return error(res, 'Setiap status harus memiliki key');
        if (!s.label || !s.label.trim())
          return error(res, 'Setiap status harus memiliki label');
        if (s.label.trim().length > 50)
          return error(res, `Label "${s.key}" maksimal 50 karakter`);
      }
      if (statusConfig[0].key !== 'waiting')
        return error(res, 'Status pertama harus "waiting"');
      if (statusConfig[statusConfig.length - 1].key !== 'done')
        return error(res, 'Status terakhir harus "done"');
      if (new Set(statusConfig.map(s => s.key)).size !== statusConfig.length)
        return error(res, 'Key status tidak boleh duplikat');
      update.statusConfig = statusConfig.map(s => ({ key: s.key.trim(), label: s.label.trim() }));
    }

    if (customFieldsConfig !== undefined) {
      if (!Array.isArray(customFieldsConfig))
        return error(res, 'customFieldsConfig harus berupa array');
      for (const f of customFieldsConfig) {
        if (!f.key || !f.key.trim())
          return error(res, 'Key custom field wajib diisi');
        if (!f.label || !f.label.trim())
          return error(res, 'Label custom field wajib diisi');
        if (f.label.trim().length > 100)
          return error(res, 'Label custom field maksimal 100 karakter');
      }
      update.customFieldsConfig = customFieldsConfig.map(f => ({
        key: f.key.trim(),
        label: f.label.trim(),
        placeholder: (f.placeholder || '').trim(),
        required: !!f.required,
      }));
    }

    const merchant = await Merchant.findByIdAndUpdate(req.admin.merchantId, update, { returnDocument: 'after', runValidators: true });
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);
    return success(res, merchant);
  } catch (err) {
    next(err);
  }
}

export async function setupMerchant(req, res, next) {
  try {
    const { name, slug } = req.body;
    if (!name || !name.trim()) return error(res, 'Nama merchant wajib diisi');
    if (!slug || !slug.trim()) return error(res, 'Slug merchant wajib diisi');

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!cleanSlug) return error(res, 'Slug tidak valid');

    const existing = await Merchant.findOne({ slug: cleanSlug });
    if (existing) return error(res, 'Slug sudah digunakan');

    const merchant = await Merchant.create({
      name: name.trim(),
      slug: cleanSlug,
      isActive: true,
    });

    await Admin.findByIdAndUpdate(req.admin.id, { merchantId: merchant._id });

    const token = jwt.sign(
      { id: req.admin.id, merchantId: merchant._id, role: req.admin.role, name: req.admin.name, email: req.admin.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return success(res, { merchant, token });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie('token', { path: '/' });
  return success(res, { message: 'Logout berhasil' });
}

export async function getQueues(req, res, next) {
  try {
    const { date, status, excludeStatus } = req.query;
    const filter = { merchantId: req.admin.merchantId };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    } else {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    if (status && ['waiting', 'called', 'serving', 'done', 'skipped'].includes(status)) {
      filter.status = status;
    } else if (excludeStatus) {
      const excluded = excludeStatus.split(',');
      filter.status = { $nin: excluded };
    }

    const queues = await Queue.find(filter)
      .sort({ createdAt: -1 });

    return success(res, queues);
  } catch (err) {
    next(err);
  }
}

export async function updateQueueStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { action, status: targetStatus } = req.body;

    const validActions = ['call', 'skip', 'done', 'set'];
    if (!validActions.includes(action)) {
      return error(res, 'Aksi tidak valid. Gunakan: call, skip, done, atau set');
    }

    const queue = await Queue.findOne({ _id: id, merchantId: req.admin.merchantId });
    if (!queue) {
      return error(res, 'Antrean tidak ditemukan', 404);
    }

    if (action === 'set') {
      if (!targetStatus) {
        return error(res, 'Status target tidak valid');
      }
      queue.status = targetStatus;
      if (targetStatus === 'done') queue.finishedAt = new Date();
      if (targetStatus === 'called') notifyCustomer(queue).catch(() => {});
    } else {
      switch (action) {
        case 'call':
          if (queue.status !== 'waiting') {
            return error(res, `Antrean sudah ${queue.status}`, 400);
          }
          queue.status = 'called';
          notifyCustomer(queue).catch(() => {});
          break;
        case 'skip':
          if (!['waiting', 'called'].includes(queue.status)) {
            return error(res, `Antrean sudah ${queue.status}`, 400);
          }
          queue.status = 'skipped';
          break;
        case 'done':
          if (queue.status !== 'serving') {
            return error(res, `Antrean sedang ${queue.status}`, 400);
          }
          queue.status = 'done';
          queue.finishedAt = new Date();
          break;
      }
    }

    await queue.save();

    const io = req.app.get('io');
    if (io) {
      const merchant = await Merchant.findById(queue.merchantId).select('slug');
      if (merchant) {
        const publicQueue = {
          _id: queue._id,
          id: queue._id,
          queueNumber: queue.queueNumber,
          services: queue.services,
          status: queue.status,
          estimatedStartTime: queue.estimatedStartTime,
          startedAt: queue.startedAt,
          finishedAt: queue.finishedAt,
          createdAt: queue.createdAt,
        };
        if (action === 'call' || action === 'serve') {
          publicQueue.customerName = queue.customerName;
        }
        io.to(`merchant:${merchant.slug}`).emit('queue:status', { queue: publicQueue, action });
      }
    }

    return success(res, queue);
  } catch (err) {
    next(err);
  }
}

export async function startServing(req, res, next) {
  try {
    const { id } = req.params;

    const queue = await Queue.findOne({ _id: id, merchantId: req.admin.merchantId });
    if (!queue) {
      return error(res, 'Antrean tidak ditemukan', 404);
    }

    if (queue.status !== 'called') {
      return error(res, 'Antrean harus dipanggil terlebih dahulu', 400);
    }

    queue.status = 'serving';
    queue.startedAt = new Date();
    await queue.save();

    const io = req.app.get('io');
    if (io) {
      const merchant = await Merchant.findById(queue.merchantId).select('slug');
      if (merchant) {
        const publicQueue = {
          _id: queue._id,
          id: queue._id,
          queueNumber: queue.queueNumber,
          customerName: queue.customerName,
          services: queue.services,
          status: queue.status,
          estimatedStartTime: queue.estimatedStartTime,
          startedAt: queue.startedAt,
          finishedAt: queue.finishedAt,
          createdAt: queue.createdAt,
        };
        io.to(`merchant:${merchant.slug}`).emit('queue:status', { queue: publicQueue, action: 'serve' });
      }
    }

    return success(res, queue);
  } catch (err) {
    next(err);
  }
}

export async function togglePayment(req, res, next) {
  try {
    const { id } = req.params;
    const queue = await Queue.findOne({ _id: id, merchantId: req.admin.merchantId });
    if (!queue) {
      return error(res, 'Antrean tidak ditemukan', 404);
    }
    queue.isPaid = !queue.isPaid;
    await queue.save();

    const io = req.app.get('io');
    if (io) {
      const merchant = await Merchant.findById(queue.merchantId).select('slug');
      if (merchant) {
        const publicQueue = {
          _id: queue._id,
          id: queue._id,
          queueNumber: queue.queueNumber,
          services: queue.services,
          status: queue.status,
          isPaid: queue.isPaid,
          estimatedStartTime: queue.estimatedStartTime,
          startedAt: queue.startedAt,
          finishedAt: queue.finishedAt,
          createdAt: queue.createdAt,
        };
        io.to(`merchant:${merchant.slug}`).emit('queue:status', { queue: publicQueue, action: 'payment' });
      }
    }

    return success(res, queue);
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    const dateParam = req.query.date;
    const start = dateParam ? new Date(dateParam) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const merchantId = req.admin.merchantId;

    const total = await Queue.countDocuments({ merchantId, createdAt: { $gte: start, $lt: end } });
    const done = await Queue.countDocuments({ merchantId, status: 'done', createdAt: { $gte: start, $lt: end } });
    const skipped = await Queue.countDocuments({ merchantId, status: 'skipped', createdAt: { $gte: start, $lt: end } });
    const waitingNow = await Queue.countDocuments({
      merchantId,
      status: { $in: ['waiting', 'called'] },
    });

    const doneQueues = await Queue.find({ merchantId, status: 'done', createdAt: { $gte: start, $lt: end } })
      .select('startedAt finishedAt createdAt')
      .lean();

    let avgWaitTime = 0;
    if (doneQueues.length > 0) {
      const totalWait = doneQueues.reduce((sum, q) => {
        if (q.startedAt && q.createdAt) {
          return sum + (new Date(q.startedAt).getTime() - new Date(q.createdAt).getTime());
        }
        return sum;
      }, 0);
      avgWaitTime = Math.round(totalWait / doneQueues.length / 60000);
    }

    const peakHours = [];
    for (let h = 7; h <= 21; h++) {
      const hourStart = new Date(start);
      hourStart.setHours(h, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(h + 1, 0, 0, 0);

      const count = await Queue.countDocuments({
        merchantId,
        createdAt: { $gte: hourStart, $lt: hourEnd },
      });
      if (count > 0) peakHours.push({ hour: `${h}:00`, count });
    }

    const servicesBreakdown = await Queue.aggregate([
      { $match: { merchantId: merchantId, createdAt: { $gte: start, $lt: end } } },
      { $unwind: '$services' },
      { $group: { _id: '$services.name', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    return success(res, {
      total,
      done,
      skipped,
      waitingNow,
      avgWaitTime,
      peakHours: peakHours.slice(0, 5),
      servicesBreakdown,
      date: start.toISOString().split('T')[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function getCustomers(req, res, next) {
  try {
    const { search } = req.query;
    const match = { merchantId: req.admin.merchantId };

    if (search) {
      match.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Queue.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $ifNull: ['$customerPhone', '$customerToken'] },
          customerName: { $last: '$customerName' },
          customerPhone: { $last: '$customerPhone' },
          customerToken: { $last: '$customerToken' },
          totalKunjungan: { $sum: 1 },
          totalBelanja: {
            $sum: {
              $sum: {
                $map: {
                  input: '$services',
                  as: 's',
                  in: { $multiply: ['$$s.price', '$$s.quantity'] },
                },
              },
            },
          },
          terakhirAntri: { $max: '$createdAt' },
          ratingRata: { $avg: '$rating' },
        },
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          customerName: 1,
          customerPhone: 1,
          customerToken: 1,
          totalKunjungan: 1,
          totalBelanja: { $ifNull: ['$totalBelanja', 0] },
          terakhirAntri: 1,
          ratingRata: { $ifNull: ['$ratingRata', null] },
        },
      },
      { $sort: { terakhirAntri: -1 } },
    ]);

    return success(res, customers);
  } catch (err) {
    next(err);
  }
}

export async function getRatings(req, res, next) {
  try {
    const queue = await Queue.find({ merchantId: req.admin.merchantId, rating: { $ne: null } })
      .select('queueNumber customerName customerPhone services rating ratingComment createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return success(res, queue);
  } catch (err) {
    next(err);
  }
}

export async function getServices(req, res, next) {
  try {
    const services = await Service.find({ merchantId: req.admin.merchantId }).sort({ category: 1, name: 1 });
    return success(res, services);
  } catch (err) {
    next(err);
  }
}

export async function createService(req, res, next) {
  try {
    const { name, description, price, image } = req.body;

    if (!name || !name.trim()) return error(res, 'Nama layanan wajib diisi');
    if (price === undefined || price < 0) return error(res, 'Harga tidak valid');

    const service = await Service.create({
      merchantId: req.admin.merchantId,
      name: name.trim(),
      description: description || '',
      image: image || '',
      price,
    });

    return success(res, service, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, price, isActive, image } = req.body;

    const service = await Service.findOne({ _id: id, merchantId: req.admin.merchantId });
    if (!service) {
      return error(res, 'Layanan tidak ditemukan', 404);
    }

    const update = {};
    if (name !== undefined) {
      if (!name.trim()) return error(res, 'Nama layanan wajib diisi');
      if (name.trim().length > 100) return error(res, 'Nama maksimal 100 karakter');
      update.name = name.trim();
    }
    if (description !== undefined) {
      if (description.length > 500) return error(res, 'Deskripsi maksimal 500 karakter');
      update.description = description;
    }
    if (image !== undefined) update.image = image;
    if (price !== undefined) {
      if (price < 0) return error(res, 'Harga tidak boleh negatif');
      update.price = price;
    }
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await Service.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req, res, next) {
  try {
    const { id } = req.params;

    const service = await Service.findOne({ _id: id, merchantId: req.admin.merchantId });
    if (!service) {
      return error(res, 'Layanan tidak ditemukan', 404);
    }

    await Service.findByIdAndDelete(id);
    return success(res, { message: 'Layanan berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}
