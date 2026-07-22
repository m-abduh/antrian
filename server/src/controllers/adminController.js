import Admin from '../models/Admin.js';
import Queue from '../models/Queue.js';
import Service from '../models/Service.js';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { success, error } from '../utils/response.js';

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
      { id: admin._id, merchantId: admin.merchantId, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return success(res, {
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        merchantId: admin.merchantId,
      },
    });
  } catch (err) {
    next(err);
  }
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const total = await Queue.countDocuments({
      merchantId: req.admin.merchantId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const done = await Queue.countDocuments({
      merchantId: req.admin.merchantId,
      status: 'done',
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const skipped = await Queue.countDocuments({
      merchantId: req.admin.merchantId,
      status: 'skipped',
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const waitingNow = await Queue.countDocuments({
      merchantId: req.admin.merchantId,
      status: { $in: ['waiting', 'called'] },
    });

    return success(res, {
      total,
      done,
      skipped,
      waitingNow,
      date: today.toISOString().split('T')[0],
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
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (duration !== undefined) update.duration = duration;
    if (price !== undefined) update.price = price;
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
