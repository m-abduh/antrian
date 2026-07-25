import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import Admin from '../models/Admin.js';

export async function authenticate(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Akses ditolak. Admin tidak ditemukan.' });
    }

    req.admin = {
      id: admin._id,
      merchantId: admin.merchantId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Sesi telah habis. Silakan login ulang.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Token tidak valid.' });
    }
    return res.status(500).json({ success: false, error: 'Terjadi kesalahan autentikasi.' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, error: 'Akses ditolak.' });
    }
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, error: 'Tidak memiliki izin.' });
    }
    next();
  };
}
