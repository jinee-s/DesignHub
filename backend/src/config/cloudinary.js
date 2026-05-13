/**
 * ===================================
 * CLOUDINARY CONFIGURATION
 * ===================================
 * 
 * WHY CLOUDINARY?
 * ════════════════════════════════════
 * 
 * OPTION 1: Local Storage (Filesystem)
 * ❌ Problems:
 * - Files stored on server disk
 * - Limited disk space
 * - No automatic backups
 * - Slow image delivery (from single server)
 * - No image optimization (resize, compress)
 * - Difficult to scale (horizontal scaling fails)
 * - Lost when server restarts (Docker, serverless)
 * 
 * Example: User uploads 10MB image → Stored at /uploads/image.jpg
 * - Every request hits your server (slow)
 * - Server disk fills up (costly storage)
 * - Deploy new server → All images lost!
 * 
 * 
 * OPTION 2: AWS S3
 * ✅ Pros:
 * - Unlimited storage
 * - Scalable
 * - CDN integration (CloudFront)
 * 
 * ❌ Cons:
 * - Complex setup (buckets, IAM, policies)
 * - Manual image optimization
 * - No built-in transformations
 * - More expensive for small projects
 * 
 * 
 * OPTION 3: Cloudinary ← We use this!
 * ✅ Pros:
 * - FREE tier: 25GB storage, 25GB bandwidth/month
 * - Automatic image optimization (WebP, AVIF)
 * - On-the-fly transformations (resize, crop, filters)
 * - Global CDN (fast delivery worldwide)
 * - Easy setup (3 env variables)
 * - Video support
 * - Face detection, AI features
 * 
 * REAL-WORLD USAGE:
 * - Dribbble: Uses Cloudinary
 * - Medium: Uses Cloudinary
 * - Product Hunt: Uses Cloudinary
 * 
 * 
 * CLOUDINARY TRANSFORMATIONS EXAMPLES:
 * ════════════════════════════════════
 * 
 * Original URL:
 * https://res.cloudinary.com/demo/image/upload/sample.jpg
 * 
 * Thumbnail (200x200):
 * https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/sample.jpg
 * 
 * Optimized (auto format, quality):
 * https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/sample.jpg
 * 
 * Blur effect:
 * https://res.cloudinary.com/demo/image/upload/e_blur:300/sample.jpg
 * 
 * NO CODE CHANGES NEEDED! Just modify URL!
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import colors from 'colors';

dotenv.config();

/**
 * CONFIGURE CLOUDINARY
 * 
 * Required environment variables:
 * - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - CLOUDINARY_API_KEY: Your API key
 * - CLOUDINARY_API_SECRET: Your API secret
 * 
 * HOW TO GET CREDENTIALS:
 * 1. Sign up at https://cloudinary.com (FREE)
 * 2. Go to Dashboard
 * 3. Copy: Cloud Name, API Key, API Secret
 * 4. Add to .env file
 */
const cloudConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Always use HTTPS
};

console.log('[Cloudinary Config] Attempting to configure with:');
console.log('  cloud_name:', cloudConfig.cloud_name || '❌ MISSING');
console.log('  api_key:', cloudConfig.api_key ? '✅ Present' : '❌ MISSING');
console.log('  api_secret:', cloudConfig.api_secret ? '✅ Present' : '❌ MISSING');

cloudinary.config(cloudConfig);

/**
 * VALIDATE CONFIGURATION
 * WHY? Fail fast if credentials missing (instead of runtime errors later)
 */
const validateCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();

  console.log('[Cloudinary Validation] Config check:');
  console.log('  cloud_name exists:', !!cloud_name);
  console.log('  api_key exists:', !!api_key);
  console.log('  api_secret exists:', !!api_secret);

  if (!cloud_name || !api_key || !api_secret) {
    console.error('❌ Cloudinary configuration ERROR:'.red.bold);
    
    if (!cloud_name) console.error('   Missing: CLOUDINARY_CLOUD_NAME in .env'.red);
    if (!api_key) console.error('   Missing: CLOUDINARY_API_KEY in .env'.red);
    if (!api_secret) console.error('   Missing: CLOUDINARY_API_SECRET in .env'.red);
    
    console.error('\n💡 Get credentials at: https://cloudinary.com/console'.yellow);
    console.error('   Then add to backend/.env:\n   CLOUDINARY_CLOUD_NAME=your_cloud_name\n   CLOUDINARY_API_KEY=your_api_key\n   CLOUDINARY_API_SECRET=your_api_secret\n'.yellow);
    
    // Don't throw error (allow app to run without Cloudinary for testing)
    return false;
  }

  console.log('✅ Cloudinary configured successfully:'.green, cloud_name);
  return true;
};

// Validate on import
validateCloudinaryConfig();

export default cloudinary;
