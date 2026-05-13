/**
 * ===================================
 * COMMENT MODEL (MONGOOSE SCHEMA)
 * ===================================
 * 
 * This schema represents comments on designs (like Dribbble comments).
 * 
 * DESIGN DECISIONS:
 * 1. Reference both User and Design (two relationships)
 * 2. Support nested replies (optional for MVP, structure ready)
 * 3. Like feature for comments (optional)
 * 4. Soft delete to preserve conversation context
 * 
 * RELATIONSHIPS:
 * - User ──< Comment (one user can write many comments)
 * - Design ──< Comment (one design can have many comments)
 * - Comment ──< Comment (optional: comments can reply to comments)
 */

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    /**
     * CONTENT (Comment Text)
     * WHY: The actual comment message
     * EXAMPLE: "Love the color palette! 🎨"
     * VALIDATION: Required, 1-500 characters
     * 
     * SECURITY: Should sanitize HTML to prevent XSS attacks
     * (We'll add sanitization in controller)
     */
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },

    /**
     * DESIGN ID (Which Design Is This Comment On?)
     * WHY: Link comment to design
     * TYPE: ObjectId reference to Design model
     * 
     * RELATIONSHIP: Comment belongs to one Design
     * USAGE: Find all comments for design X
     * QUERY: Comment.find({ designId: 'xyz' })
     */
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: [true, 'Design ID is required'],
      index: true // Index for fast "get comments by design" query
    },

    /**
     * USER ID (Who Wrote This Comment?)
     * WHY: Link comment to author
     * TYPE: ObjectId reference to User model
     * 
     * RELATIONSHIP: Comment belongs to one User
     * USAGE: Show commenter's name and avatar
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true // Index for "get user's comments" query
    },

    /**
     * PARENT COMMENT ID (Optional - For Nested Replies)
     * WHY: Support threaded conversations
     * TYPE: ObjectId reference to another Comment
     * DEFAULT: null (top-level comment)
     * 
     * EXAMPLE STRUCTURE:
     * Comment 1 (parentId: null) ← Top-level
     *   ├─ Reply 1 (parentId: Comment1._id)
     *   ├─ Reply 2 (parentId: Comment1._id)
     *   └─ Reply 3 (parentId: Comment1._id)
     *       └─ Reply to Reply (parentId: Reply3._id)
     * 
     * IMPLEMENTATION OPTIONS:
     * 
     * OPTION A (Current - Simple):
     * - All comments flat, filter by parentId in frontend
     * - Good for MVP (simpler queries)
     * 
     * OPTION B (Nested - Complex):
     * - Store replies as subdocuments
     * - Pro: Single query gets all
     * - Con: Hard to paginate replies
     * 
     * REAL-WORLD:
     * - Reddit: Nested (unlimited depth)
     * - Twitter: Flat (no nested replies in API)
     * - YouTube: 2 levels (comment → reply, no reply to reply)
     */
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true // Index for "get replies to comment X"
    },

    /**
     * LIKES (Optional - For Upvoting Comments)
     * WHY: Popular comments shown first (like Reddit upvotes)
     * STORED AS: Array of user IDs who liked
     * 
     * SAME PATTERN AS Design LIKES:
     * - For MVP: Embedded array
     * - For scale: Separate CommentLike collection
     */
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    /**
     * LIKE COUNT (Denormalized)
     * WHY: Show "24 likes" without counting array
     * UPDATED: Incremented/decremented with likes array
     */
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    },

    /**
     * REPLY COUNT (Denormalized)
     * WHY: Show "5 replies" without counting
     * UPDATED: Incremented when reply added
     * 
     * USAGE: "Show more replies (5)" button
     */
    replyCount: {
      type: Number,
      default: 0,
      min: 0
    },

    /**
     * IS EDITED
     * WHY: Show "edited" badge on modified comments
     * UPDATED: Set to true when comment is edited
     * 
     * REAL-WORLD: Reddit shows "edited 2 hours ago"
     */
    isEdited: {
      type: Boolean,
      default: false
    },

    /**
     * EDITED AT
     * WHY: Track when comment was last edited
     * USAGE: Show "edited 2 hours ago"
     */
    editedAt: {
      type: Date,
      default: null
    },

    /**
     * IS DELETED (Soft Delete)
     * WHY: Preserve conversation flow even if comment deleted
     * 
     * EXAMPLE:
     * Comment 1: "Nice work!"
     * ├─ Reply 1: "I agree!" ← User deletes this
     * └─ Reply 2: "Thanks!" ← This would look orphaned without soft delete
     * 
     * SOFT DELETE SHOWS: "[Comment deleted]" instead of removing entirely
     */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    /**
     * DELETED AT
     * WHY: Track when comment was deleted
     */
    deletedAt: {
      type: Date,
      default: null
    },

    /**
     * IS FLAGGED (Moderation)
     * WHY: Users can report spam/offensive comments
     * USAGE: Admins review flagged comments
     * 
     * FUTURE: Auto-hide if flagged by 5+ users
     */
    isFlagged: {
      type: Boolean,
      default: false,
      index: true
    },

    /**
     * FLAG COUNT
     * WHY: Track how many users reported this comment
     * USAGE: Auto-delete if > 10 flags
     */
    flagCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===================================
