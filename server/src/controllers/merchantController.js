import Merchant from '../models/Merchant.js';
import Service from '../models/Service.js';
import Queue from '../models/Queue.js';
import PushSubscription from '../models/PushSubscription.js';
import crypto from 'crypto';
import { generateQueueNumber, calculateEstimatedTime } from '../utils/queueNumber.js';
import { success, error } from '../utils/response.js';

export async function getMerchant(req, res, next) {
  try {
    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) {
      return error(res, 'Merchant tidak ditemukan', 404);
    }
    return success(res, merchant);
  } catch (err) {
    next(err);
  }
}

export async function getServices(req, res, next) {
  try {
    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) {
      return error(res, 'Merchant tidak ditemukan', 404);
    }

    const services = await Service.find({ merchantId: merchant._id, isActive: true })
      .select('name description price image')
      .sort({ name: 1 });

    return success(res, services);
  } catch (err) {
    next(err);
  }
}

export async function createQueue(req, res, next) {
  try {
    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) {
      return error(res, 'Merchant tidak ditemukan', 404);
    }

    const { serviceIds, customerName, customerPhone, note, customerToken } = req.body;

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return error(res, 'Pilih minimal 1 layanan');
    }

    if (!customerName || !customerName.trim()) {
      return error(res, 'Nama pelanggan wajib diisi');
    }
    if (customerName.trim().length > 100) {
      return error(res, 'Nama maksimal 100 karakter');
    }
    const sanitizedName = customerName.trim().replace(/<[^>]*>/g, '');
    if (customerPhone && !/^\+?[0-9]{10,15}$/.test(customerPhone)) {
      return error(res, 'Format nomor telepon tidak valid');
    }

    const token = customerToken || crypto.randomUUID();

    const counts = serviceIds.reduce((acc, id) => {
      const k = id.toString();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const uniqueIds = Object.keys(counts);

    const services = await Service.find({
      _id: { $in: uniqueIds },
      merchantId: merchant._id,
      isActive: true,
    }).select('name price');

    if (services.length !== uniqueIds.length) {
      return error(res, 'Beberapa layanan tidak ditemukan atau tidak aktif', 404);
    }

    const queueNumber = await generateQueueNumber(merchant._id);

    const queuesAhead = await Queue.countDocuments({
      merchantId: merchant._id,
      status: { $in: ['waiting', 'called'] },
    });

    const estimatedMinutes = calculateEstimatedTime(queuesAhead);
    const estimatedStartTime = queuesAhead > 0 ? new Date(Date.now() + estimatedMinutes * 60000) : null;

    const totalPrice = services.reduce((sum, s) => sum + s.price * (counts[s._id.toString()] || 1), 0);

    const queue = await Queue.create({
      merchantId: merchant._id,
      services: services.map(s => ({
        serviceId: s._id,
        name: s.name,
        price: s.price,
        quantity: counts[s._id.toString()] || 1,
      })),
      note: note || '',
      queueNumber,
      customerName: sanitizedName,
      customerPhone: customerPhone || '',
      customerToken: token,
      status: 'waiting',
      estimatedStartTime,
    });

    const io = req.app.get('io');
    if (io) {
      const publicQueue = {
        _id: queue._id,
        queueNumber: queue.queueNumber,
        services: queue.services,
        status: queue.status,
        customerName: queue.customerName,
        customerPhone: queue.customerPhone || '',
        note: queue.note || '',
        merchantId: queue.merchantId,
        estimatedStartTime: queue.estimatedStartTime,
        startedAt: queue.startedAt,
        finishedAt: queue.finishedAt,
        createdAt: queue.createdAt,
        rating: queue.rating ?? null,
      };
      io.to(`merchant:${merchant.slug}`).emit('queue:new', { queue: publicQueue });
    }

    return success(res, {
      queue: {
        id: queue._id,
        queueNumber: queue.queueNumber,
        customerName: queue.customerName,
        status: queue.status,
        estimatedStartTime: queue.estimatedStartTime,
        estimatedMinutes,
        queuesAhead,
        totalPrice,
        services: queue.services,
      },
      customerToken: token,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getQueue(req, res, next) {
  try {
    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);

    const queue = await Queue.findOne({ _id: req.params.id, merchantId: merchant._id });

    if (!queue) return error(res, 'Antrean tidak ditemukan', 404);

    return success(res, queue);
  } catch (err) {
    next(err);
  }
}

export async function getLiveQueue(req, res, next) {
  try {
    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) {
      return error(res, 'Merchant tidak ditemukan', 404);
    }

    const current = await Queue.findOne({ merchantId: merchant._id, status: 'serving' });
    const waiting = await Queue.find({ merchantId: merchant._id, status: 'waiting' })
      .sort({ createdAt: 1 });
    const doneToday = await Queue.countDocuments({
      merchantId: merchant._id,
      status: 'done',
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
    });

    return success(res, {
      current,
      waitingCount: waiting.length,
      waiting,
      doneToday,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyQueues(req, res, next) {
  try {
    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) {
      return error(res, 'Merchant tidak ditemukan', 404);
    }

    const { token } = req.query;
    if (!token) {
      return error(res, 'Token diperlukan', 400);
    }

    const queues = await Queue.find({ merchantId: merchant._id, customerToken: token })
      .sort({ createdAt: -1 })
      .limit(50);

    return success(res, queues);
  } catch (err) {
    next(err);
  }
}

export async function submitRating(req, res, next) {
  try {
    const { slug, id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return error(res, 'Rating harus antara 1-5');
    }

    const merchant = await Merchant.findOne({ slug, isActive: true }).select('_id');
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);

    const queue = await Queue.findOne({ _id: id, merchantId: merchant._id, status: 'done' });
    if (!queue) {
      return error(res, 'Antrean tidak ditemukan atau belum selesai', 404);
    }
    if (queue.rating) {
      return error(res, 'Sudah memberikan rating', 400);
    }

    queue.rating = Math.round(rating);
    await queue.save();

    return success(res, { message: 'Terima kasih atas penilaiannya!', rating: queue.rating });
  } catch (err) {
    next(err);
  }
}

export async function subscribePush(req, res, next) {
  try {
    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return error(res, 'Invalid subscription data');
    }

    await PushSubscription.findOneAndUpdate(
      { merchantId: merchant._id, endpoint },
      { merchantId: merchant._id, subscriptionType: 'customer', endpoint, keys, userAgent: req.headers['user-agent'] || '' },
      { upsert: true, returnDocument: 'after' },
    );

    return success(res, { message: 'Subscription saved' });
  } catch (err) {
    next(err);
  }
}

export async function unsubscribePush(req, res, next) {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return error(res, 'Endpoint required');

    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);

    await PushSubscription.findOneAndDelete({ merchantId: merchant._id, endpoint });
    return success(res, { message: 'Subscription removed' });
  } catch (err) {
    next(err);
  }
}
