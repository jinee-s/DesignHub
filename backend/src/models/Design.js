/**
 * ===================================
 * DESIGN MODEL (MONGOOSE SCHEMA)
 * ===================================
 * 
 * This schema represents a design post (like a "shot" on Dribbble).
 * 
 * DESIGN DECISIONS:
 * 1. User reference (ObjectId) instead of embedding
 * 2. Likes as array of user IDs (embedded for MVP, can be separate later)
 * 3. Tags array for search/filter functionality
 * 4. View count incremented on each view
 * 5. Soft delete with isDeleted flag
 * 
 * RELATIONSHIPS:
 * - One User → Many Designs (one-to-many)
 * - One Design → Many Likes (embedded for simplicity)
 * - One Design → Many Comments (referenced in Comment model)
 */

import mongoose from 'mongoose';

const designSchema = new mongoose.Schema(
  {
    /**
     * TITLE
     * WHY: Main headline of the design
     * EXAMPLE: "Modern Dashboard UI", "E-commerce Landing Page"
     * VALIDATION: Required, 5-100 characters
     */
    title: {
      type: String,
      required: [true, 'Design title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },

    /**
     * DESCRIPTION
     * WHY: Detailed explanation of the design
     * EXAMPLE: "A clean and modern dashboard design for SaaS products..."
     * VALIDATION: Optional, max 1000 chars
     */
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    /**
     * IMAGE URL (Main Design Image)
     * WHY: The actual design (stored on Cloudinary)
     * REQUIRED: Every design must have an image
     * 
     * STORAGE DECISION:
     * ❌ Don't store image in MongoDB (16MB limit)
     * ✅ Store Cloudinary URL (string)
     * 
     * EXAMPLE: "https://res.cloudinary.com/designhub/image/upload/v1234/design.jpg"
     */
    imageUrl: {
      type: String,
      required: [true, 'Design image is required']
    },

    /**
     * THUMBNAIL URL (Optimized Small Version)
     * WHY: Load thumbnails in feed (faster), full image on detail page
     * 
     * PERFORMANCE:
     * - Feed page: Load 20 thumbnails (500KB each) = 10 MB
     * - Without thumbnails: Load 20 full images (2MB each) = 40 MB!
     * 
     * REAL-WORLD: Instagram, Pinterest, Dribbble all use thumbnails
     */
    thumbnailUrl: {
      type: String,
      required: [true, 'Thumbnail is required']
    },

    /**
     * CLOUDINARY PUBLIC ID
     * WHY: Delete image from Cloudinary when design is deleted
     * EXAMPLE: "designhub/abc123xyz"
     * 
     * USAGE:
     * await cloudinary.uploader.destroy(design.cloudinaryId);
     */
    cloudinaryId: {
      type: String,
      required: true
    },

    /**
     * USER ID (Who Created This Design)
     * WHY: Reference to User model (relationship)
     * TYPE: ObjectId (MongoDB unique identifier)
     * 
     * RELATIONSHIP DESIGN:
     * ✅ REFERENCE (separate documents)
     * ❌ EMBED (copy entire user object)
     * 
     * WHY REFERENCE?
     * - User data changes (avatar, bio) → Don't want to update 100 designs
     * - Query "all designs by user X" → Easy with userId
     * - Normalize data (single source of truth)
     * 
     * WHEN TO EMBED?
     * - Data never changes (e.g., product order with user name at time of purchase)
     * - Small subdocuments (e.g., address with street, city, zip)
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // References User model
      required: [true, 'User ID is required'],
      index: true  // Index for fast "find designs by user" queries
    },

    /**
     * TAGS
     * WHY: Categorize and search designs
     * EXAMPLE: ["dashboard", "ui", "saas", "modern"]
     * STORED AS: Array of strings
     * 
     * USAGE:
     * - Search: "Show me all 'dashboard' designs"
     * - Filter: "Show designs where tags include 'ui' OR 'ux'"
     * 
     * VALIDATION: Max 10 tags, each max 20 chars
     */
    tags: {
      type: [String],
      validate: {
        validator: function(tags) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags'
      },
      default: []
    },

    /**
     * CATEGORY
     * WHY: Broader classification than tags
     * EXAMPLE: "Web Design", "Mobile UI", "Illustration", "Branding"
     * VALIDATION: Limited to specific categories (enum)
     * 
     * REAL-WORLD: Dribbble has categories (Animation, Branding, Illustration, etc.)
     */
    category: {
      type: String,
      enum: [
        'Web Design',
        'Mobile UI',
        'Illustration',
        'Branding',
        'Typography',
        'Icon Design',
        'Logo Design',
        'Print Design',
        'Product Design',
        'Other'
      ],
      default: 'Other'
    },

    /**
     * LIKES (Array of User IDs Who Liked)
     * WHY: Track who liked this design
     * STORED AS: Array of ObjectIds
     * 
     * DESIGN DECISION: Embedded vs Separate Collection
     * 
     * OPTION A (Current - Embedded Array):
     * ✅ Pros: 
     *    - Simple to implement
     *    - Fast check: "Did user X like this?" → likes.includes(userId)
     *    - Fast count: likes.length
     * ❌ Cons:
     *    - 16MB document limit (max ~500,000 likes)
     *    - Entire array loaded even if just counting
     * 
     * OPTION B (Separate Collection - Scalable):
     * ✅ Pros:
     *    - Unlimited likes
     *    - Query "designs liked by user X" easier
     *    - Can add timestamp (when liked)
     * ❌ Cons:
     *    - Extra query to count likes
     *    - More complex code
     * 
     * RECOMMENDATION:
     * - MVP: Use embedded array (simple)
     * - Scale (10K+ users): Switch to separate Like model
     * - Instagram, Twitter use separate collection
     */
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    /**
     * LIKE COUNT (Denormalized)
     * WHY: Fast access without counting array every time
     * UPDATED: Incremented/decremented when user likes/unlikes
     * 
     * DENORMALIZATION PATTERN:
     * - Store count separately (duplicate data)
     * - Faster reads (don't count likes array)
     * - Trade-off: Must keep in sync with likes array
     * 
     * REAL-WORLD: YouTube, Twitter show counts instantly (denormalized)
     */
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    },

    /**
     * VIEWS (Impression Count)
     * WHY: Track popularity (trending algorithm)
     * INCREMENTED: Each time design detail page is viewed
     * 
     * IMPLEMENTATION:
     * POST /api/designs/:id/view → views++
     * 
     * REAL-WORLD:
     * - Medium shows "5.2K views"
     * - YouTube uses views for recommendations
     */
    views: {
      type: Number,
      default: 0,
      min: 0
    },

    /**
     * COMMENT COUNT (Denormalized)
     * WHY: Show "24 comments" without counting Comment collection
     * UPDATED: Incremented when comment added, decremented when deleted
     */
    commentsCount: {
      type: Number,
      default: 0,
      min: 0
    },

    /**
     * IS FEATURED
     * WHY: Admins can feature exceptional designs
     * USAGE: Show featured designs on homepage
     * DEFAULT: false (only admins can set to true)
     */
    isFeatured: {
      type: Boolean,
      default: false,
      index: true // Index for fast "get featured designs" query
    },

    /**
     * IS DELETED (Soft Delete)
     * WHY: Don't permanently delete (can restore if needed)
     * DELETED DESIGNS: Marked as deleted but not removed from DB
     * 
     * HARD DELETE vs SOFT DELETE:
     * 
     * Hard Delete:
     * ✅ Free up space
     * ❌ Can't restore
     * ❌ Breaks relationships (comments reference deleted design)
     * 
     * Soft Delete:
     * ✅ Can restore
     * ✅ Keeps data integrity
     * ❌ Takes up space
     * 
     * REAL-WORLD: Gmail (trash), GitHub (deleted repos can be restored)
     */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true // Index for "find non-deleted designs" query
    },

    /**
     * DELETED AT
     * WHY: Track when design was deleted
     * USAGE: Auto-delete after 30 days
     */
    deletedAt: {
      type: Date,
      default: null
    },

    /**
     * STATUS
     * WHY: Moderation (pending, approved, rejected)
     * FUTURE: Admin review before design goes live
     * DEFAULT: 'approved' (auto-approve for MVP)
     */
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    }
  },
  {
    /**
     * TIMESTAMPS
     * AUTO-CREATES: createdAt, updatedAt
     * USAGE: 
     * - "Posted 2 hours ago"
     * - Sort by newest/oldest
     */
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===================================
// INDEXES (Query Optimization)
// ===================================

/**
 * COMPOUND INDEX: userId + createdAt
 * WHY: Speed up "get user's designs sorted by date"
 * QUERY: Design.find({ userId: 'xyz' }).sort({ createdAt: -1 })
 * 
 * WITHOUT INDEX: Scans all designs → Filters by userId → Sorts
 * WITH INDEX: Uses index → Returns sorted results instantly
 */
designSchema.index({ userId: 1, createdAt: -1 });

/**
 * INDEX: tags
 * WHY: Fast tag searches
 * QUERY: Design.find({ tags: 'ui' })
 */
designSchema.index({ tags: 1 });

/**
 * INDEX: category
 * WHY: Filter by category
 */
designSchema.index({ category: 1 });

/**
 * INDEX: likesCount (descending)
 * WHY: Sort by popularity (trending)
 * QUERY: Design.find().sort({ likesCount: -1 })
 */
designSchema.index({ likesCount: -1 });

/**
 * INDEX: createdAt (descending)
 * WHY: Show newest designs first
 */
designSchema.index({ createdAt: -1 });

/**
 * TEXT INDEX: title + description
 * WHY: Full-text search
 * USAGE: Design.find({ $text: { $search: 'modern dashboard' } })
 * 
 * REAL-WORLD: Google-like search within designs
 */
designSchema.index({ title: 'text', description: 'text' });

// ===================================
// VIRTUALS (Computed Fields)
// ===================================

/**
 * VIRTUAL: comments
 * WHY: Populate comments when needed
 * USAGE:
 * const design = await Design.findById(id).populate('comments');
 * console.log(design.comments); // Array of comment objects
 */
designSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',      // Design's _id
  foreignField: 'designId' // Comment's designId field
});

