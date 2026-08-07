import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../lib/middleware.js';

const UPLOAD_DIR = path.resolve('server', 'uploads');
const ARTWORK_DIR = path.join(UPLOAD_DIR, 'artworks');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const DOC_DIR = path.join(UPLOAD_DIR, 'docs');

[UPLOAD_DIR, ARTWORK_DIR, AVATAR_DIR, DOC_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const purpose = req.body.purpose || 'artwork';
    if (purpose === 'avatar') cb(null, AVATAR_DIR);
    else if (purpose === 'document' || purpose === 'kyc') cb(null, DOC_DIR);
    else cb(null, ARTWORK_DIR);
  },
  filename(req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Allowed: JPG, PNG, WebP, GIF, PDF'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post('/', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10MB)' : err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const purpose = req.body.purpose || 'artwork';
    let subdir = 'artworks';
    if (purpose === 'avatar') subdir = 'avatars';
    else if (purpose === 'document' || purpose === 'kyc') subdir = 'docs';

    // Ensure full path with http://localhost:4000 for frontend compatibility
    const localPath = `http://localhost:4000/uploads/${subdir}/${req.file.filename}`;
    const serverPath = `/uploads/${subdir}/${req.file.filename}`;
    
    res.json({ 
      url: localPath,
      full: localPath,
      featured: localPath,
      thumb: localPath,
      path: localPath,
      filename: req.file.filename,
      originalname: req.file.originalname
    });
  });
});

export default router;
