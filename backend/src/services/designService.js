/**
 * ===================================
 * DESIGN SERVICE LAYER
 * ===================================
 * 
 * Business logic for design operations.
 * 
 * WHY SEPARATE SERVICE LAYER?
 * ════════════════════════════════════
 * 
 * ARCHITECTURE PATTERN:
 * Routes → Controllers → Services → Models → Database
 * 
 * LAYER RESPONSIBILITIES:
 * ────────────────────────────────────
 * 
 * 1. ROUTES (designRoutes.js)
 *    - Define URL patterns
 *    - Map HTTP methods to controllers
 *    - Apply middleware (auth, validation)
 *    Example: app.post('/designs', protect, createDesign)
 * 
 * 2. CONTROLLERS (designController.js)
 *    - Handle HTTP request/response
 *    - Extract data from req (body, params, query)
 *    - Call service methods
 *    - Return HTTP responses with status codes
 *    - NO business logic!
 * 
 * 3. SERVICES (designService.js) ← THIS FILE
 *    - Business logic and rules
 *    - Coordinate multiple models
 *    - Reusable functions
 *    - NO HTTP knowledge (no res.json, no status codes)
 * 
 * 4. MODELS (Design.js, User.js, etc.)
 *    - Database schema
 *    - Validation rules
 *    - Simple methods (save, find, update)
 * 
 * 
 * BENEFITS OF SEPARATION:
 * ────────────────────────────────────
 * 
 * ✅ REUSABILITY
 *    Service methods can be called from:
 *    - REST API controllers
 *    - GraphQL resolvers
 *    - Background jobs (cron)
 *    - CLI scripts
 *    - WebSocket handlers
 * 
 * ✅ TESTABILITY
 *    Test business logic without HTTP:
 *    const result = await designService.createDesign(data);
 *    expect(result.title).toBe("Test Design");
 *    (No need to mock req/res!)
 * 
 * ✅ MAINTAINABILITY
 *    Change business logic in one place:
 *    - If "only premium users can upload 10+ designs" changes
 *    - Update service, not every controller
 * 
 * ✅ SINGLE RESPONSIBILITY
 *    - Controller: HTTP handling
 *    - Service: Business rules
 *    - Model: Data structure
 * 
 * 
 * REAL-WORLD USAGE:
 * ────────────────────────────────────
 * - Netflix: Service layer for recommendations
 * - Uber: Service layer for ride matching
 * - Airbnb: Service layer for booking rules
 * - Stripe: Service layer for payment processing
 */

import Design from '../models/Design.js';
import Save from '../models/Save.js';
import User from '../models/User.js';
import { deleteFromCloudinary } from '../middleware/uploadMiddleware.js';

/**
 * ===================================
 * CREATE DESIGN
 * ===================================
 * 
 * Business logic for creating a new design post.
 * 
 * @param {Object} designData - Design information
 * @param {String} userId - User creating the design
 * @returns {Object} Created design with populated user data
 * 
 * BUSINESS RULES:
 * - User must be authenticated (checked by controller)
 * - Title is required
 * - At least one image required
 * - Tags limited to 10
 * - Category must be valid enum value
 */
export const createDesign = async (designData, userId) => {
  const {
    title,
    description,
    imageUrl,
    thumbnailUrl,
    cloudinaryId,
    tags,
    category
  } = designData;

  // Create design
  const design = await Design.create({
    title,
    description,
    imageUrl,
    thumbnailUrl,
    cloudinaryId,
    userId,
    tags: tags || [],
    category: category || 'other'
  });

  console.log('[UPLOAD] DB saved:', { designId: design._id, cloudinaryId, category });

  // Populate user data before returning
  await design.populate({
    path: 'userId',
    select: 'username avatar bio'
  });

  return design;
};