// INDEXES (Performance)
// ===================================

/**
 * COMPOUND INDEX: designId + createdAt
 * WHY: Get comments for design sorted by date
 * QUERY: Comment.find({ designId: 'xyz' }).sort({ createdAt: -1 })
 * 
 * MOST COMMON QUERY: "Show all comments for this design, newest first"
 */
commentSchema.index({ designId: 1, createdAt: -1 });

/**
 * COMPOUND INDEX: userId + createdAt
 * WHY: Get user's comment history
 * QUERY: Comment.find({ userId: 'abc' }).sort({ createdAt: -1 })
 */
commentSchema.index({ userId: 1, createdAt: -1 });

/**
 * COMPOUND INDEX: designId + parentId
 * WHY: Get top-level comments only (parentId: null)
 * QUERY: Comment.find({ designId: 'xyz', parentId: null })
 * 
 * NOTE: Single field indexes (parentId, designId, userId) are already
 * defined in the schema with index: true, so they don't need manual creation.
 * Only compound indexes need manual definition.
 * 
 * USAGE: Load comments without replies first (faster initial load)
 */
commentSchema.index({ designId: 1, parentId: 1 });

// ===================================
// VIRTUALS
// ===================================

/**
 * VIRTUAL: replies
 * WHY: Populate nested replies when needed
 * USAGE:
 * const comment = await Comment.findById(id).populate('replies');
 * console.log(comment.replies); // Array of reply objects
 */
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentId'
});

// ===================================
// INSTANCE METHODS
// ===================================

/**
 * TOGGLE LIKE
 * WHY: Like/unlike comment
 * SAME LOGIC AS Design.toggleLike()
 */
commentSchema.methods.toggleLike = async function(userId) {
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
    liked: index === -1,
    likesCount: this.likesCount
  };
};

/**
 * EDIT COMMENT
 * WHY: Update comment content and mark as edited
 * USAGE: await comment.editContent('New content here');
 */
commentSchema.methods.editContent = async function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return await this.save();
};

/**
 * SOFT DELETE
 * WHY: Mark as deleted but keep in database
 * CONTENT: Changed to "[Comment deleted]" or keep original?
 * 
 * IMPLEMENTATION OPTIONS:
 * A) Replace content with "[Comment deleted]"
 * B) Keep content but hide in frontend
 * 
 * CHOOSING A: Cleaner, saves space
 */
commentSchema.methods.softDelete = async function() {
  this.content = '[Comment deleted]';
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

/**
 * FLAG COMMENT
 * WHY: Report spam/offensive content
 */
commentSchema.methods.flag = async function() {
  this.isFlagged = true;
  this.flagCount += 1;

  // Auto-hide if flagged > 10 times
  if (this.flagCount >= 10) {
    await this.softDelete();
  }

  return await this.save();
};

// ===================================
// STATIC METHODS
// ===================================

/**
 * GET COMMENTS FOR DESIGN
 * WHY: Main use case - show all comments on a design
 * OPTIONS: Pagination, sort, include replies
 */
commentSchema.statics.getForDesign = function(designId, options = {}) {
  const {
    page = 1,
    limit = 20,
    includeReplies = false,
    sortBy = 'createdAt',
    order = -1 // -1 = descending (newest first)
  } = options;

  const query = {
    designId,
    isDeleted: false
  };

  // Top-level comments only OR all comments
  if (!includeReplies) {
    query.parentId = null;
  }

  return this.find(query)
    .sort({ [sortBy]: order })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'username avatar fullName')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      options: { sort: { createdAt: 1 } }, // Replies oldest first
      populate: { path: 'userId', select: 'username avatar' }
    });
};

/**
 * GET REPLIES TO COMMENT
 * WHY: "Show 5 more replies" button
 */
