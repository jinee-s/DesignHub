/**
 * ===================================
 * COMMENT CONTROLLER
 * ===================================
 * 
 * Handles HTTP requests for comment operations.
 * Supports threaded comments (replies).
 */

import asyncHandler from 'express-async-handler';
import Comment from '../models/Comment.js';
import Design from '../models/Design.js';

/**
 * ===================================
 * ADD COMMENT
 * ===================================
 * 
 * @route   POST /api/designs/:designId/comments
 * @access  Private
 * 
 * REQUEST BODY:
 * {
 *   "content": "Great design! Love the colors.",
 *   "parentId": null  // null for top-level, or comment ID for reply
 * }
 * 
 * RESPONSE (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "65a8b3c9...",
 *     "content": "Great design!",
 *     "user": { "username": "john_designer", "avatar": "..." },
 *     "likesCount": 0,
 *     "replyCount": 0,
 *     "createdAt": "2024-01-17T10:30:00.000Z"
 *   }
 * }
 */
export const addComment = asyncHandler(async (req, res) => {
  const { designId } = req.params;
  const { content, parentId } = req.body;

  // Validation
  if (!content || !content.trim()) {
    res.status(400);
    throw new Error('Comment content is required');
  }

  if (content.length > 500) {
    res.status(400);
    throw new Error('Comment cannot exceed 500 characters');
  }

  // Verify design exists
  const design = await Design.findById(designId);
  if (!design) {
    res.status(404);
    throw new Error('Design not found');
  }

  // If replying to comment, verify parent exists
  if (parentId) {
    const parentComment = await Comment.findById(parentId);
    if (!parentComment) {
      res.status(404);
      throw new Error('Parent comment not found');
    }

    // Verify parent belongs to same design
    if (parentComment.designId.toString() !== designId) {
      res.status(400);
      throw new Error('Parent comment does not belong to this design');
    }
  }

  // Create comment
  const comment = await Comment.create({
    content: content.trim(),
    designId,
    userId: req.user._id,
    parentId: parentId || null
  });

  // Populate user data
  await comment.populate({
    path: 'userId',
    select: 'username avatar'
  });

  res.status(201).json({
    success: true,
    data: comment
  });
});

/**
 * ===================================
 * GET COMMENTS FOR DESIGN
 * ===================================
 * 
 * @route   GET /api/designs/:designId/comments
 * @access  Public
 * 
 * QUERY PARAMETERS:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - sortBy: Sort option (newest, oldest, popular)
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "comment1",
 *       "content": "Great design!",
 *       "user": { ... },
 *       "likesCount": 5,
 *       "replyCount": 2,
 *       "replies": [
 *         { "_id": "reply1", "content": "I agree!", ... },
 *         { "_id": "reply2", "content": "Thanks!", ... }
 *       ]
 *     }
 *   ],
 *   "pagination": { ... }
 * }
 * 
 * THREADED COMMENTS STRUCTURE:
 * ────────────────────────────────────
 * 
 * TOP-LEVEL COMMENTS (parentId = null):
 * Comment 1
 *   ├─ Reply 1.1
 *   ├─ Reply 1.2
 *   └─ Reply 1.3
 * Comment 2
 *   └─ Reply 2.1
 * Comment 3
 * 
 * DATABASE QUERIES:
 * 1. Fetch top-level comments (parentId = null)
 * 2. For each comment, fetch replies (parentId = commentId)
 * 
 * ALTERNATIVE (Single query):
 * Fetch all comments, group by parentId in code
 * (More efficient for large comment counts)
 */
export const getComments = asyncHandler(async (req, res) => {
  const { designId } = req.params;
  const { page = 1, limit = 20, sortBy = 'newest' } = req.query;

  // Verify design exists
  const design = await Design.findById(designId);
  if (!design) {
    res.status(404);
    throw new Error('Design not found');
  }

  // Use Comment model's static method
  const result = await Comment.getForDesign(designId, {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy
  });

  res.status(200).json({
    success: true,
    data: result.comments,
    pagination: result.pagination
  });
});

/**
 * ===================================
 * UPDATE COMMENT
 * ===================================
 * 
 * @route   PUT /api/comments/:id
 * @access  Private (author only)
 * 
 * REQUEST BODY:
 * {
 *   "content": "Updated comment text"
 * }
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": { ...updated comment... }
 * }
 */