/**
 * ===================================
 * GET ALL DESIGNS (WITH PAGINATION)
 * ===================================
 * 
 * Fetch designs with filtering, sorting, and pagination.
 * 
 * @param {Object} options - Query options
 * @returns {Object} Designs array with pagination metadata
 * 
 * PAGINATION LOGIC:
 * ════════════════════════════════════
 * 
 * WHY PAGINATION?
 * ────────────────────────────────────
 * - Database has 10,000 designs
 * - Sending all at once:
 *   ❌ Slow query (seconds)
 *   ❌ Large payload (megabytes)
 *   ❌ Browser freezes rendering
 *   ❌ Poor UX (user sees nothing while loading)
 * 
 * - Sending 20 at a time:
 *   ✅ Fast query (milliseconds)
 *   ✅ Small payload (kilobytes)
 *   ✅ Smooth rendering
 *   ✅ Infinite scroll works great
 * 
 * 
 * PAGINATION FORMULA:
 * ────────────────────────────────────
 * page = 1, limit = 20
 * skip = (page - 1) × limit = 0
 * → Return items 0-19 (first 20)
 * 
 * page = 2, limit = 20
 * skip = (page - 1) × limit = 20
 * → Return items 20-39 (second 20)
 * 
 * page = 3, limit = 20
 * skip = (page - 1) × limit = 40
 * → Return items 40-59 (third 20)
 * 
 * 
 * TOTAL PAGES CALCULATION:
 * ────────────────────────────────────
 * total = 100 designs
 * limit = 20 per page
 * pages = Math.ceil(100 / 20) = 5
 * 
 * total = 95 designs
 * limit = 20 per page
 * pages = Math.ceil(95 / 20) = 5 (last page has only 15)
 * 
 * 
 * PAGINATION STRATEGIES:
 * ────────────────────────────────────
 * 
 * 1. OFFSET PAGINATION (skip/limit) ← We use this
 *    Pros:
 *    ✅ Simple to implement
 *    ✅ Can jump to any page
 *    ✅ Works with total count
 *    Cons:
 *    ❌ Performance degrades with large skip
 *    ❌ Data inconsistency (items move between pages)
 *    Used by: Google Search, Amazon products
 * 
 * 2. CURSOR PAGINATION (last ID)
 *    Query: designs after ID "abc123"
 *    Pros:
 *    ✅ Fast for large datasets
 *    ✅ No data inconsistency
 *    Cons:
 *    ❌ Can't jump to page 5
 *    ❌ No total count
 *    Used by: Twitter feed, Facebook feed
 * 
 * 3. KEYSET PAGINATION (last created date)
 *    Query: designs created before "2024-01-15"
 *    Pros:
 *    ✅ Very fast
 *    ✅ Consistent
 *    Cons:
 *    ❌ Complex queries
 *    ❌ Requires unique sortable field
 *    Used by: GraphQL connections
 * 
 * FOR MVP: Offset pagination (simple, familiar to users)
 * FOR SCALE: Switch to cursor for infinite scroll
 */
export const getAllDesigns = async (options = {}) => {
  // Extract pagination options
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const skip = (page - 1) * limit;

  // Extract filter options
  const { category, tags, userId, search, sortBy } = options;

  // Build query filter
  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (tags && tags.length > 0) {
    // Find designs with ANY of the provided tags
    filter.tags = { $in: tags };
  }

  if (userId) {
    // Filter by specific user
    filter.userId = userId;
  }

  if (search) {
    // Text search in title and description
    filter.$text = { $search: search };
  }

  // Build sort option
  let sort = { createdAt: -1 }; // Default: newest first

  if (sortBy === 'popular') {
    sort = { likesCount: -1, viewsCount: -1 };
  } else if (sortBy === 'trending') {
    // Designs with most likes in last 7 days (handled by Design.getTrending)
    // For now, use popular sort
    sort = { likesCount: -1 };
  } else if (sortBy === 'views') {
    sort = { viewsCount: -1 };
  } else if (sortBy === 'oldest') {
    sort = { createdAt: 1 };
  }

  // Execute queries in parallel (faster!)
  const [designs, total] = await Promise.all([
    Design.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'username avatar bio'
      })
      .lean(), // Convert to plain JS objects (faster)
    Design.countDocuments(filter)
  ]);

  return {
    designs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
};

/**
 * ===================================
 * GET DESIGN BY ID
 * ===================================
 * 
 * Fetch single design with full details.
 * Also increments view count.
 * 
 * @param {String} designId - Design ID
 * @param {String} currentUserId - Current user (optional, for saved status)
 * @returns {Object} Design with user data and interaction status
 */
export const getDesignById = async (designId, currentUserId = null) => {
  const design = await Design.findById(designId).populate({
    path: 'userId',
    select: 'username avatar bio followersCount'
  });

  if (!design) {
    throw new Error('Design not found');
  }

  // Increment view count
  await design.incrementViews();

  // If user is logged in, check if they liked/saved this design
  let isLiked = false;
  let isSaved = false;

  if (currentUserId) {
    isLiked = design.likes.includes(currentUserId);
    isSaved = await Save.isSaved(currentUserId, designId);
  }

  return {
    ...design.toObject(),
    isLiked,
    isSaved
  };
};

/**
 * ===================================
 * UPDATE DESIGN
 * ===================================
 * 
 * Update design details (owner only).
 * 
 * @param {String} designId - Design ID
 * @param {String} userId - User requesting update
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated design
 * 
 * BUSINESS RULES:
 * - Only owner can update
 * - Can't change userId (ownership)
 * - Can't update likes/views (system-managed)
 */
