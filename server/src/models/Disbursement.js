import mongoose from 'mongoose';

const disbursementSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  fee: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed'],
    default: 'pending',
  },
  bankName: { type: String, default: '' },
  bankAccount: { type: String, default: '' },
  bankHolder: { type: String, default: '' },
  referenceNo: { type: String, default: '' },
  notes: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
});

disbursementSchema.index({ merchantId: 1, status: 1 });
disbursementSchema.index({ requestedAt: -1 });

export default mongoose.model('Disbursement', disbursementSchema);
