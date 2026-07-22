import Merchant from '../models/Merchant.js';
import Service from '../models/Service.js';
import Queue from '../models/Queue.js';
import { generateQueueNumber, calculateEstimatedTime } from '../utils/queueNumber.js';
import { createTransaction } from '../utils/midtrans.js';
import { success, error } from '../utils/response.js';
import { nanoid } from 'nanoid';

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
      .select('name description duration price')
      .sort('name');

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

    const { serviceId, customerName, customerPhone } = req.body;

    if (!customerName || !customerName.trim()) {
      return error(res, 'Nama pelanggan wajib diisi');
    }
    if (customerName.trim().length > 100) {
      return error(res, 'Nama maksimal 100 karakter');
    }
    if (customerPhone && !/^\+?[0-9]{10,15}$/.test(customerPhone)) {
      return error(res, 'Format nomor telepon tidak valid');
    }

    const service = await Service.findOne({ _id: serviceId, merchantId: merchant._id, isActive: true });
    if (!service) {
      return error(res, 'Layanan tidak ditemukan', 404);
    }

    const queueNumber = await generateQueueNumber(merchant._id);
    const orderId = `ANT-${merchant.slug}-${Date.now()}-${nanoid(8)}`;

    const queuesAhead = await Queue.countDocuments({
      merchantId: merchant._id,
      status: { $in: ['waiting', 'called'] },
    });

    const estimatedMinutes = calculateEstimatedTime(queuesAhead, service.duration);
    const estimatedStartTime = new Date(Date.now() + estimatedMinutes * 60000);

    let snapToken = null;
    if (service.price > 0) {
      try {
        const transaction = await createTransaction(orderId, service.price, {
          name: customerName,
          phone: customerPhone,
        });
        snapToken = transaction.token;
      } catch (midtransErr) {
        console.error('Midtrans error:', midtransErr.message);
        return error(res, 'Gagal memproses pembayaran. Silakan coba lagi.', 502);
      }
    }

    const queue = await Queue.create({
      merchantId: merchant._id,
      serviceId: service._id,
      queueNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone || '',
      paymentStatus: service.price > 0 ? 'pending' : 'paid',
      midtransOrderId: orderId,
      estimatedStartTime: service.price > 0 ? null : estimatedStartTime,
    });

    return success(res, {
      queue: {
        id: queue._id,
        queueNumber: queue.queueNumber,
        customerName: queue.customerName,
        status: queue.paymentStatus === 'paid' ? 'waiting' : 'pending_payment',
        estimatedStartTime: queue.estimatedStartTime,
        estimatedMinutes: estimatedMinutes,
        queuesAhead,
      },
      snapToken,
      orderId,
      paymentRequired: service.price > 0,
      amount: service.price,
    }, 201);
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

    const current = await Queue.findOne({ merchantId: merchant._id, status: 'serving' })
      .populate('serviceId', 'name duration');

    const waiting = await Queue.find({ merchantId: merchant._id, status: 'waiting' })
      .sort({ createdAt: 1 })
      .populate('serviceId', 'name duration');

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
