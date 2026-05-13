/**
 * ===================================
 * SAVE MODEL (Bookmarks/Collections)
 * ===================================
 * 
 * Tracks which designs users have saved/bookmarked.
 * 
 * REAL-WORLD EXAMPLES:
 * - Dribbble: "Save this shot"
 * - Pinterest: "Save to board"
 * - Instagram: "Save post"
 * - Twitter: "Bookmark tweet"
 * 
 * WHY SEPARATE MODEL (vs array in Design)?
 * 
 * OPTION 1: Array in Design model ❌
 * {
 *   designId: "123",
 *   savedBy: ["user1", "user2", "user3", ...]
 * }
 * Problems:
 * - Can't query "all designs saved by user" efficiently
 * - Array grows unbounded (performance issues)
 * - Hard to add metadata (saved date, collection name)
 * 
 * OPTION 2: Separate Save model ✅
 * {
 *   userId: "user1",
 *   designId: "123",
 *   savedAt: "2024-01-17"
 * }
 * Benefits:
 * - Query "all saves by user" → Indexed, fast
 * - Query "all users who saved design" → Also indexed
 * - Can add folders/collections later
 * - Scales to millions of saves
 */

import mongoose from 'mongoose';

const saveSchema = new mongoose.Schema(
  {
    /**
     * USER WHO SAVED
     * Reference to User model
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true // Fast lookup: "all saves by user"
    },

    /**
     * DESIGN BEING SAVED
     * Reference to Design model
     */
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: [true, 'Design ID is required'],
      index: true // Fast lookup: "who saved this design"
    },

    /**
     * SAVE TIMESTAMP
     * When user saved this design
     * 
     * USE CASES:
     * - Show "Saved 2 days ago"
     * - Sort saved designs by recency
     * - Analytics: "Most saved designs this week"
     */
    savedAt: {
      type: Date,
      default: Date.now
    },

    /**
     * COLLECTION/FOLDER (Future enhancement)
     * Pinterest-style boards
     * 
     * EXAMPLES:
     * - "Web Design Inspiration"
     * - "Mobile UI Ideas"
     * - "Color Palettes"
     * 
     * For MVP: null (all saves in one collection)
     * Later: Add Collection model for organization
     */
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null
    },

    /**
     * NOTES (Future enhancement)
     * User can add private notes to saved designs
     * 
     * EXAMPLE:
     * "Love the color gradient! Use for project X"
     */
    notes: {
      type: String,
      maxlength: 500,
      default: ''
    }
  },
  {
    timestamps: true // Adds createdAt, updatedAt
  }
);

// ===================================
// INDEXES
// ===================================

/**
 * COMPOUND INDEX: userId + designId
 * 
 * WHY?
 * - Ensures user can't save same design twice
 * - Fast lookup: "Has user saved this design?"
 * 
 * QUERY:
 * Save.findOne({ userId: "abc", designId: "xyz" })
 * → Uses this index (very fast!)
 * 
 * UNIQUE ensures one save per user per design
 */
saveSchema.index({ userId: 1, designId: 1 }, { unique: true });

/**
 * INDEX: userId + savedAt
 * 
 * WHY?
 * Query: "Get all saves by user, sorted by date"
 * 
 * EXAMPLE:
 * Save.find({ userId: "abc" }).sort({ savedAt: -1 })
 * → Uses this index (fast!)
 */
saveSchema.index({ userId: 1, savedAt: -1 });

/**
 * INDEX: designId + savedAt
 * 
 * WHY?
 * Query: "Get all users who saved this design"
 * 
 * ANALYTICS:
 * "How many saves in last 7 days?"
 */
saveSchema.index({ designId: 1, savedAt: -1 });

// ===================================
// STATIC METHODS
// ===================================

/**
 * TOGGLE SAVE
 * 
 * If saved → Remove save
 * If not saved → Create save
 * 
 * RETURNS:
 * { saved: true/false, saveCount: number }
 * 
 * USAGE:
 * const result = await Save.toggleSave(userId, designId);
 * if (result.saved) {
 *   console.log("Design saved!");
 * } else {
 *   console.log("Design unsaved!");
 * }
 */
saveSchema.statics.toggleSave = async function (userId, designId) {
  const existingSave = await this.findOne({ userId, designId });

  if (existingSave) {
    // Already saved → Remove it
    await existingSave.deleteOne();

    // Get updated count
    const saveCount = await this.countDocuments({ designId });

    return {
      saved: false,
      saveCount
    };
  } else {
    // Not saved → Create save
    await this.create({ userId, designId });

    // Get updated count
    const saveCount = await this.countDocuments({ designId });

    return {
      saved: true,
      saveCount
    };
  }
};

/**
 * CHECK IF SAVED
 * 
 * Quick check without full document retrieval
 * 
 * USAGE:
 * const isSaved = await Save.isSaved(userId, designId);
 * if (isSaved) {
 *   console.log("User has saved this design");
 * }
 */
