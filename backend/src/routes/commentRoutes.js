/**
 * ===================================
 * COMMENT ROUTES
 * ===================================
 * 
 * RESTful API routes for comment operations.
 * Supports threaded comments (parent/child relationships).
 * 
 * DESIGN DECISIONS:
 * ════════════════════════════════════
 * 
 * 1. ROUTE STRUCTURE
 * ────────────────────────────────────
 * 
 * OPTION A: Nested under designs ← We use this
 * POST /api/designs/:designId/comments
 * GET /api/designs/:designId/comments
 * 
 * Pros:
 * ✅ Clear relationship (comments belong to design)
 * ✅ RESTful hierarchy
 * ✅ Easy to understand
 * 
 * Cons:
 * ❌ Longer URLs
 * ❌ Harder to get comment by ID
 * 
 * 
 * OPTION B: Top-level comments resource
 * POST /api/comments
 * GET /api/comments?designId=abc123
 * 
 * Pros:
 * ✅ Shorter URLs
 * ✅ Easy to get comment by ID
 * 
 * Cons:
 * ❌ Less clear relationship
 * ❌ Query param required
 * 
 * 
 * OUR APPROACH: Hybrid
 * - Add comments: POST /api/designs/:designId/comments
 * - Get comments: GET /api/designs/:designId/comments
 * - Update/delete individual: PUT/DELETE /api/comments/:id
 * 
 * Best of both worlds!
 * 
 * 
 * 2. THREADING STRATEGY
 * ────────────────────────────────────
 * 
 * REDDIT-STYLE (Unlimited depth):
 * Comment 1
 *   ├─ Reply 1.1
 *   │  └─ Reply 1.1.1
 *   │     └─ Reply 1.1.1.1
 *   └─ Reply 1.2
 * 
 * Pros: Natural conversation flow
 * Cons: Complex UI, slow queries
 * 
 * 
 * YOUTUBE-STYLE (1 level only) ← We use this
 * Comment 1
 *   ├─ Reply 1.1
 *   ├─ Reply 1.2
 *   └─ Reply 1.3
 * Comment 2
 * 
 * Pros:
 * ✅ Simple to implement
 * ✅ Fast queries
 * ✅ Clean UI
 * Cons:
 * ❌ Can't reply to replies
 * 
 * Implementation:
 * - Top-level: parentId = null
 * - Replies: parentId = commentId
 * - Replies to replies: Treat as top-level reply
 * 
 * 
 * 3. SORTING OPTIONS
 * ────────────────────────────────────
 * 
 * newest: createdAt DESC (most recent first)
 * oldest: createdAt ASC (chronological)
 * popular: likesCount DESC (most liked)
 * 
 * REAL-WORLD:
 * - YouTube: Top comments, Newest first
 * - Reddit: Best, Top, New, Controversial
 * - Medium: Featured, Newest
 */

import express from 'express';
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  likeComment,
  flagComment,
  getCommentById
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { commentLimiter } from '../middleware/rateLimiter.js';

// mergeParams: true allows access to :designId from parent route
const router = express.Router({ mergeParams: true });

/**
 * ===================================
 * DESIGN-SPECIFIC COMMENT ROUTES
 * ===================================
 * 
 * Nested under /api/designs/:designId
 * Will be mounted in server.js as:
 * app.use('/api/designs/:designId/comments', commentRoutes)
 * 
 * OR imported in designRoutes.js
 */

/**
 * @route   POST /api/designs/:designId/comments
 * @desc    Add comment to design
 * @access  Private
 * 
 * HEADERS:
 * Authorization: Bearer <token>
 * 
 * BODY:
 * {
 *   "content": "Great design! Love the colors.",
 *   "parentId": null  // null for top-level, commentId for reply
 * }
 * 
 * RESPONSE (201 Created):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "comment123",
 *     "content": "Great design!",
 *     "user": { "username": "john", "avatar": "..." },
 *     "likesCount": 0,
 *     "replyCount": 0,
 *     "createdAt": "2024-01-17T10:30:00.000Z"
 *   }
 * }
 * 
 * VALIDATION:
 * - Content required (1-500 characters)
 * - Design must exist
 * - If replying, parent comment must exist
 * - Parent must belong to same design
 */
router.post('/', protect, commentLimiter, addComment);

/**
 * @route   GET /api/designs/:designId/comments
 * @desc    Get all comments for design
 * @access  Public
 * 
 * QUERY PARAMS:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - sortBy: newest, oldest, popular
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "comment1",
 *       "content": "Great design!",
 *       "user": { "username": "john" },
 *       "likesCount": 5,
 *       "replyCount": 2,
 *       "replies": [
 *         { "_id": "reply1", "content": "Thanks!" },
 *         { "_id": "reply2", "content": "I agree!" }
 *       ],
 *       "createdAt": "2024-01-17T10:30:00.000Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "total": 45,
 *     "pages": 3
 *   }
 * }
 * 
 * PAGINATION STRATEGY:
 * - Top-level comments paginated
 * - Replies NOT paginated (all loaded)
 * - If too many replies, add "Load more replies" later
 */
