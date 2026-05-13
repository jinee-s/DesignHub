/**
 * ===================================
 * UPLOAD ROUTES
 * ===================================
 * 
 * Image upload endpoints
 * Protected routes (require authentication)
 */

import express from 'express';
import {
  uploadImage,
  deleteImage,
  uploadMultipleImages
} from '../controllers/uploadController.js';
import {
  uploadSingle,
  uploadMultiple
} from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image
 * @access  Private
 * 
 * MIDDLEWARE CHAIN:
 * 1. protect - Verify JWT token
 * 2. uploadSingle - Parse multipart, validate file
 * 3. uploadImage - Upload to Cloudinary, return URLs
 * 
 * REQUEST EXAMPLE (curl):
 * curl -X POST http://localhost:5000/api/upload/image \
 *   -H "Authorization: Bearer TOKEN" \
 *   -F "image=@/path/to/design.jpg"
 * 
 * REQUEST EXAMPLE (Postman):
 * 1. Set method to POST
 * 2. URL: http://localhost:5000/api/upload/image
 * 3. Headers: Authorization: Bearer TOKEN
 * 4. Body: form-data
 *    - Key: image (select File type)
 *    - Value: Select file from computer
 * 
 * FRONTEND (JavaScript):
 * const formData = new FormData();
 * formData.append('image', fileInput.files[0]);
 * 
 * fetch('/api/upload/image', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: formData // DON'T set Content-Type (browser auto-sets)
 * });
 * 
 * FRONTEND (React + Axios):
 * const handleUpload = async (file) => {
 *   const formData = new FormData();
 *   formData.append('image', file);
 *   
 *   const response = await axios.post('/api/upload/image', formData, {
 *     headers: {
 *       'Authorization': `Bearer ${token}`
 *       // Axios auto-sets Content-Type: multipart/form-data
 *     }
 *   });
 *   
 *   return response.data.data;
 * };
 */
router.post('/image', protect, uploadLimiter, uploadSingle, uploadImage);

/**
 * @route   DELETE /api/upload/image/:publicId
 * @desc    Delete image from Cloudinary
 * @access  Private
 * 
 * PUBLIC_ID FORMAT:
 * URL encoded: designhub%2Fdesigns%2Fabc123
 * Decoded: designhub/designs/abc123
 * 
 * Express automatically decodes URL params
 * 
 * EXAMPLE:
 * DELETE /api/upload/image/designhub%2Fdesigns%2Fabc123
 * 
 * FRONTEND:
 * const deleteImage = async (cloudinaryId) => {
 *   const encodedId = encodeURIComponent(cloudinaryId);
 *   await axios.delete(`/api/upload/image/${encodedId}`);
 * };
 */
router.delete('/image/:publicId', protect, deleteImage);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple images (max 5)
 * @access  Private
 * 
 * FRONTEND:
 * const handleMultipleUpload = async (files) => {
 *   const formData = new FormData();
 *   files.forEach(file => formData.append('images', file));
 *   
 *   const response = await axios.post('/api/upload/multiple', formData);
 *   return response.data.data; // Array of image objects
 * };
 */
router.post('/multiple', protect, uploadLimiter, uploadMultiple, uploadMultipleImages);

/**
 * ===================================
 * UPLOAD BEST PRACTICES
 * ===================================
 * 
 * 1. PROGRESS TRACKING (Frontend)
 * ────────────────────────────────────
 * 
 * Show upload progress to user:
 * 
 * const uploadWithProgress = async (file, onProgress) => {
 *   const formData = new FormData();
 *   formData.append('image', file);
 *   
 *   await axios.post('/api/upload/image', formData, {
 *     onUploadProgress: (progressEvent) => {
 *       const percent = Math.round(
 *         (progressEvent.loaded * 100) / progressEvent.total
 *       );
 *       onProgress(percent);
 *     }
 *   });
 * };
 * 
 * 
 * 2. IMAGE PREVIEW (Frontend)
 * ────────────────────────────────────
 * 
 * Show preview before upload:
 * 
 * const [preview, setPreview] = useState(null);
 * 
 * const handleFileChange = (e) => {
 *   const file = e.target.files[0];
 *   setPreview(URL.createObjectURL(file));
 * };
 * 
 * <img src={preview} alt="Preview" />
 * 
 * 
 * 3. CLIENT-SIDE VALIDATION
 * ────────────────────────────────────
 * 
 * Validate BEFORE sending to server:
 * 
 * const validateFile = (file) => {
 *   // Size check
 *   if (file.size > 5 * 1024 * 1024) {
 *     alert('File too large (max 5MB)');
 *     return false;
 *   }
 *   
 *   // Type check
 *   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
 *   if (!allowedTypes.includes(file.type)) {
 *     alert('Invalid file type');
 *     return false;
 *   }
 *   
 *   return true;
 * };
 * 
 * 
 * 4. ERROR HANDLING
 * ────────────────────────────────────
 * 
 * try {
 *   const result = await uploadImage(file);
 *   toast.success('Upload successful!');
 * } catch (error) {
 *   if (error.response?.status === 400) {
 *     toast.error('Invalid file');
 *   } else if (error.response?.status === 413) {
 *     toast.error('File too large');
 *   } else {
 *     toast.error('Upload failed. Please try again.');
 *   }
 * }
 * 
 * 
 * 5. IMAGE COMPRESSION (Frontend - Optional)
 * ────────────────────────────────────
 * 
 * Compress before upload (reduce bandwidth):
 * 
 * import imageCompression from 'browser-image-compression';
 * 
 * const handleUpload = async (file) => {
 *   const options = {
 *     maxSizeMB: 1,
 *     maxWidthOrHeight: 1920
 *   };
 *   
 *   const compressed = await imageCompression(file, options);
 *   // Upload compressed file
 * };
 * 
 * 
 * 6. DIRECT UPLOAD TO CLOUDINARY (Alternative)
 * ────────────────────────────────────
 * 
 * Skip backend, upload directly from browser:
 * 
 * Pros:
 * ✅ No backend upload handling
 * ✅ Faster (no proxy)
 * ✅ Less server load
 * 
 * Cons:
 * ❌ Expose Cloudinary credentials (use signed uploads)
 * ❌ Less control (validation on frontend only)
 * ❌ Can't associate user with upload easily
 * 
 * OUR APPROACH (Backend proxy):
 * ✅ Secure (credentials on backend)
 * ✅ User authentication
 * ✅ Server-side validation
 * ✅ Can track who uploaded what
 */

export default router;