export const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  // Validation
  if (!content || !content.trim()) {
    res.status(400);
    throw new Error('Comment content is required');
  }

  if (content.length > 500) {
    res.status(400);
    throw new Error('Comment cannot exceed 500 characters');
  }

  // Find comment
  const comment = await Comment.findById(id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check ownership
  if (comment.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this comment');
  }

  // Update using model method
  await comment.editContent(content.trim());

  // Populate user data
  await comment.populate({
    path: 'userId',
    select: 'username avatar'
  });

  res.status(200).json({
    success: true,
    data: comment,
    message: 'Comment updated successfully'
  });
});

/**
 * ===================================
 * DELETE COMMENT
 * ===================================
 * 
 * @route   DELETE /api/comments/:id
 * @access  Private (author only)
 * 
 * SOFT DELETE:
 * - Sets isDeleted = true
 * - Keeps comment in database for integrity
 * - Children (replies) remain visible
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Comment deleted successfully"
 * }
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findById(id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check ownership
  if (comment.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  // Soft delete
  comment.isDeleted = true;
  comment.deletedAt = new Date();
  await comment.save();

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

/**
 * ===================================
 * LIKE COMMENT
 * ===================================
 * 
 * @route   POST /api/comments/:id/like
 * @access  Private
 * 
 * IDEMPOTENT: Toggle like/unlike
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "liked": true,
 *     "likesCount": 8
 *   }
 * }
 */
export const likeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findById(id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Use model method
  const result = await comment.toggleLike(req.user._id);

  res.status(200).json({
    success: true,
    data: result,
    message: result.liked ? 'Comment liked' : 'Comment unliked'
  });
});

/**
 * ===================================
 * FLAG COMMENT (Report)
 * ===================================
 * 
 * @route   POST /api/comments/:id/flag
 * @access  Private
 * 
 * CONTENT MODERATION:
 * - Users can flag inappropriate comments
 * - Auto-hide after threshold (e.g., 5 flags)
 * - Moderators review flagged content
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Comment flagged for review"
 * }
 */
export const flagComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findById(id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Increment flag count
  comment.flagCount += 1;
  comment.isFlagged = true;

  // Auto-hide if flag threshold reached
  const FLAG_THRESHOLD = 5;
  if (comment.flagCount >= FLAG_THRESHOLD) {
    comment.isDeleted = true; // Hide from view
  }

  await comment.save();

  res.status(200).json({
    success: true,
    message: 'Comment flagged for review',
    data: {
      flagCount: comment.flagCount,
      hidden: comment.flagCount >= FLAG_THRESHOLD
    }
  });
});

/**
 * ===================================
 * GET COMMENT BY ID
 * ===================================
 * 
 * @route   GET /api/comments/:id
 * @access  Public
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "comment1",
 *     "content": "Great design!",
 *     "user": { ... },
 *     "replies": [ ... ]
 *   }
 * }
 */
export const getCommentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findById(id)
    .populate({
      path: 'userId',
      select: 'username avatar'
    })
    .populate({
      path: 'designId',
      select: 'title imageUrl'
    });

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Fetch replies
  const replies = await Comment.find({ parentId: id })
    .populate({
      path: 'userId',
      select: 'username avatar'
    })
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: {
      ...comment.toObject(),
      replies
    }
  });
});

/**
 * ===================================
 * COMMENT BEST PRACTICES
 * ===================================
 * 
 * 1. CONTENT MODERATION
 * ────────────────────────────────────
 * ✅ Flag system (user-reported)
 * ✅ Auto-hide after threshold
 * ✅ Manual moderator review
 * ✅ Spam detection (ML/AI)
 * 
 * 2. RATE LIMITING
 * ────────────────────────────────────
 * ✅ Max 5 comments per minute per user
 * ✅ Prevent spam bots
 * ✅ Use express-rate-limit
 * 
 * 3. NOTIFICATION SYSTEM (Future)
 * ────────────────────────────────────
 * ✅ Notify design owner of new comment
 * ✅ Notify when someone replies to your comment
 * ✅ @mention notifications
 * 
 * 4. RICH TEXT (Future)
 * ────────────────────────────────────
 * ✅ Markdown support
 * ✅ Code blocks
 * ✅ Image embeds
 * ✅ Use library like marked.js
 * 
 * 5. REACTIONS (Future)
 * ────────────────────────────────────
 * Beyond likes: 👍 ❤️ 😂 🎉 🤔
 * Like Slack/Discord reactions
 */
