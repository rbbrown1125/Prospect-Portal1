import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const profilePicsDir = path.join(uploadDir, 'profile-pics');

async function ensureUploadDirs() {
  try {
    await mkdir(uploadDir, { recursive: true });
    await mkdir(profilePicsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
}

// Initialize upload directories
ensureUploadDirs();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Process and save profile picture
export async function processProfilePicture(
  buffer: Buffer,
  userId: string,
  originalName: string
): Promise<string> {
  try {
    // Generate unique filename
    const ext = path.extname(originalName).toLowerCase();
    const filename = `${userId}-${Date.now()}${ext}`;
    const outputPath = path.join(profilePicsDir, filename);
    
    // Process image with sharp
    await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    // Return the relative URL for the image
    return `/uploads/profile-pics/${filename}`;
  } catch (error) {
    console.error('Error processing profile picture:', error);
    throw new Error('Failed to process profile picture');
  }
}

// Delete old profile picture
export async function deleteOldProfilePicture(profileImageUrl: string): Promise<void> {
  if (!profileImageUrl || !profileImageUrl.startsWith('/uploads/profile-pics/')) {
    return;
  }
  
  try {
    const filename = path.basename(profileImageUrl);
    const filePath = path.join(profilePicsDir, filename);
    
    if (fs.existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error('Error deleting old profile picture:', error);
    // Don't throw error, just log it
  }
}

export { upload };