import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true,
  },
  queueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true,
  },
  customerToken: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  customerName: { type: String, required: true },
  queueNumber: { type: String, required: true },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: { type: String, default: '' },
  services: [{
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
  }],
}, { timestamps: true });

ratingSchema.index({ merchantId: 1, createdAt: -1 });
ratingSchema.index({ queueId: 1 });

export default mongoose.model('Rating', ratingSchema);