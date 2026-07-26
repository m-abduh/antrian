import Admin from '../models/Admin.js';
import Queue from '../models/Queue.js';
import Service from '../models/Service.js';
import Merchant from '../models/Merchant.js';
import Disbursement from '../models/Disbursement.js';
import PushSubscription from '../models/PushSubscription.js';
import jwt from 'jsonwebtoken';
import webpush from 'web-push';
import { OAuth2Client } from 'google-auth-library';
import env from '../config/env.js';
import { success, error } from '../utils/response.js';
import { createDisbursement, getDisbursementBalance, getDisbursementHistory, getBeneficiaryBanks } from '../utils/midtrans.js';

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

export async function googleEmailLogin(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email wajib diisi');

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
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
    const { name, address, phone, bank, midtrans } = req.body;
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
    if (phone !== undefined) {
      if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) return error(res, 'Format nomor telepon tidak valid');
      update.phone = phone;
    }
    if (bank !== undefined) {
      if (bank.name !== undefined) update['bank.name'] = bank.name;
      if (bank.account !== undefined) update['bank.account'] = bank.account;
      if (bank.holder !== undefined) update['bank.holder'] = bank.holder;
    }
    if (midtrans !== undefined) {
      update.midtrans = {};
      if (midtrans.serverKey !== undefined) update['midtrans.serverKey'] = midtrans.serverKey;
      if (midtrans.clientKey !== undefined) update['midtrans.clientKey'] = midtrans.clientKey;
    }

    const merchant = await Merchant.findByIdAndUpdate(req.admin.merchantId, update, { new: true, runValidators: true });
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
    const { date, status } = req.query;
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
    }

    const queues = await Queue.find(filter)
      .populate('serviceId', 'name duration price')
      .sort({ createdAt: 1 });

    return success(res, queues);
  } catch (err) {
    next(err);
  }
}

export async function updateQueueStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['call', 'skip', 'done'].includes(action)) {
      return error(res, 'Aksi tidak valid. Gunakan: call, skip, atau done');
    }

    const queue = await Queue.findOne({ _id: id, merchantId: req.admin.merchantId });
    if (!queue) {
      return error(res, 'Antrean tidak ditemukan', 404);
    }

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

    await queue.save();

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
      paymentStatus: 'paid',
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
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$service.name', 'Unknown'] }, count: 1 } },
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

export async function getServices(req, res, next) {
  try {
    const services = await Service.find({ merchantId: req.admin.merchantId }).sort('name');
    return success(res, services);
  } catch (err) {
    next(err);
  }
}