saveSchema.statics.isSaved = async function (userId, designId) {
  const count = await this.countDocuments({ userId, designId });
  return count > 0;
};

/**
 * GET USER'S SAVED DESIGNS
 * 
 * Paginated list with populated design data
 * 
 * USAGE:
 * const saves = await Save.getUserSaves(userId, { page: 1, limit: 20 });
 * 
 * RETURNS:
 * {
 *   saves: [ { designId: {...}, savedAt: "..." }, ... ],
 *   pagination: { page: 1, limit: 20, total: 45, pages: 3 }
 * }
 */
saveSchema.statics.getUserSaves = async function (userId, options = {}) {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const skip = (page - 1) * limit;

  const [saves, total] = await Promise.all([
    this.find({ userId })
      .sort({ savedAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'designId',
        select: 'title imageUrl thumbnailUrl userId likesCount commentsCount viewsCount createdAt',
        populate: {
          path: 'userId',
          select: 'username avatar'
        }
      }),
    this.countDocuments({ userId })
  ]);

  return {
    saves,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * GET SAVE COUNT FOR DESIGN
 * 
 * How many users saved this design
 * 
 * USAGE:
 * const count = await Save.getDesignSaveCount(designId);
 * console.log(`${count} users saved this design`);
 */
saveSchema.statics.getDesignSaveCount = async function (designId) {
  return await this.countDocuments({ designId });
};

// ===================================
// EXPORT
// ===================================

const Save = mongoose.model('Save', saveSchema);

export default Save;

/**
 * ===================================
 * USAGE EXAMPLES
 * ===================================
 * 
 * 1. SAVE A DESIGN
 * ──────────────────────────────────
 * const result = await Save.toggleSave(userId, designId);
 * 
 * Response:
 * { saved: true, saveCount: 42 }
 * 
 * 
 * 2. UNSAVE A DESIGN (Same method)
 * ──────────────────────────────────
 * const result = await Save.toggleSave(userId, designId);
 * 
 * Response:
 * { saved: false, saveCount: 41 }
 * 
 * 
 * 3. CHECK IF USER SAVED DESIGN
 * ──────────────────────────────────
 * const isSaved = await Save.isSaved(userId, designId);
 * 
 * if (isSaved) {
 *   // Show "Saved" button (filled heart)
 * } else {
 *   // Show "Save" button (outline heart)
 * }
 * 
 * 
 * 4. GET USER'S SAVED DESIGNS
 * ──────────────────────────────────
 * const { saves, pagination } = await Save.getUserSaves(userId, {
 *   page: 1,
 *   limit: 20
 * });
 * 
 * saves.forEach(save => {
 *   console.log(save.designId.title); // Populated design data
 *   console.log(save.savedAt);        // When saved
 * });
 * 
 * 
 * 5. GET SAVE COUNT
 * ──────────────────────────────────
 * const count = await Save.getDesignSaveCount(designId);
 * console.log(`${count} saves`);
 */

/**
 * ===================================
 * DATABASE QUERIES (Performance)
 * ===================================
 * 
 * ALL queries use indexes (fast!):
 * 
 * 1. Toggle save:
 *    findOne({ userId, designId })
 *    → Uses compound index (userId + designId)
 *    → O(log n) lookup
 * 
 * 2. Get user saves:
 *    find({ userId }).sort({ savedAt: -1 })
 *    → Uses index (userId + savedAt)
 *    → O(log n) + O(k) where k = limit
 * 
 * 3. Get save count:
 *    countDocuments({ designId })
 *    → Uses index (designId)
 *    → O(log n)
 * 
 * WITHOUT INDEXES:
 * All queries would be O(n) where n = total saves
 * With 1 million saves, could take seconds!
 * 
 * WITH INDEXES:
 * All queries are O(log n)
 * With 1 million saves, takes milliseconds!
 */

/**
 * ===================================
 * FUTURE ENHANCEMENTS
 * ===================================
 * 
 * 1. COLLECTIONS/BOARDS (Pinterest-style)
 * ──────────────────────────────────
 * Create Collection model:
 * {
 *   userId: ObjectId,
 *   name: "Web Design Inspiration",
 *   description: "Cool websites I found",
 *   isPublic: true,
 *   coverImage: "url"
 * }
 * 
 * Update Save model:
 * {
 *   userId: ObjectId,
 *   designId: ObjectId,
 *   collectionId: ObjectId ← Link to collection
 * }
 * 
 * 
 * 2. SAVE NOTES
 * ──────────────────────────────────
 * Allow users to add private notes:
 * {
 *   designId: "123",
 *   notes: "Love the gradient! Use for Project X"
 * }
 * 
 * 
 * 3. SAVE ANALYTICS
 * ──────────────────────────────────
 * Track save trends:
 * - "Most saved designs this week"
 * - "Your saves are 3x above average"
 * - "Designer gets notification: User X saved your design"
 * 
 * 
 * 4. COLLABORATIVE COLLECTIONS
 * ──────────────────────────────────
 * Multiple users can contribute to one collection
 * Like Pinterest team boards
 */