export const updateDesign = async (designId, userId, updateData) => {
  const design = await Design.findById(designId);

  if (!design) {
    throw new Error('Design not found');
  }

  // Check ownership
  if (design.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to update this design');
    error.statusCode = 403; // Forbidden
    throw error;
  }

  // Allowed fields to update
  const allowedUpdates = [
    'title',
    'description',
    'tags',
    'category',
    'imageUrl',
    'thumbnailUrl',
    'cloudinaryId'
  ];

  // Apply updates
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      design[field] = updateData[field];
    }
  });

  await design.save();

  await design.populate({
    path: 'userId',
    select: 'username avatar bio'
  });

  return design;
};

/**
 * ===================================
 * DELETE DESIGN
 * ===================================
 * 
 * Soft delete design (owner only).
 * 
 * SOFT DELETE vs HARD DELETE:
 * ════════════════════════════════════
 * 
 * HARD DELETE (Permanent)
 * await Design.findByIdAndDelete(id);
 * ❌ Data lost forever
 * ❌ Can't undo
 * ❌ Breaks references (comments become orphans)
 * 
 * SOFT DELETE (Recoverable)
 * design.isDeleted = true;
 * design.deletedAt = new Date();
 * ✅ Can restore later
 * ✅ References intact
 * ✅ Audit trail (who deleted, when)
 * ✅ GDPR compliance (mark for deletion)
 * 
 * REAL-WORLD:
 * - Gmail: Trash folder (30 days before permanent delete)
 * - Twitter: Deactivated accounts (30 days to restore)
 * - GitHub: Deleted repos (90 days to restore)
 */
export const deleteDesign = async (designId, userId) => {
  const design = await Design.findById(designId);

  if (!design) {
    throw new Error('Design not found');
  }

  // Check ownership
  if (design.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to delete this design');
    error.statusCode = 403;
    throw error;
  }

  // Delete image from Cloudinary before soft deleting
  if (design.cloudinaryId) {
    try {
      await deleteFromCloudinary(design.cloudinaryId);
      console.log('[UPLOAD] Deleted from Cloudinary:', design.cloudinaryId);
    } catch (error) {
      // Log error but don't fail the delete operation
      // Image deletion failure doesn't prevent design soft delete
      console.error('[UPLOAD] Failed to delete from Cloudinary:', design.cloudinaryId, error.message);
    }
  }

  // Soft delete
  design.isDeleted = true;
  design.deletedAt = new Date();
  await design.save();

  return { message: 'Design deleted successfully' };
};

/**
 * ===================================
 * TOGGLE LIKE
 * ===================================
 * 
 * Like or unlike a design.
 * 
 * @param {String} designId - Design to like
 * @param {String} userId - User liking
 * @returns {Object} { liked: boolean, likesCount: number }
 */
export const toggleLike = async (designId, userId) => {
  const design = await Design.findById(designId);

  if (!design) {
    throw new Error('Design not found');
  }

  const result = await design.toggleLike(userId);

  return result;
};

/**
 * ===================================
 * TOGGLE SAVE
 * ===================================
 * 
 * Save or unsave a design (bookmark).
 * 
 * @param {String} designId - Design to save
 * @param {String} userId - User saving
 * @returns {Object} { saved: boolean, saveCount: number }
 */
export const toggleSave = async (designId, userId) => {
  // Verify design exists
  const design = await Design.findById(designId);

  if (!design) {
    throw new Error('Design not found');
  }

  const result = await Save.toggleSave(userId, designId);

  return result;
};

/**
 * ===================================
 * GET USER'S SAVED DESIGNS
 * ===================================
 * 
 * Fetch all designs saved by a user.
 * 
 * @param {String} userId - User ID
 * @param {Object} options - Pagination options
 * @returns {Object} Saved designs with pagination
 */
export const getUserSavedDesigns = async (userId, options = {}) => {
  const result = await Save.getUserSaves(userId, options);
  return result;
};

/**
 * ===================================
 * GET TRENDING DESIGNS
 * ===================================
 * 
 * Designs with most engagement in last 7 days.
 * 
 * TRENDING ALGORITHM:
 * ════════════════════════════════════
 * 
 * SIMPLE: Most likes in last 7 days
 * 
 * ADVANCED (Future):
 * score = (likes × 3) + (comments × 2) + (views × 0.1)
 * timeDecay = 1 / (days_old + 1)
 * trendingScore = score × timeDecay
 * 
 * REAL-WORLD:
 * - Reddit: Upvotes + time decay
 * - Hacker News: Points / (hours + 2)^1.8
 * - Product Hunt: Upvotes within 24 hours
 */
export const getTrendingDesigns = async (options = {}) => {
  const limit = parseInt(options.limit) || 20;

  const designs = await Design.getTrending(limit);

  return designs;
};
