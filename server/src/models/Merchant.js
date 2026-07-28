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
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Deskripsi maksimal 500 karakter'],
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  banner: {
    type: String,
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
  socialLinks: {
    type: [{
      platform: { type: String, required: true, enum: ['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp', 'telegram', 'x', 'threads'] },
      url: { type: String, required: true, trim: true },
    }],
    default: [],
  },
  statusConfig: {
    type: [{
      key: { type: String, required: true },
      label: { type: String, required: true },
    }],
    default: [
      { key: 'waiting', label: 'Menunggu' },
      { key: 'called', label: 'Dipanggil' },
      { key: 'serving', label: 'Dilayani' },
      { key: 'done', label: 'Selesai' },
      { key: 'skipped', label: 'Dilewati' },
    ],
  },
  customFieldsConfig: {
    type: [{
      key: { type: String, required: true },
      label: { type: String, required: true },
      placeholder: { type: String, default: '' },
      required: { type: Boolean, default: false },
    }],
    default: [
      { key: 'customerName', label: 'Nama Lengkap', placeholder: 'Masukkan nama Anda', required: true },
      { key: 'customerPhone', label: 'Nomor Telepon', placeholder: '08xxxxxxxxxx', required: false },
    ],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

merchantSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export default mongoose.model('Merchant', merchantSchema);