commentSchema.statics.getReplies = function(parentId, options = {}) {
  const { page = 1, limit = 10 } = options;

  return this.find({
    parentId,
    isDeleted: false
  })
    .sort({ createdAt: 1 }) // Oldest first for replies
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'username avatar fullName');
};

/**
 * GET USER'S COMMENTS
 * WHY: User profile "Comments" tab
 */
commentSchema.statics.getUserComments = function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({
    userId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('designId', 'title thumbnailUrl')
    .populate('userId', 'username avatar');
};

// ===================================
// MIDDLEWARE HOOKS
// ===================================

/**
 * POST-SAVE HOOK: Update Design's Comment Count
 * WHY: Keep Design.commentsCount in sync
 * 
 * WHEN: After new comment is saved
 * ACTION: Increment Design.commentsCount
 */
commentSchema.post('save', async function(doc) {
  if (doc.isNew && !doc.isDeleted) {
    // New comment created
    await mongoose.model('Design').findByIdAndUpdate(doc.designId, {
      $inc: { commentsCount: 1 }
    });

    // If it's a reply, increment parent's reply count
    if (doc.parentId) {
      await mongoose.model('Comment').findByIdAndUpdate(doc.parentId, {
        $inc: { replyCount: 1 }
      });
    }
  }
});

/**
 * POST-REMOVE HOOK: Decrement Comment Count
 * WHY: Keep counts accurate when comment deleted
 */
commentSchema.post('remove', async function(doc) {
  await mongoose.model('Design').findByIdAndUpdate(doc.designId, {
    $inc: { commentsCount: -1 }
  });

  if (doc.parentId) {
    await mongoose.model('Comment').findByIdAndUpdate(doc.parentId, {
      $inc: { replyCount: -1 }
    });
  }
});

// ===================================
// EXPORT MODEL
// ===================================

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

/**
 * ===================================
 * COMMENT SYSTEM DESIGN PATTERNS
 * ===================================
 * 
 * PATTERN 1: FLAT COMMENTS (Current)
 * Structure: All comments at same level, use parentId to link
 * Pro: Simple queries, easy pagination
 * Con: Need multiple queries for nested threads
 * Used by: Twitter, Instagram
 * 
 * PATTERN 2: NESTED COMMENTS
 * Structure: Replies stored as subdocuments
 * Pro: Single query gets entire thread
 * Con: Hard to paginate, max nesting depth
 * Used by: Reddit (recursively query)
 * 
 * PATTERN 3: HYBRID
 * Structure: 1 level nesting (comment → replies array)
 * Pro: Balance of simplicity and features
 * Con: Limited to 2 levels
 * Used by: YouTube, Facebook
 * 
 * RECOMMENDATION FOR MVP:
 * - Start with Pattern 1 (flat)
 * - Add virtual populate for replies
 * - Migrate to Pattern 3 if needed
 */

/**
 * ===================================
 * SCALING CONSIDERATIONS
 * ===================================
 * 
 * CURRENT DESIGN (Good for < 1M comments):
 * ✅ Simple flat structure
 * ✅ Indexed queries
 * ✅ Denormalized counts
 * 
 * AT SCALE (> 1M comments):
 * 
 * 1. PAGINATION
 *    Load 20 comments at a time
 *    "Load more" button (infinite scroll)
 * 
 * 2. CACHING
 *    Cache popular design's comments in Redis
 *    Invalidate when new comment added
 * 
 * 3. SHARDING
 *    Split comments by designId
 *    Each shard handles subset of designs
 * 
 * 4. REAL-TIME UPDATES
 *    Use WebSockets (Socket.io) for live comments
 *    "New comment appeared" notification
 * 
 * 5. SEPARATE LIKES
 *    Create CommentLike model
 *    Same reasons as Design likes
 */

/**
 * ===================================
 * COMMON USE CASES & QUERIES
 * ===================================
 * 
 * 1. Get all comments for design (paginated):
 *    await Comment.getForDesign(designId, { page: 1, limit: 20 });
 * 
 * 2. Get replies to comment:
 *    await Comment.getReplies(commentId, { limit: 10 });
 * 
 * 3. Add new comment:
 *    await Comment.create({ content, designId, userId });
 * 
 * 4. Add reply:
 *    await Comment.create({ content, designId, userId, parentId });
 * 
 * 5. Edit comment:
 *    await comment.editContent('Updated content');
 * 
 * 6. Delete comment:
 *    await comment.softDelete();
 * 
 * 7. Like comment:
 *    await comment.toggleLike(userId);
 * 
 * 8. Get user's comment history:
 *    await Comment.getUserComments(userId, { page: 1 });
 */
