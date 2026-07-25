import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true,
  },
  subscriptionType: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer',
  },
  endpoint: {
    type: String,
    required: true,
  },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

pushSubscriptionSchema.index({ merchantId: 1, endpoint: 1 }, { unique: true });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
