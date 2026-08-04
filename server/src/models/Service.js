import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: [true, 'Merchant ID wajib diisi'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Nama layanan wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama maksimal 100 karakter'],
  },
  image: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Deskripsi maksimal 500 karakter'],
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Harga wajib diisi'],
    min: [0, 'Harga minimal 0'],
  },
  variants: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Nama varian maksimal 100 karakter'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Harga varian minimal 0'],
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

serviceSchema.pre('save', function () {
  this.updatedAt = new Date();
});

serviceSchema.index({ merchantId: 1, isActive: 1 });

export default mongoose.model('Service', serviceSchema);