export async function createService(req, res, next) {
  try {
    const { name, description, duration, price } = req.body;

    if (!name || !name.trim()) return error(res, 'Nama layanan wajib diisi');
    if (!duration || duration < 1) return error(res, 'Durasi minimal 1 menit');
    if (price === undefined || price < 0) return error(res, 'Harga tidak valid');

    const service = await Service.create({
      merchantId: req.admin.merchantId,
      name: name.trim(),
      description: description || '',
      duration,
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
    const { name, description, duration, price, isActive } = req.body;

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
    if (duration !== undefined) {
      if (duration < 1 || duration > 480) return error(res, 'Durasi harus antara 1-480 menit');
      update.duration = duration;
    }
    if (price !== undefined) {
      if (price < 0) return error(res, 'Harga tidak boleh negatif');
      update.price = price;
    }
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await Service.findByIdAndUpdate(id, update, { new: true, runValidators: true });
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

    await Service.findByIdAndUpdate(id, { isActive: false });
    return success(res, { message: 'Layanan berhasil dinonaktifkan' });
  } catch (err) {
    next(err);
  }
}

// ─── Finance ──────────────────────────────────────────────────────

export async function getFinanceSummary(req, res, next) {
  try {
    const merchantId = req.admin.merchantId;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const paidQueues = await Queue.find({
      merchantId,
      paymentStatus: 'paid',
    }).populate('serviceId', 'name price').lean();

    const totalRevenue = paidQueues.reduce((sum, q) => sum + (q.serviceId?.price || 0), 0);
    const totalFees = paidQueues.reduce((sum, q) => sum + (q.midtransFee || 0), 0);
    const netRevenue = totalRevenue - totalFees;

    const allDisbursements = await Disbursement.find({ merchantId }).sort({ requestedAt: -1 }).lean();
    const totalDisbursed = allDisbursements
      .filter((d) => d.status === 'success')
      .reduce((sum, d) => sum + d.amount, 0);
    const totalDisbursementFees = allDisbursements
      .filter((d) => d.status === 'success')
      .reduce((sum, d) => sum + d.fee, 0);
    const pendingDisbursements = allDisbursements.filter((d) => d.status === 'pending');
    const pendingAmount = pendingDisbursements.reduce((sum, d) => sum + d.amount, 0);

    const balance = netRevenue - totalDisbursed - pendingAmount;

    const todayRevenue = paidQueues.filter(
      (q) => new Date(q.createdAt) >= start
    ).reduce((sum, q) => sum + (q.serviceId?.price || 0), 0);

    return success(res, {
      totalRevenue,
      totalFees,
      netRevenue,
      totalDisbursed,
      totalDisbursementFees,
      pendingAmount,
      balance,
      todayRevenue,
      transactionCount: paidQueues.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFinanceTransactions(req, res, next) {
  try {
    const merchantId = req.admin.merchantId;
    const { page = 1, limit = 20, start, end } = req.query;

    const filter = { merchantId, paymentStatus: 'paid' };

    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setDate(endDate.getDate() + 1);
        filter.createdAt.$lt = endDate;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Queue.find(filter)
        .populate('serviceId', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Queue.countDocuments(filter),
    ]);

    return success(res, {
      transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getFinanceDisbursements(req, res, next) {
  try {
    const merchantId = req.admin.merchantId;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [disbursements, total] = await Promise.all([
      Disbursement.find({ merchantId })
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Disbursement.countDocuments({ merchantId }),
    ]);

    return success(res, {
      disbursements,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
}

export async function requestWithdraw(req, res, next) {
  try {
    const merchantId = req.admin.merchantId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return error(res, 'Jumlah penarikan tidak valid');
    }

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);

    if (!merchant.bank?.name || !merchant.bank?.account || !merchant.bank?.holder) {
      return error(res, 'Lengkapi data rekening bank di halaman Pengaturan terlebih dahulu');
    }

    const paidQueues = await Queue.find({ merchantId, paymentStatus: 'paid' })
      .populate('serviceId', 'price').lean();
    const totalRevenue = paidQueues.reduce((sum, q) => sum + (q.serviceId?.price || 0), 0);
    const totalMidtransFees = paidQueues.reduce((sum, q) => sum + (q.midtransFee || 0), 0);
    const netRevenue = totalRevenue - totalMidtransFees;

    const disbursements = await Disbursement.find({ merchantId, status: { $in: ['pending', 'success'] } }).lean();
    const totalDisbursedOrPending = disbursements.reduce((sum, d) => sum + d.amount, 0);

    const balance = netRevenue - totalDisbursedOrPending;

    if (amount > balance) {
      return error(res, `Saldo tidak mencukupi. Saldo saat ini: Rp ${balance.toLocaleString('id-ID')}`);
    }

    const disbursementFee = 5550;
    const netAmount = amount - disbursementFee;

    if (netAmount <= 0) {
      return error(res, 'Jumlah penarikan terlalu kecil setelah dipotong biaya transfer');
    }

    const disbursement = await Disbursement.create({
      merchantId,
      amount,
      fee: disbursementFee,
      netAmount,
      status: 'pending',
      bankName: merchant.bank.name,
      bankAccount: merchant.bank.account,
      bankHolder: merchant.bank.holder,
      notes: `Penarikan saldo Rp ${amount.toLocaleString('id-ID')}`,
    });

    try {
      const result = await createDisbursement(
        netAmount,
        merchant.bank.name,
        merchant.bank.account,
        merchant.bank.holder,
        `Antriin-${disbursement._id}`
      );

      const referenceNo = result?.reference_no || result?.payouts?.[0]?.reference_no || '';
      disbursement.status = 'processing';
      disbursement.referenceNo = referenceNo;
      await disbursement.save();

      return success(res, {
        disbursement,
        message: 'Penarikan sedang diproses. Dana akan masuk ke rekening Anda.',
      });
    } catch (irisErr) {
      console.error('Iris disbursement error:', irisErr.message);
      disbursement.status = 'pending';
      disbursement.notes += ` | Gagal: ${irisErr.message}`;
      await disbursement.save();

      return success(res, {
        disbursement,
        message: 'Permintaan penarikan tercatat. Admin akan memproses secara manual.',
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function getFinanceBalance(req, res, next) {
  try {
    const merchantId = req.admin.merchantId;

    const paidQueues = await Queue.find({ merchantId, paymentStatus: 'paid' })
      .populate('serviceId', 'price').lean();
    const totalRevenue = paidQueues.reduce((sum, q) => sum + (q.serviceId?.price || 0), 0);
    const totalMidtransFees = paidQueues.reduce((sum, q) => sum + (q.midtransFee || 0), 0);
    const netRevenue = totalRevenue - totalMidtransFees;

    const disbursements = await Disbursement.find({
      merchantId,
      status: { $in: ['pending', 'success', 'processing'] },
    }).lean();
    const totalDisbursedOrPending = disbursements.reduce((sum, d) => sum + d.amount, 0);

    const balance = netRevenue - totalDisbursedOrPending;

    return success(res, {
      totalRevenue,
      totalMidtransFees,
      netRevenue,
      totalDisbursed: disbursements.filter(d => d.status !== 'pending').reduce((sum, d) => sum + d.amount, 0),
      totalDisbursementFees: disbursements.filter(d => d.status !== 'pending').reduce((sum, d) => sum + d.fee, 0),
      pendingAmount: disbursements.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0),
      balance,
    });
  } catch (err) {
    next(err);
  }
}
