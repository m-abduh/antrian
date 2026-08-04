import Merchant from '../models/Merchant.js';
import Service from '../models/Service.js';
import Queue from '../models/Queue.js';
import Rating from '../models/Rating.js';
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
      .select('name description price image variants')
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

    const { serviceIds, items, customerName, customerPhone, note, customerToken, customFieldValues } = req.body;

    let lineItems;
    if (Array.isArray(items) && items.length > 0) {
      lineItems = items;
    } else if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      lineItems = serviceIds.map(id => ({ serviceId: String(id) }));
    }
    if (!lineItems || lineItems.length === 0) {
      return error(res, 'Pilih minimal 1 layanan');
    }
    if (lineItems.length > 100) {
      return error(res, 'Terlalu banyak item dalam satu pesanan');
    }

    const nameCfg = merchant.customFieldsConfig?.find(f => f.key === 'customerName');
    const phoneCfg = merchant.customFieldsConfig?.find(f => f.key === 'customerPhone');

    if (nameCfg && nameCfg.required && (!customerName || !customerName.trim())) {
      return error(res, 'Nama pelanggan wajib diisi');
    }
    if (customerName && customerName.trim().length > 100) {
      return error(res, 'Nama maksimal 100 karakter');
    }
    const sanitizedName = customerName ? customerName.trim().replace(/<[^>]*>/g, '') : '';
    if (phoneCfg && phoneCfg.required && (!customerPhone || !customerPhone.trim())) {
      return error(res, 'Nomor telepon wajib diisi');
    }
    if (customerPhone && !/^\+?[0-9]{10,15}$/.test(customerPhone)) {
      return error(res, 'Format nomor telepon tidak valid');
    }

    const otherFields = merchant.customFieldsConfig?.filter(f => f.key !== 'customerName' && f.key !== 'customerPhone' && f.label?.trim()) || [];
    for (const f of otherFields) {
      if (f.required && (!customFieldValues || !customFieldValues[f.key]?.trim())) {
        return error(res, `${f.label} wajib diisi`);
      }
    }

    const token = customerToken || crypto.randomUUID();

    const normalized = [];
    for (const it of lineItems) {
      const serviceId = typeof it?.serviceId === 'string' ? it.serviceId.trim() : '';
      if (!serviceId) return error(res, 'Layanan tidak valid');
      const variant = typeof it.variant === 'string' ? it.variant.trim() : '';
      const qty = Number(it.quantity);
      const quantity = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
      normalized.push({ serviceId, variant, quantity });
    }

    const uniqueIds = [...new Set(normalized.map(i => i.serviceId))];

    const services = await Service.find({
      _id: { $in: uniqueIds },
      merchantId: merchant._id,
      isActive: true,
    }).select('name price variants');

    if (services.length !== uniqueIds.length) {
      return error(res, 'Beberapa layanan tidak ditemukan atau tidak aktif', 404);
    }
    const serviceMap = new Map(services.map(s => [s._id.toString(), s]));

    for (const it of normalized) {
      const svc = serviceMap.get(it.serviceId);
      if (!svc) return error(res, 'Layanan tidak ditemukan', 404);
      const hasVariants = Array.isArray(svc.variants) && svc.variants.length > 0;
      if (it.variant) {
        const match = svc.variants?.find(v => v.name === it.variant);
        if (!match) return error(res, `Varian "${it.variant}" pada ${svc.name} tidak ditemukan`, 404);
      } else if (hasVariants) {
        return error(res, `Pilih varian untuk ${svc.name}`, 400);
      }
    }

    const aggregate = [];
    const indexMap = new Map();
    for (const it of normalized) {
      const key = `${it.serviceId}::${it.variant}`;
      const existing = indexMap.get(key);
      if (existing !== undefined) {
        aggregate[existing].quantity += it.quantity;
      } else {
        indexMap.set(key, aggregate.length);
        aggregate.push({ serviceId: it.serviceId, variant: it.variant, quantity: it.quantity });
      }
    }

    const queueNumber = await generateQueueNumber(merchant._id);

    const queuesAhead = await Queue.countDocuments({
      merchantId: merchant._id,
      status: { $in: ['waiting', 'called'] },
    });

    const estimatedMinutes = calculateEstimatedTime(queuesAhead);
    const estimatedStartTime = queuesAhead > 0 ? new Date(Date.now() + estimatedMinutes * 60000) : null;

    const queueServices = [];
    let totalPrice = 0;
    for (const line of aggregate) {
      const svc = serviceMap.get(line.serviceId);
      const v = line.variant ? svc.variants.find(x => x.name === line.variant) : null;
      const queueService = {
        serviceId: svc._id,
        name: v ? `${svc.name} (${v.name})` : svc.name,
        price: v ? v.price : svc.price,
        quantity: line.quantity,
      };
      if (v) queueService.variant = v.name;
      queueServices.push(queueService);
      totalPrice += queueService.price * queueService.quantity;
    }

    const queue = await Queue.create({
      merchantId: merchant._id,
      services: queueServices,
      note: note || '',
      queueNumber,
      customerName: sanitizedName,
      customerPhone: customerPhone || '',
      customerToken: token,
      status: 'waiting',
      estimatedStartTime,
      customFieldValues: customFieldValues || {},
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
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return error(res, 'Rating harus antara 1-5');
    }

    const merchant = await Merchant.findOne({ slug, isActive: true }).select('_id');
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);

    const queue = await Queue.findOne({ _id: id, merchantId: merchant._id, status: 'done' });
    if (!queue) {
      return error(res, 'Antrean tidak ditemukan atau belum selesai', 404);
    }

    await Rating.create({
      merchantId: merchant._id,
      queueId: queue._id,
      customerToken: queue.customerToken || '',
      customerPhone: queue.customerPhone || '',
      customerName: queue.customerName,
      queueNumber: queue.queueNumber,
      rating: Math.round(rating),
      comment: comment && comment.trim() ? comment.trim() : '',
      services: queue.services || [],
    });

    queue.rating = Math.round(rating);
    if (comment && comment.trim()) {
      queue.ratingComment = comment.trim();
    }
    await queue.save();

    return success(res, { message: 'Terima kasih atas penilaiannya!', rating: Math.round(rating) });
  } catch (err) {
    next(err);
  }
}

export async function subscribePush(req, res, next) {
  try {
    const merchant = await Merchant.findOne({ slug: req.params.slug, isActive: true });
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);

    const { endpoint, keys, customerToken } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return error(res, 'Invalid subscription data');
    }

    await PushSubscription.findOneAndUpdate(
      { merchantId: merchant._id, endpoint },
      { merchantId: merchant._id, subscriptionType: 'customer', customerToken: customerToken || '', endpoint, keys, userAgent: req.headers['user-agent'] || '' },
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