router.get('/', getComments);

/**
 * ===================================
 * INDIVIDUAL COMMENT ROUTES
 * ===================================
 * 
 * These operate on specific comments by ID.
 * Mounted directly in server.js as /api/comments
 */

// Export as separate router for mounting
export const individualCommentRoutes = express.Router();

/**
 * @route   GET /api/comments/:id
 * @desc    Get comment by ID with replies
 * @access  Public
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "comment1",
 *     "content": "Great design!",
 *     "user": { ... },
 *     "design": { "title": "Dashboard UI" },
 *     "replies": [ ... ]
 *   }
 * }
 */
individualCommentRoutes.get('/:id', getCommentById);

/**
 * @route   PUT /api/comments/:id
 * @desc    Update comment
 * @access  Private (author only)
 * 
 * BODY:
 * {
 *   "content": "Updated comment text"
 * }
 * 
 * OWNERSHIP:
 * - Only comment author can update
 * - Returns 403 if not author
 * 
 * EDIT TRACKING:
 * - Sets isEdited = true
 * - Updates editedAt timestamp
 * - UI shows "(edited)" label
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": { ...updated comment... },
 *   "message": "Comment updated successfully"
 * }
 */
individualCommentRoutes.put('/:id', protect, updateComment);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment (soft delete)
 * @access  Private (author only)
 * 
 * SOFT DELETE:
 * - Sets isDeleted = true
 * - Content hidden but structure remains
 * - Replies still visible
 * - Shows as "[deleted]" in UI
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Comment deleted successfully"
 * }
 * 
 * WHY SOFT DELETE?
 * ────────────────────────────────────
 * 
 * HARD DELETE (Permanent):
 * await Comment.findByIdAndDelete(id);
 * ❌ Replies become orphans
 * ❌ Can't undo
 * ❌ Thread structure breaks
 * 
 * SOFT DELETE:
 * comment.isDeleted = true;
 * ✅ Thread structure intact
 * ✅ Replies still visible
 * ✅ Can restore if needed
 * ✅ Audit trail
 * 
 * DISPLAY:
 * [john_designer]
 * [deleted]
 *   ├─ sarah: "I agree!"      ← Stays visible
 *   └─ mike: "Thanks!"        ← Stays visible
 */
individualCommentRoutes.delete('/:id', protect, deleteComment);

/**
 * @route   POST /api/comments/:id/like
 * @desc    Like or unlike comment (toggle)
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
 *   },
 *   "message": "Comment liked"
 * }
 */
individualCommentRoutes.post('/:id/like', protect, likeComment);

/**
 * @route   POST /api/comments/:id/flag
 * @desc    Flag comment as inappropriate
 * @access  Private
 * 
 * CONTENT MODERATION:
 * ────────────────────────────────────
 * 
 * FLOW:
 * 1. User flags comment
 * 2. Increment flagCount
 * 3. If flagCount >= 5: Auto-hide comment
 * 4. Moderator reviews flagged comments
 * 5. Moderator decides: Keep or Delete
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Comment flagged for review",
 *   "data": {
 *     "flagCount": 3,
 *     "hidden": false
 *   }
 * }
 * 
 * PREVENT ABUSE:
 * - Track who flagged (future: userId in Flag model)
 * - One flag per user per comment
 * - Rate limit flags (prevent spam)
 */
individualCommentRoutes.post('/:id/flag', protect, flagComment);

