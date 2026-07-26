import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Nama grup wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama maksimal 100 karakter'],
  },
  serviceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  order: {
    type: Number,
    default: 0,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

groupSchema.pre('save', function () {
  this.updatedAt = new Date();
});

groupSchema.index({ merchantId: 1, order: 1 });

export default mongoose.model('Group', groupSchema);
