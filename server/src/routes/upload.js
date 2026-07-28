import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('File harus berupa gambar (jpg, jpeg, png, webp)'));
  },
});

const router = Router();

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan' });

  try {
    const ext = path.extname(req.file.filename);
    const resizedName = `${path.basename(req.file.filename, ext)}-optimized${ext}`;
    const resizedPath = path.join(uploadDir, resizedName);

    await sharp(req.file.path)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .toFile(resizedPath);

    fs.unlink(req.file.path, () => {});

    res.json({ url: `${env.API_URL}/uploads/${resizedName}` });
  } catch {
    res.json({ url: `${env.API_URL}/uploads/${req.file.filename}` });
  }
});

export default router;
