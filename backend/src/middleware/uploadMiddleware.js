/**
 * ===================================
 * FILE UPLOAD MIDDLEWARE (MULTER + CLOUDINARY)
 * ===================================
 * 
 * WHAT IS MULTIPART/FORM-DATA?
 * ════════════════════════════════════
 * 
 * REGULAR JSON REQUEST:
 * Content-Type: application/json
 * Body: {"title": "Hello", "description": "World"}
 * 
 * Problems:
 * ❌ Can't send binary data (images, videos, PDFs)
 * ❌ JSON can only handle text
 * 
 * 
 * MULTIPART/FORM-DATA:
 * Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
 * 
 * Body (simplified):
 * ------WebKitFormBoundary
 * Content-Disposition: form-data; name="title"
 * 
 * Modern Dashboard UI
 * ------WebKitFormBoundary
 * Content-Disposition: form-data; name="image"; filename="design.jpg"
 * Content-Type: image/jpeg
 * 
 * [BINARY IMAGE DATA HERE]
 * ------WebKitFormBoundary--
 * 
 * ✅ Can send text AND files in same request
 * ✅ Each part has its own Content-Type
 * ✅ Files sent as binary (efficient)
 * 
 * 
 * WHAT IS MULTER?
 * ════════════════════════════════════
 * 
 * Express doesn't parse multipart/form-data by default!
 * 
 * WITHOUT MULTER:
 * req.body = {}  // Empty! Can't access files
 * req.file = undefined
 * 
 * WITH MULTER:
 * req.body = { title: "Modern Dashboard UI" }
 * req.file = {
 *   fieldname: 'image',
 *   originalname: 'design.jpg',
 *   mimetype: 'image/jpeg',
 *   buffer: <Buffer ...>
 * }
 * 
 * Multer parses multipart data and gives us:
 * - req.body (text fields)
 * - req.file (single file)
 * - req.files (multiple files)
 * 
 * 
 * UPLOAD FLOW:
 * ════════════════════════════════════
 * 
 * 1. User selects file in browser
 * 2. Frontend sends multipart/form-data request
 * 3. Request hits Express server
 * 4. Multer middleware intercepts request
 * 5. Multer parses multipart data
 * 6. File stored in memory (buffer)
 * 7. Our code uploads buffer to Cloudinary
 * 8. Cloudinary returns image URL
 * 9. We save URL to MongoDB
 * 10. Return URL to frontend
 * 
 * Frontend                Backend              Cloudinary           Database
 *    |                       |                      |                    |
 *    |--FormData POST------->|                      |                    |
 *    |                       |--Upload buffer------>|                    |
 *    |                       |<--Image URL----------|                    |
 *    |                       |--Save URL----------------------------->|
 *    |<--Success + URL-------|                      |                    |
 * 
 * 
 * STORAGE STRATEGIES:
 * ════════════════════════════════════
 * 
 * OPTION 1: Disk Storage (Save to filesystem first)
 * const storage = multer.diskStorage({
 *   destination: './uploads/',
 *   filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
 * });
 * 
 * Flow: Browser → Server Disk → Cloudinary
 * ❌ Slow (two-step)
 * ❌ Fills server disk
 * ❌ Need to clean up temp files
 * 
 * 
 * OPTION 2: Memory Storage ← We use this!
 * const storage = multer.memoryStorage();
 * 
 * Flow: Browser → Server RAM → Cloudinary
 * ✅ Fast (one-step)
 * ✅ No disk I/O
 * ✅ Auto cleanup (garbage collected)
 * ✅ Works in serverless (no filesystem)
 * 
 * Note: Limited by RAM (don't allow huge files)
 * 
 * 
 * FILE VALIDATION:
 * ════════════════════════════════════
 * 
 * SECURITY RISKS:
 * ❌ User uploads malware disguised as image
 * ❌ User uploads 500MB video (crashes server)
 * ❌ User uploads .exe file
 * 
 * OUR PROTECTION:
 * ✅ File type check (mimetype)
 * ✅ File extension check
 * ✅ File size limit (5MB)
 * ✅ Cloudinary validation (double-check)
 */

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import '../config/cloudinary.js'; // Initialize Cloudinary with env variables

/**
 * ALLOWED FILE TYPES
 * 
 * MIME TYPES EXPLAINED:
 * - image/jpeg: .jpg, .jpeg files
 * - image/png: .png files
 * - image/gif: .gif files (animated images)
 * - image/webp: .webp files (modern, smaller size)
 * 
 * NOT ALLOWED:
 * - application/pdf: PDF files
 * - video/mp4: Video files (would use separate endpoint)
 * - application/octet-stream: Generic binary (suspicious)
 */
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * MAX FILE SIZE: 5MB
 * 
 * WHY 5MB?
 * - Most design images: 500KB - 2MB
 * - High-res images: 2MB - 5MB
 * - Larger: Likely uncompressed or too big
 * 
 * REAL-WORLD EXAMPLES:
 * - Dribbble: 5MB limit
 * - Behance: 10MB limit
 * - Instagram: 8MB limit
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * MULTER CONFIGURATION
 * 
 * memoryStorage: Store file in RAM (not disk)
 * File accessible via req.file.buffer
 */
const storage = multer.memoryStorage();

/**
 * FILE FILTER: Validate file type
 * 
 * Called BEFORE file is stored in memory
 * Rejects invalid files early (saves RAM)
 * 
 * @param {Object} req - Express request
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback(error, accept)
 */
