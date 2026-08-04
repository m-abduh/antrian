import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import { putObject } from '../services/s3.js';

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak upload. Silakan coba lagi nanti.' },
});

// Cegah file terlalu besar hingga 5MB dan hanya ~beberapa file per menit per key IP
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'));
  },
});

const router = Router();

router.post('/', uploadLimiter, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const msg = err.code === 'LIMIT_FILE_SIZE'
          ? 'Ukuran file maksimal 5MB'
          : 'File harus berupa gambar (jpg, jpeg, png, webp)';
        return res.status(400).json({ error: msg });
      }
      return next(err);
    }

    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan' });

    try {
      // Validasi isi file (bukan sekadar ekstensi) — tolak file non-gambar/rusak
      let metadata;
      try {
        metadata = await sharp(req.file.buffer).metadata();
      } catch {
        return res.status(400).json({ error: 'File tidak valid. Harus berupa gambar jpg/png/webp.' });
      }
      if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
        return res.status(400).json({ error: 'File tidak valid. Harus berupa gambar jpg/png/webp.' });
      }

      // Pertahankan transparansi (png/webp dengan alpha), selain itu ubah ke jpeg
      const hasAlpha = Boolean(metadata.hasAlpha);
      const ext = hasAlpha ? '.png' : '.jpg';
      const mime = hasAlpha ? 'image/png' : 'image/jpeg';
      const resizedName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-optimized${ext}`;

      const pipeline = sharp(req.file.buffer)
        .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true });
      const optimized = hasAlpha
        ? await pipeline.png({ quality: 78 }).toBuffer()
        : await pipeline.jpeg({ quality: 78 }).toBuffer();

      await putObject(resizedName, optimized, mime);
      res.json({ url: `${env.API_URL}/uploads/${resizedName}` });
    } catch (err) {
      next(err);
    }
  });
});

export default router;