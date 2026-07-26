import mongoose from 'mongoose';

const merchantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama merchant wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama maksimal 100 karakter'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'],
    maxlength: [50, 'Slug maksimal 50 karakter'],
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Alamat maksimal 500 karakter'],
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[0-9]{10,15}$/, 'Format nomor telepon tidak valid'],
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  bank: {
    name: { type: String, default: '' },
    account: { type: String, default: '' },
    holder: { type: String, default: '' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

merchantSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export default mongoose.model('Merchant', merchantSchema);
