/**
 * ===================================
 * UPLOAD CONTROLLER
 * ===================================
 * 
 * Handles file upload requests
 * Uploads to Cloudinary and returns URLs
 */

import asyncHandler from 'express-async-handler';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateThumbnailUrl
} from '../middleware/uploadMiddleware.js';

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image to Cloudinary
 * @access  Private
 * @returns Image URL, thumbnail URL, and Cloudinary public_id
 * 
 * REQUEST:
 * - Content-Type: multipart/form-data
 * - Body: FormData with 'image' field
 * 
 * RESPONSE SUCCESS (201):
 * {
 *   "success": true,
 *   "data": {
 *     "imageUrl": "https://res.cloudinary.com/.../image.jpg",
 *     "thumbnailUrl": "https://res.cloudinary.com/.../w_400,h_300/image.jpg",
 *     "cloudinaryId": "designhub/designs/abc123",
 *     "width": 1920,
 *     "height": 1080,
 *     "format": "jpg",
 *     "size": 245678
 *   }
 * }
 * 
 * RESPONSE ERROR (400):
 * {
 *   "success": false,
 *   "message": "No file uploaded"
 * }
 * 
 * FRONTEND EXAMPLE (React):
 * ════════════════════════════════════
 * 
 * const handleUpload = async (file) => {
 *   const formData = new FormData();
 *   formData.append('image', file);
 *   
 *   const response = await axios.post('/api/upload/image', formData, {
 *     headers: {
 *       'Content-Type': 'multipart/form-data',
 *       'Authorization': `Bearer ${token}`
 *     }
 *   });
 *   
 *   console.log(response.data.data.imageUrl);
 * };
 */
export const uploadImage = asyncHandler(async (req, res) => {
  /**
   * VALIDATION: Check if file exists
   * 
   * req.file is populated by multer middleware
   * If no file or validation failed, req.file is undefined
   */
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Please select an image file.');
  }

  /**
   * FILE INFORMATION
   * 
   * req.file contains:
   * {
   *   fieldname: 'image',
   *   originalname: 'my-design.jpg',
   *   encoding: '7bit',
   *   mimetype: 'image/jpeg',
   *   buffer: <Buffer ...>,
   *   size: 245678
   * }
   */
  const { buffer, originalname, mimetype, size } = req.file;

  console.log('[UPLOAD] File received:', { originalname, mimetype, size: `${(size / 1024).toFixed(2)}KB` });

  try {
    /**
     * UPLOAD TO CLOUDINARY
     * 
     * Options:
     * - folder: Organized storage
     * - public_id: Custom filename (optional)
     * - eager: Pre-generate transformations
     * 
     * EAGER TRANSFORMATIONS:
     * Generate thumbnail immediately (don't wait for first request)
     * Good for: Critical images (user avatars, featured designs)
     * Skip for: Regular uploads (on-demand transformation is fine)
     */
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: 'designhub/designs',
      // Optional: Custom public_id
      // public_id: `${req.user._id}_${Date.now()}`
    });

    console.log('[UPLOAD] Uploaded to Cloudinary:', { publicId: uploadResult.public_id, url: uploadResult.secure_url });

    /**
     * CLOUDINARY RESULT:
     * {
     *   public_id: "designhub/designs/abc123xyz",
     *   secure_url: "https://res.cloudinary.com/.../image.jpg",
     *   width: 1920,
     *   height: 1080,
     *   format: "jpg",
     *   bytes: 245678,
     *   url: "http://..." (non-secure, don't use)
     * }
     */
    const {
      secure_url: imageUrl,
      public_id: cloudinaryId,
      width,
      height,
      format,
      bytes
    } = uploadResult;

    /**
     * GENERATE THUMBNAIL URL
     * 
     * Cloudinary transformation:
     * - Width: 400px
     * - Height: 300px
     * - Crop: Fill (maintains aspect ratio, crops excess)
     * 
     * ALTERNATIVE CROP MODES:
     * - c_fill: Fill area, crop excess (default)
     * - c_fit: Fit inside, show all (may have whitespace)
     * - c_limit: Resize only if larger
     * - c_scale: Stretch to exact dimensions (may distort)
     */
    const thumbnailUrl = generateThumbnailUrl(imageUrl, {
      width: 400,
      height: 300
    });

    /**
     * RETURN RESPONSE
     * 
     * Frontend receives:
     * - Full image URL (for detail page)
     * - Thumbnail URL (for feed/grid)
     * - Cloudinary ID (to delete later)
     * - Metadata (width, height, size)
     */
    console.log('[UPLOAD] DB saved:', { cloudinaryId });
    
    res.status(201).json({
      success: true,
      data: {
        imageUrl,
        thumbnailUrl,
        cloudinaryId,
        width,
        height,
        format,
        size: bytes,
        originalName: originalname
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    /**
     * ERROR HANDLING
     * 
     * Common errors:
     * - Invalid credentials (check .env)
     * - Network timeout
     * - Cloudinary quota exceeded
     * - Invalid image format (corrupted file)
     */
    res.status(500);
    throw new Error(
      `Failed to upload image: ${error.message || 'Unknown error'}`
    );
  }
});

