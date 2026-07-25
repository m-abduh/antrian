import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Nama admin wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama maksimal 100 karakter'],
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid'],
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: [8, 'Password minimal 8 karakter'],
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

adminSchema.pre('save', async function () {
  this.updatedAt = new Date();
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Admin', adminSchema);
