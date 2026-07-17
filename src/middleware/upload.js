import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadBooksDir = path.join(__dirname, '../../uploads/books');
const uploadAvatarsDir = path.join(__dirname, '../../uploads/avatars');

// Ensure directories exist
[uploadBooksDir, uploadAvatarsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
        // Route avatar uploads to the avatars directory
        const isAvatar = file.fieldname === 'avatar';
        cb(null, isAvatar ? uploadAvatarsDir : uploadBooksDir);
    },
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

const fileFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
    cb(valid ? null : new Error('Only image files are allowed (jpg, jpeg, png, webp)'), valid);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export default upload;

