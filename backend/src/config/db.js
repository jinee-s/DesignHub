/**
 * ===================================
 * MONGODB CONNECTION CONFIGURATION
 * ===================================
 * 
 * This file handles the database connection using Mongoose.
 * 
 * FEATURES:
 * - Connection pooling via Mongoose
 * - Retry logic with exponential backoff for reliability
 * - Event listeners to monitor connection health
 * - Graceful error handling
 * 
 * PRODUCTION: This setup ensures the app can handle temporary DB outages
 */

import mongoose from 'mongoose';
import colors from 'colors';

const connectDB = async (maxRetries = 5, initialDelay = 2000) => {
  let retryCount = 0;

  const attemptConnection = async () => {
    try {
      /**
       * MONGOOSE CONNECTION OPTIONS
       * These are best practices for production apps
       */
      const options = {
        // Connection pool size (default 10)
        maxPoolSize: 10,
        // Timeout for connection attempts (30 seconds)
        serverSelectionTimeoutMS: 30000,
        // Socket timeout (45 seconds)
        socketTimeoutMS: 45000,
      };

      /**
       * CONNECT TO MONGODB
       * process.env.MONGO_URI comes from .env file
       */
      const conn = await mongoose.connect(process.env.MONGO_URI, options);

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
      console.log(`📊 Database: ${conn.connection.name}`.cyan);
      console.log(`🔄 Connection Pool: 10 connections`.cyan);

      /**
       * CONNECTION EVENT LISTENERS
       * WHY? Monitor database health in production
       */
      mongoose.connection.on('connected', () => {
        if (process.env.NODE_ENV !== 'test') {
          console.log('✅ Mongoose connected to MongoDB'.green);
        }
      });

      mongoose.connection.on('error', (err) => {
        console.log(`❌ Mongoose connection error: ${err.message}`.red.bold);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  Mongoose disconnected from MongoDB'.yellow);
      });

      return true; // Success
    } catch (error) {
      retryCount++;

      if (retryCount >= maxRetries) {
        console.log(`\n❌ Error connecting to MongoDB after ${maxRetries} retries: ${error.message}`.red.bold);
        
        /**
         * LOCAL DEVELOPMENT HELP
         * If running locally and MongoDB isn't installed:
         * - Windows: Download MongoDB Community Edition from mongodb.com/try/download/community
         * - Mac: brew install mongodb-community
         * - Linux: apt-get install mongodb-org (Ubuntu/Debian)
         * - Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
         * 
         * Then start MongoDB:
         * - Windows: mongod.exe (from C:\Program Files\MongoDB\Server\VERSION\bin)
         * - Mac/Linux: mongod
         * 
         * Or use MongoDB Atlas (cloud): Update MONGO_URI in .env
         * mongodb+srv://username:password@cluster.mongodb.net/designhub
         */
        console.log(`\n💡 LOCAL MONGODB SETUP GUIDE:`.cyan.bold);
        console.log('  Option 1: Install MongoDB locally');
        console.log('    Windows: Download from mongodb.com/try/download/community');
        console.log('    Mac: brew install mongodb-community');
        console.log('    Linux: apt-get install mongodb-org');
        console.log('');
        console.log('  Option 2: Use Docker');
        console.log('    docker run -d -p 27017:27017 --name mongodb mongo:latest');
        console.log('');
        console.log('  Option 3: Use MongoDB Atlas (cloud)');
        console.log('    Sign up: mongodb.com/cloud/atlas');
        console.log('    Update MONGO_URI in .env with your connection string'.cyan);
        console.log('');
        
        /**
         * EXIT PROCESS ON FAILURE
         * WHY? If database is down, app can't function
         * In production (Docker/Kubernetes), container orchestration will restart the app
         * Exit code 1 = failure (0 = success)
         */
        process.exit(1);
      }

      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const delay = initialDelay * Math.pow(2, retryCount - 1);
      console.log(
        `⏳ Retry ${retryCount}/${maxRetries} in ${delay / 1000}s... (${error.message.slice(0, 50)})`.yellow
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry connection
      return attemptConnection();
    }
  };

  return attemptConnection();
};

export default connectDB;

/**
 * ===================================
 * COMMON BEGINNER MISTAKES TO AVOID
 * ===================================
 * 
 * 1. ❌ Not using environment variables
 *    Don't hardcode: mongoose.connect('mongodb://localhost...')
 *    ✅ Use: process.env.MONGO_URI
 * 
 * 2. ❌ Not handling connection errors
 *    Always wrap in try-catch or .catch()
 * 
 * 3. ❌ Creating new connection on every request
 *    ✅ Connect once at startup (like we do here)
 * 
 * 4. ❌ Not closing connections in tests
 *    Use mongoose.connection.close() after tests
 * 
 * 5. ❌ No retry logic
 *    ✅ We use exponential backoff (2s, 4s, 8s, ...)
 * 
 * PRODUCTION DEPLOYMENT:
 * - AWS/Render/Heroku will automatically restart on exit(1)
 * - Kubernetes will restart pod on SIGTERM
 * - This pattern ensures app doesn't stay broken if DB is temporarily down
 */

/**
 * ===================================
 * PRODUCTION ENHANCEMENTS (Optional)
 * ===================================
 * 
 * For large-scale apps, add:
 * 
 * 1. Connection Pooling:
 *    maxPoolSize: 10  // Max simultaneous connections
 * 
 * 2. Retry Logic:
 *    retryWrites: true
 *    retryReads: true
 * 
 * 3. Timeouts:
 *    serverSelectionTimeoutMS: 5000
 *    socketTimeoutMS: 45000
 * 
 * Example:
 * const options = {
 *   maxPoolSize: 10,
 *   serverSelectionTimeoutMS: 5000,
 *   socketTimeoutMS: 45000,
 * };
 */