// ===================================
// INSTANCE METHODS
// ===================================

/**
 * INCREMENT VIEW COUNT
 * WHY: Track impressions
 * USAGE: await design.incrementViews();
 */
designSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

/**
 * TOGGLE LIKE
 * WHY: Add/remove user from likes array
 * RETURNS: { liked: true/false, likesCount: number }
 * 
 * LOGIC:
 * - If user already liked → Remove from array (unlike)
 * - If user not liked → Add to array (like)
 */
designSchema.methods.toggleLike = async function(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const index = this.likes.indexOf(userObjectId);

  if (index > -1) {
    // Unlike
    this.likes.splice(index, 1);
    this.likesCount = Math.max(0, this.likesCount - 1);
  } else {
    // Like
    this.likes.push(userObjectId);
    this.likesCount += 1;
  }

  await this.save();

  return {
    liked: index === -1, // true if just liked, false if unliked
    likesCount: this.likesCount
  };
};

/**
 * CHECK IF USER LIKED
 * WHY: Show "heart filled" or "heart outline" in UI
 * USAGE: const hasLiked = design.isLikedByUser(userId);
 */
designSchema.methods.isLikedByUser = function(userId) {
  return this.likes.some(id => id.toString() === userId.toString());
};

/**
 * SOFT DELETE
 * WHY: Mark as deleted without removing from DB
 */
designSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

// ===================================
// STATIC METHODS
// ===================================

/**
 * GET TRENDING DESIGNS
 * WHY: Homepage "Trending" section
 * ALGORITHM: Most likes in last 7 days
 */
designSchema.statics.getTrending = function(limit = 20) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return this.find({
    isDeleted: false,
    status: 'approved',
    createdAt: { $gte: sevenDaysAgo }
  })
    .sort({ likesCount: -1, views: -1 })
    .limit(limit)
    .populate('userId', 'username avatar fullName');
};

/**
 * SEARCH DESIGNS
 * WHY: Search bar functionality
 * USAGE: await Design.searchDesigns('dashboard ui');
 */
designSchema.statics.searchDesigns = function(query, options = {}) {
  const { limit = 20, category, tags } = options;

  const searchQuery = {
    isDeleted: false,
    status: 'approved',
    $text: { $search: query }
  };

  if (category) searchQuery.category = category;
  if (tags && tags.length) searchQuery.tags = { $in: tags };

  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } }) // Relevance score
    .limit(limit)
    .populate('userId', 'username avatar fullName');
};

/**
 * GET BY TAGS
 * WHY: Filter by multiple tags
 * USAGE: await Design.getByTags(['ui', 'dashboard']);
 */
designSchema.statics.getByTags = function(tags, limit = 20) {
  return this.find({
    isDeleted: false,
    status: 'approved',
    tags: { $in: tags }
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username avatar fullName');
};

// ===================================
// QUERY MIDDLEWARE (Pre-find Hook)
// ===================================

/**
 * EXCLUDE DELETED DESIGNS BY DEFAULT
 * WHY: Don't show deleted designs in queries
 * 
 * RUNS BEFORE: find, findOne, findById, etc.
 * ADDS: { isDeleted: false } to all queries
 * 
 * OVERRIDE: Design.findDeleted() or Design.find().setOptions({ includeDeleted: true })
 */
designSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: false });
  }
  next();
});

