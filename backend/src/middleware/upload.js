import multer from 'multer';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Allowed file types
const ALLOWED_TYPES = [
  'audio/mpeg',        // MP3
  'audio/mp4',         // M4A
  'audio/wav',         // WAV
  'audio/x-m4a',       // M4A alternative
  'video/mp4',         // MP4
  'video/webm',        // WebM
  'audio/webm',        // WebM audio
];

const ALLOWED_EXTENSIONS = ['.mp3', '.mp4', '.wav', '.m4a', '.webm'];

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '../../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = file.originalname.substring(file.originalname.lastIndexOf('.'));
    cb(null, `${uniqueId}${extension}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const extension = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();

  if (ALLOWED_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB default
  }
});

export default upload;
