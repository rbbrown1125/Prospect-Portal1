import multer from 'multer';
import sharp from 'sharp';
import { uploadBufferToAirtable, deleteAirtableAsset } from "./airtable";

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

export interface ProcessedProfilePicture {
  url: string;
  recordId: string;
  attachmentId: string;
}

// Process and save profile picture
export async function processProfilePicture(
  buffer: Buffer,
  userId: string,
  originalName: string
): Promise<ProcessedProfilePicture> {
  try {
    const normalizedFileName = `${userId}-${Date.now()}.jpg`;
    const processedBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return await uploadBufferToAirtable(processedBuffer, normalizedFileName, 'image/jpeg', {
      UserId: userId,
      OriginalFilename: originalName,
      AssetType: 'profile-picture',
    });
  } catch (error) {
    console.error('Error processing profile picture:', error);
    throw new Error('Failed to process profile picture');
  }
}

// Delete old profile picture
export async function deleteOldProfilePicture(recordId?: string): Promise<void> {
  if (!recordId) {
    return;
  }

  try {
    await deleteAirtableAsset(recordId);
  } catch (error) {
    console.error('Error deleting old profile picture from Airtable:', error);
  }
}

export { upload };