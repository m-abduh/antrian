export function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      for (const rule of rules) {
        const error = rule(value, field);
        if (error) {
          errors.push(error);
          break;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
}

export const rules = {
  required: (msg) => (v, f) => (!v || (typeof v === 'string' && !v.trim())) ? (msg || `${f} wajib diisi`) : null,
  string: (msg) => (v, f) => (v !== undefined && typeof v !== 'string') ? (msg || `${f} harus berupa teks`) : null,
  number: (msg) => (v, f) => (v !== undefined && (typeof v !== 'number' || isNaN(v))) ? (msg || `${f} harus berupa angka`) : null,
  min: (min, msg) => (v, f) => (v !== undefined && typeof v === 'number' && v < min) ? (msg || `${f} minimal ${min}`) : null,
  max: (max, msg) => (v, f) => (v !== undefined && typeof v === 'number' && v > max) ? (msg || `${f} maksimal ${max}`) : null,
  minLength: (min, msg) => (v, f) => (v && typeof v === 'string' && v.trim().length < min) ? (msg || `${f} minimal ${min} karakter`) : null,
  maxLength: (max, msg) => (v, f) => (v && typeof v === 'string' && v.trim().length > max) ? (msg || `${f} maksimal ${max} karakter`) : null,
  email: (msg) => (v, f) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? (msg || 'Format email tidak valid') : null,
  phone: (msg) => (v, f) => (v && !/^\+?[0-9]{10,15}$/.test(v)) ? (msg || 'Format nomor telepon tidak valid') : null,
  oneOf: (values, msg) => (v, f) => (v && !values.includes(v)) ? (msg || `${f} harus salah satu dari: ${values.join(', ')}`) : null,
};
