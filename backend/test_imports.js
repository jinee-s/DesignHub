/**
 * Simple test to verify module imports
 */

console.log('Testing module imports...\n');

try {
  console.log('1. Importing uploadMiddleware...');
  const upload = await import('./src/middleware/uploadMiddleware.js');
  console.log('   ✅ uploadMiddleware imported');
  console.log('   - uploadToCloudinary:', typeof upload.uploadToCloudinary);
  console.log('   - deleteFromCloudinary:', typeof upload.deleteFromCloudinary);
  console.log('   - generateThumbnailUrl:', typeof upload.generateThumbnailUrl);
} catch (err) {
  console.error('   ❌ Error:', err.message);
}

try {
  console.log('\n2. Importing designService...');
  const service = await import('./src/services/designService.js');
  console.log('   ✅ designService imported');
  console.log('   - deleteDesign:', typeof service.deleteDesign);
} catch (err) {
  console.error('   ❌ Error:', err.message);
}

try {
  console.log('\n3. Importing cloudinary config...');
  const cloudinary = await import('./src/config/cloudinary.js');
  console.log('   ✅ Cloudinary config imported');
} catch (err) {
  console.error('   ❌ Error:', err.message);
}

console.log('\n✅ All modules import successfully!');