/**
 * ===================================
 * COMMENT BEST PRACTICES
 * ===================================
 * 
 * 1. RATE LIMITING
 * ────────────────────────────────────
 * 
 * PREVENT SPAM:
 * - Max 5 comments per minute per user
 * - Max 20 comments per hour per user
 * - Use express-rate-limit
 * 
 * Example:
 * import rateLimit from 'express-rate-limit';
 * 
 * const commentLimiter = rateLimit({
 *   windowMs: 1 * 60 * 1000, // 1 minute
 *   max: 5, // 5 requests per window
 *   message: 'Too many comments, please try again later'
 * });
 * 
 * router.post('/', protect, commentLimiter, addComment);
 * 
 * 
 * 2. CONTENT VALIDATION
 * ────────────────────────────────────
 * 
 * SANITIZE INPUT:
 * ✅ Trim whitespace
 * ✅ Remove HTML tags (prevent XSS)
 * ✅ Check length (1-500 chars)
 * ✅ Detect spammy patterns
 * 
 * BAD WORDS FILTER (Future):
 * - Maintain blacklist
 * - Auto-flag comments with profanity
 * - Replace with asterisks or reject
 * 
 * 
 * 3. NOTIFICATIONS (Future)
 * ────────────────────────────────────
 * 
 * NOTIFY:
 * ✅ Design owner: New comment on your design
 * ✅ Parent author: Reply to your comment
 * ✅ @mentioned users: User mentioned you
 * 
 * IMPLEMENTATION:
 * - Create Notification model
 * - Emit event on comment create
 * - Socket.io for real-time notifications
 * - Email digest for offline users
 * 
 * 
 * 4. MARKDOWN SUPPORT (Future)
 * ────────────────────────────────────
 * 
 * ALLOW RICH TEXT:
 * - **bold**, *italic*
 * - [links](url)
 * - `code`
 * - > quotes
 * 
 * LIBRARIES:
 * - marked.js (Markdown to HTML)
 * - DOMPurify (Sanitize HTML)
 * 
 * 
 * 5. REACTIONS (Future)
 * ────────────────────────────────────
 * 
 * Beyond likes: 👍 ❤️ 😂 🎉 🤔
 * 
 * Like Slack/GitHub reactions:
 * [john_designer]
 * Great design!
 * 👍 5  ❤️ 3  🎉 1
 * 
 * IMPLEMENTATION:
 * reactions: [
 *   { emoji: '👍', userIds: ['user1', 'user2'] },
 *   { emoji: '❤️', userIds: ['user3'] }
 * ]
 * 
 * 
 * 6. COMMENT SORTING
 * ────────────────────────────────────
 * 
 * ALGORITHMS:
 * 
 * Newest First (Default):
 * sort: { createdAt: -1 }
 * 
 * Most Popular:
 * sort: { likesCount: -1 }
 * 
 * Best (Reddit-style):
 * score = upvotes - downvotes
 * confidence = wilson_score(upvotes, total)
 * (Complex algorithm, accounts for controversy)
 * 
 * Top (with time decay):
 * score = likes / (hours_old + 2)^1.5
 * Recent popular comments rank higher
 * 
 * 
 * 7. PAGINATION STRATEGIES
 * ────────────────────────────────────
 * 
 * OFFSET PAGINATION (Current):
 * skip = (page - 1) × limit
 * Pro: Can jump to any page
 * Con: Slow for large offsets
 * 
 * CURSOR PAGINATION (Future):
 * cursor = lastCommentId
 * Query: createdAt < cursor
 * Pro: Fast, consistent
 * Con: Can't jump to page 5
 * 
 * INFINITE SCROLL (Frontend):
 * Load more as user scrolls
 * Better UX than numbered pages
 */

/**
 * ===================================
 * FRONTEND INTEGRATION EXAMPLES
 * ===================================
 * 
 * REACT + AXIOS:
 * ──────────────────────────────────
 * 
 * // Add comment
 * const addComment = async (designId, content, parentId = null) => {
 *   const response = await axios.post(
 *     `/api/designs/${designId}/comments`,
 *     { content, parentId }
 *   );
 *   return response.data.data;
 * };
 * 
 * // Get comments
 * const getComments = async (designId, page = 1) => {
 *   const response = await axios.get(
 *     `/api/designs/${designId}/comments?page=${page}`
 *   );
 *   return response.data;
 * };
 * 
 * // Update comment
 * const updateComment = async (commentId, content) => {
 *   const response = await axios.put(
 *     `/api/comments/${commentId}`,
 *     { content }
 *   );
 *   return response.data.data;
 * };
 * 
 * // Delete comment
 * const deleteComment = async (commentId) => {
 *   await axios.delete(`/api/comments/${commentId}`);
 * };
 * 
 * // Like comment
 * const likeComment = async (commentId) => {
 *   const response = await axios.post(`/api/comments/${commentId}/like`);
 *   return response.data.data;
 * };
 * 
 * // Flag comment
 * const flagComment = async (commentId) => {
 *   await axios.post(`/api/comments/${commentId}/flag`);
 * };
 * 
 * 
 * REACT COMPONENT EXAMPLE:
 * ──────────────────────────────────
 * 
 * const Comment = ({ comment }) => {
 *   const [isLiked, setIsLiked] = useState(false);
 *   const [likesCount, setLikesCount] = useState(comment.likesCount);
 *   
 *   const handleLike = async () => {
 *     const result = await likeComment(comment._id);
 *     setIsLiked(result.liked);
 *     setLikesCount(result.likesCount);
 *   };
 *   
 *   return (
 *     <div className="comment">
 *       <img src={comment.user.avatar} alt={comment.user.username} />
 *       <div>
 *         <strong>{comment.user.username}</strong>
 *         <p>{comment.content}</p>
 *         {comment.isEdited && <span>(edited)</span>}
 *         <button onClick={handleLike}>
 *           {isLiked ? '❤️' : '🤍'} {likesCount}
 *         </button>
 *       </div>
 *     </div>
 *   );
 * };
 */

export default router;