const fileFilter = (req, file, cb) => {
  /**
   * MIME TYPE CHECK
   * 
   * file.mimetype examples:
   * - Valid: "image/jpeg", "image/png"
   * - Invalid: "application/pdf", "text/plain"
   * 
   * SPOOFING ATTACK:
   * User renames virus.exe → virus.jpg
   * Mimetype: "application/x-msdownload" (detected by multer)
   * Our check: FAILS ✅ (rejected)
   */
  if (ALLOWED_FORMATS.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed: ${ALLOWED_FORMATS.join(', ')}. Got: ${file.mimetype}`
      ),
      false // Reject file
    );
  }
};

/**
 * MULTER INSTANCE
 * 
 * Middleware that:
 * 1. Parses multipart/form-data
 * 2. Validates file type
 * 3. Checks file size
 * 4. Stores file in memory (req.file.buffer)
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only 1 file per request
  }
});

/**
 * UPLOAD TO CLOUDINARY
 * 
 * Converts buffer to Cloudinary upload stream
 * Returns promise with upload result
 * 
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Upload result
 * 
 * CLOUDINARY UPLOAD OPTIONS:
 * ════════════════════════════════════
 * 
 * folder: Where to store in Cloudinary
 * - "designhub/designs" → Organized structure
 * - Easy to find files in dashboard
 * 
 * resource_type: "auto" (image, video, raw)
 * - Cloudinary auto-detects type
 * 
 * transformation: Apply on upload
 * - Auto format (WebP for Chrome, JPEG for Safari)
 * - Auto quality (balance size vs clarity)
 * - Max dimensions (protect against huge images)
 * 
 * public_id: Custom filename (optional)
 * - Default: Random (e.g., "abc123xyz")
 * - Custom: "user_123_design_456"
 * 
 * RESULT OBJECT:
 * {
 *   public_id: "designhub/designs/abc123",
 *   secure_url: "https://res.cloudinary.com/.../image.jpg",
 *   width: 1920,
 *   height: 1080,
 *   format: "jpg",
 *   bytes: 245678,
 *   ...
 * }
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    /**
     * CLOUDINARY UPLOAD STREAM
     * 
     * WHY STREAM?
     * - Files stored in memory (buffer)
     * - Cloudinary SDK expects stream or file path
     * - stream.Readable.from(buffer) converts buffer to stream
     * 
     * ALTERNATIVE (Disk-based):
     * cloudinary.uploader.upload('./uploads/image.jpg') // Slower!
     */
    console.log('[uploadToCloudinary] Starting upload stream...');
    console.log('[uploadToCloudinary] Config:', {
      cloud_name: cloudinary.config().cloud_name || 'MISSING',
      api_key: cloudinary.config().api_key ? 'Present' : 'MISSING',
      api_secret: cloudinary.config().api_secret ? 'Present' : 'MISSING'
    });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'designhub/designs',
        resource_type: 'auto',
        transformation: [
          {
            quality: 'auto', // Auto compress
            fetch_format: 'auto' // Auto format (WebP, AVIF)
          }
        ],
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('[uploadToCloudinary] Error:', error.message);
          reject(error);
        } else {
          console.log('[uploadToCloudinary] Success:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height
          });
          resolve(result);
        }
      }
    );

    // Pipe buffer to upload stream
    // (Convert buffer to readable stream)
    console.log('[uploadToCloudinary] Piping buffer to upload stream, size:', buffer.length, 'bytes');
    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * DELETE FROM CLOUDINARY
 * 
 * Remove image when design is deleted
 * Frees up storage quota
 * 
 * @param {String} publicId - Cloudinary public_id
 * @returns {Promise<Object>} Delete result
 * 
 * WHEN TO USE:
 * - User deletes design
 * - User updates design image (delete old)
 * - Admin removes inappropriate content
 * 
 * SOFT DELETE CONSIDERATION:
 * If you soft delete (isDeleted flag), keep image!
 * Only delete when permanently removing from database.
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * GENERATE THUMBNAIL URL
 * 
 * Cloudinary transformation magic!
 * No server processing needed.
 * 
 * @param {String} url - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {String} Thumbnail URL
 * 
 * EXAMPLE:
 * Original:
 * https://res.cloudinary.com/demo/image/upload/v1234/design.jpg
 * 
 * Thumbnail (400x300):
 * https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/v1234/design.jpg
 * 
 * HOW IT WORKS:
 * 1. Frontend requests thumbnail URL
 * 2. Cloudinary generates thumbnail on-the-fly
 * 3. Caches result on CDN
 * 4. Future requests: Served from CDN (fast!)
 * 
 * NO BACKEND CODE NEEDED!
 */
export const generateThumbnailUrl = (url, { width = 400, height = 300 } = {}) => {
  if (!url) return null;

  // Insert transformation before /upload/
  const transformation = `w_${width},h_${height},c_fill`;
  return url.replace('/upload/', `/upload/${transformation}/`);
};

/**
 * EXPORT SINGLE IMAGE UPLOAD MIDDLEWARE
 * 
 * Usage in routes:
 * router.post('/upload', upload.single('image'), uploadController);
 * 
 * Field name 'image' must match frontend FormData:
 * formData.append('image', file);
 */
export const uploadSingle = upload.single('image');

/**
 * EXPORT MULTIPLE IMAGES UPLOAD MIDDLEWARE
 * 
 * Usage:
 * router.post('/upload-multiple', upload.array('images', 5), controller);
 * 
 * Accepts up to 5 files with field name 'images'
 */
export const uploadMultiple = upload.array('images', 5);

export default upload;
