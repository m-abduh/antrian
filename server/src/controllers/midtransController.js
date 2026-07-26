import Queue from '../models/Queue.js';
import Merchant from '../models/Merchant.js';
import Service from '../models/Service.js';
import { verifyNotification, calculateMidtransFee } from '../utils/midtrans.js';
import { calculateEstimatedTime } from '../utils/queueNumber.js';

export async function handleNotification(req, res, next) {
  try {
    const { order_id, transaction_id, transaction_status, gross_amount, payment_type } = req.body;

    const queue = await Queue.findOne({ midtransOrderId: order_id });
    if (!queue) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const merchant = await Merchant.findById(queue.merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, error: 'Merchant not found' });
    }

    if (!merchant.midtrans || !merchant.midtrans.serverKey) {
      return res.status(500).json({ success: false, error: 'Merchant Midtrans not configured' });
    }

    const result = verifyNotification(req.body, merchant.midtrans.serverKey);

    if (!result.valid) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    if (queue.paymentStatus === 'paid') {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      queue.paymentStatus = 'paid';
      queue.status = 'waiting';
      queue.midtransTransactionId = transaction_id || '';
      queue.paymentMethod = result.paymentType || payment_type || '';
      queue.midtransFee = calculateMidtransFee(result.paymentType || payment_type || '', gross_amount || 0);

      const service = await Service.findById(queue.serviceId);
      const queuesAhead = await Queue.countDocuments({
        merchantId: queue.merchantId,
        status: { $in: ['waiting', 'called'] },
        _id: { $lt: queue._id },
      });
      const estimatedMinutes = calculateEstimatedTime(queuesAhead, service ? service.duration : 15);
      queue.estimatedStartTime = new Date(Date.now() + Math.max(1, estimatedMinutes) * 60000);
    } else if (transaction_status === 'expire' || transaction_status === 'deny' || transaction_status === 'cancel') {
      queue.paymentStatus = 'expired';
      queue.status = 'skipped';
    }

    await queue.save();

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    next(err);
  }
}
