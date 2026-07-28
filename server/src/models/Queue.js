import mongoose from 'mongoose';

const queueServiceSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const queueSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true,
  },
  services: {
    type: [queueServiceSchema],
    required: true,
    validate: [arr => arr.length > 0, 'Minimal 1 layanan'],
  },
  note: { type: String, default: '' },
  queueNumber: { type: String, required: true },
  customerName: {
    type: String,
    required: [true, 'Nama pelanggan wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama maksimal 100 karakter'],
  },
  customerPhone: {
    type: String,
    trim: true,
    default: '',
    match: [/^\+?[0-9]{10,15}$/, 'Format nomor telepon tidak valid'],
  },
  customerToken: {
    type: String,
    index: true,
    default: '',
  },
  status: {
    type: String,
    default: 'waiting',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  isPaid: { type: Boolean, default: false },
  ratingComment: { type: String, default: '' },
  estimatedStartTime: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  finishedAt: { type: Date, default: null },
  customFieldValues: {
    type: Map,
    of: String,
    default: {},
  },
  createdAt: { type: Date, default: Date.now },
});

queueSchema.index({ merchantId: 1, status: 1, createdAt: -1 });

export default mongoose.model('Queue', queueSchema);