/**
 * @route   DELETE /api/upload/image/:publicId
 * @desc    Delete image from Cloudinary
 * @access  Private
 * 
 * PUBLIC ID FORMAT:
 * - Full: "designhub/designs/abc123"
 * - In URL: Replace "/" with "%2F"
 * - Example: /api/upload/image/designhub%2Fdesigns%2Fabc123
 * 
 * WHY DELETE?
 * - User deletes design → Remove image
 * - User updates design image → Delete old image
 * - Free up Cloudinary storage
 * 
 * SOFT DELETE CONSIDERATION:
 * If using soft delete (isDeleted flag), DON'T delete image!
 * Keep image in case of restore.
 * Only delete when permanently removing from database.
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    res.status(400);
    throw new Error('Public ID is required');
  }

  try {
    /**
     * DELETE FROM CLOUDINARY
     * 
     * Result:
     * { result: 'ok' } → Success
     * { result: 'not found' } → Image doesn't exist
     */
    const result = await deleteFromCloudinary(publicId);

    if (result.result === 'not found') {
      res.status(404);
      throw new Error('Image not found in Cloudinary');
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: result
    });
  } catch (error) {
    res.status(500);
    throw new Error(
      `Failed to delete image: ${error.message || 'Unknown error'}`
    );
  }
});

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple images (up to 5)
 * @access  Private
 * 
 * USE CASE:
 * - Design with multiple screenshots
 * - Portfolio with gallery
 * - Product with multiple photos
 * 
 * REQUEST:
 * - Content-Type: multipart/form-data
 * - Body: FormData with 'images' field (multiple files)
 * 
 * FRONTEND EXAMPLE:
 * const formData = new FormData();
 * files.forEach(file => formData.append('images', file));
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": [
 *     { "imageUrl": "...", "thumbnailUrl": "...", "cloudinaryId": "..." },
 *     { "imageUrl": "...", "thumbnailUrl": "...", "cloudinaryId": "..." }
 *   ],
 *   "count": 2
 * }
 */
export const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }

  try {
    /**
     * UPLOAD ALL FILES TO CLOUDINARY
     * 
     * Promise.all: Upload in parallel (faster)
     * Alternative: for loop (sequential, slower but safer)
     */
    const uploadPromises = req.files.map(async (file) => {
      const uploadResult = await uploadToCloudinary(file.buffer, {
        folder: 'designhub/designs'
      });

      return {
        imageUrl: uploadResult.secure_url,
        thumbnailUrl: generateThumbnailUrl(uploadResult.secure_url),
        cloudinaryId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
        originalName: file.originalname
      };
    });

    const results = await Promise.all(uploadPromises);

    res.status(201).json({
      success: true,
      data: results,
      count: results.length,
      message: `${results.length} image(s) uploaded successfully`
    });
  } catch (error) {
    res.status(500);
    throw new Error(
      `Failed to upload images: ${error.message || 'Unknown error'}`
    );
  }
});
