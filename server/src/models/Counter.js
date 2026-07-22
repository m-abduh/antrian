import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

counterSchema.index({ merchantId: 1, date: 1 }, { unique: true });

export default mongoose.model('Counter', counterSchema);