// ===================================
// EXPORT MODEL
// ===================================

const Design = mongoose.model('Design', designSchema);

export default Design;

/**
 * ===================================
 * RELATIONSHIP SUMMARY
 * ===================================
 * 
 * User ──< Design (One-to-Many)
 *   One user can create many designs
 *   Each design belongs to one user
 *   Implemented: userId field (reference)
 * 
 * Design >──< User (Many-to-Many via Likes)
 *   One design can be liked by many users
 *   One user can like many designs
 *   Implemented: likes array (embedded)
 * 
 * Design ──< Comment (One-to-Many)
 *   One design can have many comments
 *   Each comment belongs to one design
 *   Implemented: Virtual populate (Comment model has designId)
 */

/**
 * ===================================
 * SCALING CONSIDERATIONS
 * ===================================
 * 
 * CURRENT DESIGN (Good for < 100K designs):
 * ✅ Likes as embedded array
 * ✅ Denormalized counts (fast reads)
 * ✅ Soft delete
 * 
 * WHEN TO REFACTOR (> 100K designs):
 * 
 * 1. SEPARATE LIKE COLLECTION
 *    Problem: Design with 10K likes = slow to load
 *    Solution: Create Like model with designId, userId, createdAt
 * 
 * 2. REDIS CACHING
 *    Problem: Popular designs queried frequently
 *    Solution: Cache top designs in Redis (10x faster)
 * 
 * 3. CDN FOR IMAGES
 *    Problem: 1M designs = slow image loading
 *    Solution: Cloudinary CDN (already implemented!)
 * 
 * 4. SHARDING
 *    Problem: Single MongoDB server can't handle 10M designs
 *    Solution: Split across multiple servers (by userId or createdAt)
 * 
 * 5. ELASTICSEARCH
 *    Problem: MongoDB text search limited
 *    Solution: Use Elasticsearch for advanced search
 */
