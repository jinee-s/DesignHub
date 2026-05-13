/**
 * ===================================
 * DATABASE SCHEMA DOCUMENTATION
 * ===================================
 * 
 * This file explains the complete database architecture for DesignHub.
 * Read this to understand relationships, design decisions, and scalability.
 */

// ===================================
// 1. SCHEMA OVERVIEW
// ===================================

/**
 * COLLECTIONS (Tables in SQL terms):
 * 
 * 1. users         - User accounts and profiles
 * 2. designs       - Design posts (shots)
 * 3. comments      - Comments on designs
 * 
 * FUTURE OPTIONAL COLLECTIONS (for scale):
 * 4. likes         - Separate like tracking
 * 5. follows       - User follow relationships
 * 6. notifications - Real-time notifications
 */

// ===================================
// 2. ENTITY RELATIONSHIP DIAGRAM (ERD)
// ===================================

/**
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                          USER                                        │
 * │  ─────────────────────────────────────────────────────────────────  │
 * │  _id, username, email, password, avatar, bio, location, website,    │
 * │  social{}, role, isEmailVerified, isActive, createdAt, updatedAt    │
 * └────────────┬───────────────────────────────────────────┬────────────┘
 *              │                                            │
 *              │ 1:N (One user, many designs)              │ 1:N (One user, many comments)
 *              │                                            │
 *              ▼                                            ▼
 * ┌─────────────────────────────────┐        ┌──────────────────────────────────┐
 * │          DESIGN                 │        │          COMMENT                 │
 * │  ─────────────────────────────  │        │  ──────────────────────────────  │
 * │  _id                            │◄───────│  _id                             │
 * │  title                          │  N:1   │  content                         │
 * │  description                    │        │  designId (ref: Design)          │
 * │  imageUrl                       │        │  userId (ref: User)              │
 * │  thumbnailUrl                   │        │  parentId (ref: Comment, null)   │
 * │  cloudinaryId                   │        │  likes[] (ref: User)             │
 * │  userId (ref: User)             │        │  likesCount                      │
 * │  tags[]                         │        │  replyCount                      │
 * │  category                       │        │  isEdited, editedAt              │
 * │  likes[] (ref: User)            │        │  isDeleted, deletedAt            │
 * │  likesCount                     │        │  isFlagged, flagCount            │
 * │  views                          │        │  createdAt, updatedAt            │
 * │  commentsCount                  │        └──────────────────────────────────┘
 * │  isFeatured                     │                      │
 * │  isDeleted, deletedAt           │                      │ Self-referencing
 * │  status                         │                      │ (replies to replies)
 * │  createdAt, updatedAt           │                      │
 * └─────────────────────────────────┘                      ▼
 *              ▲                                  ┌──────────────────┐
 *              │                                  │  COMMENT (reply) │
 *              │ N:M (Many-to-Many via likes)    └──────────────────┘
 *              │
 *         Many Users can like
 *         Many Designs
 */

// ===================================
// 3. RELATIONSHIP TYPES EXPLAINED
// ===================================

/**
 * RELATIONSHIP 1: User ──< Design (One-to-Many)
 * 
 * MEANING: One user creates many designs, each design belongs to one user
 * 
 * IMPLEMENTATION:
 * - Design model has `userId` field (ObjectId reference)
 * - Query: "Get all designs by user X"
 *   Design.find({ userId: 'user_id_here' })
 * 
 * WHY REFERENCE (not embed)?
 * ✅ User data changes (avatar, username) → Don't update 100 designs
 * ✅ Easy to query "all designs by user"
 * ✅ Follows normalization principles
 * 
 * REAL-WORLD ANALOGY:
 * Library (User) → Books (Designs)
 * One library owns many books, each book belongs to one library
 */

/**
 * RELATIONSHIP 2: Design >──< User (Many-to-Many via Likes)
 * 
 * MEANING: One design can be liked by many users
 *          One user can like many designs
 * 
 * IMPLEMENTATION (Current - MVP):
 * - Design model has `likes[]` array of user IDs
 * - Check if user liked: design.likes.includes(userId)
 * 
 * IMPLEMENTATION (Scale - Better for 100K+ users):
 * - Separate Like collection:
 *   { _id, userId, designId, createdAt }
 * - Query: Like.find({ designId: 'xyz' })
 * - Query: Like.find({ userId: 'abc' })
 * 
 * WHY SEPARATE COLLECTION AT SCALE?
 * ❌ Problem with array: Design with 100K likes = huge document
 * ✅ Solution: Separate collection = unlimited likes
 * ✅ Can add timestamps (when liked)
 * ✅ Can query "designs liked by user X" easily
 * 
 * REAL-WORLD ANALOGY:
 * Students >──< Courses (many students enroll in many courses)
 * Implemented via "Enrollment" table with studentId + courseId
 */

/**
 * RELATIONSHIP 3: Design ──< Comment (One-to-Many)
 * 
 * MEANING: One design has many comments, each comment belongs to one design
 * 
 * IMPLEMENTATION:
 * - Comment model has `designId` field (reference to Design)
 * - Query: "Get all comments for design X"
 *   Comment.find({ designId: 'design_id_here' })
 * 
 * WHY NOT EMBED COMMENTS IN DESIGN?
 * ❌ Popular design = 1000s of comments = huge document
 * ❌ Hard to paginate (load 20 comments at a time)
 * ❌ Updating comment requires rewriting entire design document
 * ✅ Separate collection = easy pagination, better performance
 * 
 * REAL-WORLD EXAMPLE:
 * - YouTube: Comments are separate from video document
 * - Reddit: Comments separate from post
 */

/**
 * RELATIONSHIP 4: User ──< Comment (One-to-Many)
 * 
 * MEANING: One user writes many comments, each comment has one author
 * 
 * IMPLEMENTATION:
 * - Comment model has `userId` field (reference to User)
 * - Query: "Get all comments by user X"
 *   Comment.find({ userId: 'user_id_here' })
 */

/**
 * RELATIONSHIP 5: Comment ──< Comment (Self-Referencing, One-to-Many)
 * 
 * MEANING: One comment can have many replies, each reply is also a comment
 * 
 * IMPLEMENTATION:
 * - Comment model has `parentId` field (reference to another Comment)
 * - Top-level comments: parentId = null
 * - Replies: parentId = parent comment's _id
 * 
 * QUERY EXAMPLES:
 * - Get top-level comments:
 *   Comment.find({ designId: 'xyz', parentId: null })
 * 
 * - Get replies to a comment:
 *   Comment.find({ parentId: 'comment_id_here' })
 * 
 * REAL-WORLD EXAMPLE:
 * - Reddit: Nested comments (reply to reply to reply...)
 * - Twitter: Flat threads (no nested replies in API)
 */

// ===================================
// 4. EMBED VS REFERENCE DECISION GUIDE
// ===================================

/**
 * WHEN TO EMBED (Store as Subdocument)
 * 
 * ✅ Use when:
 * 1. Data is small and bounded (e.g., address with 5 fields)
 * 2. Data doesn't change often (e.g., order details at time of purchase)
 * 3. Always accessed together (e.g., blog post + content)
 * 4. One-to-few relationship (user has 1-3 addresses)
 * 
 * EXAMPLE: User's social links (twitter, instagram, github)
 * 
 * userSchema = {
 *   username: 'john',
 *   social: {                    // ← EMBEDDED
 *     twitter: '@john',
 *     instagram: '@john_design',
 *     github: 'john-dev'
 *   }
 * }
 * 
 * WHY EMBED?
 * ✅ Single query to get user + social links
 * ✅ Social links never queried independently
 * ✅ Only 3-4 fields (small)
 * ✅ Atomic updates (update user and social in one operation)
 */

/**
 * WHEN TO REFERENCE (Store as Separate Document)
 * 
 * ✅ Use when:
 * 1. Data is large or unbounded (e.g., 1000s of items)
 * 2. Data changes frequently (e.g., user avatar)
 * 3. Need to query independently (e.g., "find all designs with tag 'ui'")
 * 4. Many-to-many relationships (e.g., likes)
 * 5. Need pagination (e.g., comments)
 * 
 * EXAMPLE: Designs by a user
 * 
 * User = {
 *   _id: 'user123',
 *   username: 'john'
 * }
 * 
 * Design = {
 *   _id: 'design456',
 *   title: 'Dashboard UI',
 *   userId: 'user123'  // ← REFERENCE (not embedded)
 * }
 * 
 * WHY REFERENCE?
 * ✅ User can have 1000s of designs (unbounded)
 * ✅ Can query "all designs by user" or "all designs with tag X"
 * ✅ Design can be updated without touching user document
 * ✅ Pagination: Load 20 designs at a time
 */

/**
 * TRADEOFFS COMPARISON
 * 
 * ┌────────────────────┬────────────────────────┬────────────────────────┐
 * │     Aspect         │     EMBED              │     REFERENCE          │
 * ├────────────────────┼────────────────────────┼────────────────────────┤
 * │ Query Speed        │ Fast (single query)    │ Slower (2+ queries)    │
 * │ Data Duplication   │ More duplication       │ Less duplication       │
 * │ Consistency        │ Atomic updates         │ Manual sync needed     │
 * │ Scalability        │ Limited (16MB limit)   │ Unlimited              │
 * │ Update Complexity  │ Hard (rewrite all)     │ Easy (update one doc)  │
 * │ Query Flexibility  │ Limited (can't query   │ High (query anything)  │
 * │                    │ subdocs independently) │                        │
 * └────────────────────┴────────────────────────┴────────────────────────┘
 */

/**
 * OUR DESIGN CHOICES EXPLAINED
 * 
 * 1. LIKES: Embedded Array (MVP) → Separate Collection (Scale)
 *    REASON: Simple for MVP, migrate when needed
 * 
 * 2. COMMENTS: Referenced
 *    REASON: Can have 1000s, need pagination
 * 
 * 3. SOCIAL LINKS: Embedded
 *    REASON: Small, bounded, always accessed with user
 * 
 * 4. TAGS: Embedded Array
 *    REASON: Max 10 tags, indexed for search
 * 
 * 5. USER IN DESIGN: Referenced
 *    REASON: User data changes, many designs per user
 */

// ===================================
// 5. DENORMALIZATION STRATEGY
// ===================================

/**
 * WHAT IS DENORMALIZATION?
 * Storing duplicate data to improve read performance.
 * 
 * EXAMPLE:
 * Design has:
 * - likes[] array (normalized - actual data)
 * - likesCount number (denormalized - duplicate)
 * 
 * WHY?
 * ✅ Faster: Read count without counting array
 * ❌ Tradeoff: Must keep count in sync with array
 */

/**
 * WHERE WE USE DENORMALIZATION:
 * 
 * 1. Design.likesCount
 *    WHY: Show "245 likes" without likes.length every time
 *    SYNC: Increment/decrement when like toggled
 * 
 * 2. Design.commentsCount
 *    WHY: Show "12 comments" without querying Comment collection
 *    SYNC: Update when comment added/deleted (post-save hook)
 * 
 * 3. Comment.replyCount
 *    WHY: Show "5 replies" without counting
 *    SYNC: Update when reply added
 * 
 * REAL-WORLD EXAMPLES:
 * - YouTube: Video view count (not counting every view)
 * - Twitter: Tweet like count (denormalized)
 * - Reddit: Post upvote count (denormalized)
 */

/**
 * KEEPING DENORMALIZED DATA IN SYNC:
 * 
 * METHOD 1: Pre/Post Hooks (Our approach)
 * commentSchema.post('save', async function() {
 *   await Design.updateOne(
 *     { _id: this.designId },
 *     { $inc: { commentsCount: 1 } }
 *   );
 * });
 * 
 * METHOD 2: Transactions (More reliable)
 * const session = await mongoose.startSession();
 * await session.withTransaction(async () => {
 *   await Comment.create([comment], { session });
 *   await Design.updateOne({ _id }, { $inc: { commentsCount: 1 } }, { session });
 * });
 * 
 * METHOD 3: Background Jobs (For scale)
 * - Update counts every 5 minutes (eventual consistency)
 * - Used by: Twitter, Instagram (counts may be slightly off)
 */

// ===================================
// 6. INDEXING STRATEGY
// ===================================

/**
 * WHAT ARE INDEXES?
 * Database structures that speed up queries (like book index).
 * 
 * WITHOUT INDEX:
 * Query scans ALL documents (slow for large collections)
 * 
 * WITH INDEX:
 * Query uses index to jump directly to matching documents (fast)
 * 
 * TRADEOFF:
 * ✅ Faster reads
 * ❌ Slower writes (must update index)
 * ❌ More disk space
 */

/**
 * OUR INDEXES:
 * 
 * USER MODEL:
 * - email (unique) - Fast login lookup
 * - username (unique) - Prevent duplicates
 * 
 * DESIGN MODEL:
 * - userId + createdAt (compound) - User's designs sorted by date
 * - tags - Tag-based filtering
 * - category - Category filtering
 * - likesCount (desc) - Trending/popular designs
 * - createdAt (desc) - Newest designs
 * - title + description (text) - Full-text search
 * 
 * COMMENT MODEL:
 * - designId + createdAt (compound) - Design's comments by date
 * - userId + createdAt (compound) - User's comment history
 * - parentId - Replies to comment
 * - designId + parentId (compound) - Top-level comments only
 */

/**
 * INDEX BEST PRACTICES:
 * 
 * 1. Index frequently queried fields
 *    ✅ email (login), userId (find user's designs)
 *    ❌ Don't index rarely queried fields (bio, location)
 * 
 * 2. Use compound indexes for common query patterns
 *    ✅ { userId: 1, createdAt: -1 } for "user's recent designs"
 *    ❌ Don't create { userId: 1 } and { createdAt: 1 } separately
 * 
 * 3. Limit number of indexes (each slows down writes)
 *    ✅ 5-10 indexes per collection
 *    ❌ Don't index everything
 * 
 * 4. Monitor index usage
 *    Use MongoDB's explain() to see if queries use indexes
 */

// ===================================
// 7. SCALABILITY CONSIDERATIONS
// ===================================

/**
 * CURRENT DESIGN (Good for 0-100K users):
 * ✅ Simple schema
 * ✅ Embedded likes array
 * ✅ Indexed queries
 * ✅ Denormalized counts
 * 
 * WHEN TO REFACTOR (Signs you need to scale):
 * 
 * 1. SLOW QUERIES (> 1 second)
 *    Solution: Add indexes, optimize queries, use explain()
 * 
 * 2. LARGE LIKE ARRAYS (> 1000 likes per design)
 *    Solution: Create separate Like collection
 *    { _id, userId, designId, createdAt }
 * 
 * 3. FREQUENT WRITES (10+ designs uploaded per second)
 *    Solution: Database sharding, separate read/write databases
 * 
 * 4. STORAGE ISSUES (> 100GB data)
 *    Solution: Archive old data, compress images
 * 
 * 5. SEARCH PERFORMANCE (slow text search)
 *    Solution: Use Elasticsearch or Algolia
 */

/**
 * MIGRATION PATH TO SCALE:
 * 
 * PHASE 1 (Current - 0-100K users):
 * - Single MongoDB instance
 * - Embedded likes
 * - Basic indexes
 * 
 * PHASE 2 (100K-500K users):
 * - Separate Like collection
 * - Redis for caching popular designs
 * - CDN for images (Cloudinary already does this!)
 * 
 * PHASE 3 (500K-1M users):
 * - Database replication (read replicas)
 * - Elasticsearch for search
 * - Background jobs for denormalized counts
 * 
 * PHASE 4 (1M+ users):
 * - Database sharding (split by userId or region)
 * - Microservices (separate service for comments, likes, etc.)
 * - Message queues (RabbitMQ, Kafka) for async processing
 */

// ===================================
// 8. COMMON QUERIES & PATTERNS
// ===================================

/**
 * QUERY 1: Get user's designs (paginated)
 * 
 * const designs = await Design.find({ userId, isDeleted: false })
 *   .sort({ createdAt: -1 })
 *   .limit(20)
 *   .skip((page - 1) * 20)
 *   .populate('userId', 'username avatar');
 * 
 * USES INDEX: { userId: 1, createdAt: -1 }
 */

/**
 * QUERY 2: Get trending designs (popular this week)
 * 
 * const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
 * const designs = await Design.find({
 *   createdAt: { $gte: oneWeekAgo },
 *   isDeleted: false
 * })
 *   .sort({ likesCount: -1, views: -1 })
 *   .limit(20);
 * 
 * USES INDEX: { likesCount: -1 }
 */

/**
 * QUERY 3: Search designs
 * 
 * const designs = await Design.find({
 *   $text: { $search: 'modern dashboard ui' },
 *   isDeleted: false
 * })
 *   .sort({ score: { $meta: 'textScore' } })
 *   .limit(20);
 * 
 * USES INDEX: { title: 'text', description: 'text' }
 */

/**
 * QUERY 4: Get comments for design (with replies)
 * 
 * const comments = await Comment.find({
 *   designId,
 *   parentId: null, // Top-level only
 *   isDeleted: false
 * })
 *   .sort({ createdAt: -1 })
 *   .limit(20)
 *   .populate('userId', 'username avatar')
 *   .populate({
 *     path: 'replies',
 *     match: { isDeleted: false },
 *     options: { limit: 3 } // First 3 replies
 *   });
 * 
 * USES INDEX: { designId: 1, parentId: 1 }
 */

/**
 * QUERY 5: Check if user liked design
 * 
 * const design = await Design.findById(designId);
 * const hasLiked = design.likes.includes(userId);
 * 
 * OR (with separate Like collection):
 * const like = await Like.findOne({ userId, designId });
 * const hasLiked = !!like;
 */

/**
 * QUERY 6: Get designs by tags
 * 
 * const designs = await Design.find({
 *   tags: { $in: ['ui', 'dashboard'] },
 *   isDeleted: false
 * })
 *   .sort({ createdAt: -1 })
 *   .limit(20);
 * 
 * USES INDEX: { tags: 1 }
 */

// ===================================
// 9. SECURITY CONSIDERATIONS
// ===================================

/**
 * 1. PASSWORD SECURITY
 *    ✅ Hash with bcrypt (10 rounds)
 *    ✅ Never return password in queries (select: false)
 *    ✅ Validate strength (min 6 chars)
 * 
 * 2. INPUT VALIDATION
 *    ✅ Mongoose schema validation
 *    ✅ Sanitize HTML in comments (prevent XSS)
 *    ✅ Validate email format
 * 
 * 3. AUTHORIZATION
 *    ✅ Only owner can update/delete design
 *    ✅ Only owner can edit comment
 *    ✅ Admin role for moderation
 * 
 * 4. RATE LIMITING
 *    ✅ Limit API calls per user (prevent spam)
 *    ✅ Limit uploads per day
 * 
 * 5. SOFT DELETE
 *    ✅ Don't hard delete (can restore if needed)
 *    ✅ Mark as deleted, filter in queries
 */

// ===================================
// 10. INTERVIEW TALKING POINTS
// ===================================

/**
 * When discussing this schema in interviews:
 * 
 * 1. "I used references for one-to-many relationships to prevent
 *    data duplication and allow independent updates."
 * 
 * 2. "I denormalized like counts for faster reads at the cost of
 *    slightly more complex writes, which is acceptable since
 *    reads are 100x more common than writes."
 * 
 * 3. "I added compound indexes on frequently queried fields like
 *    userId + createdAt to optimize common query patterns."
 * 
 * 4. "I designed the like system to use an embedded array for MVP,
 *    but it can be migrated to a separate collection when scaling
 *    beyond 100K users."
 * 
 * 5. "I implemented soft deletes to preserve data integrity and
 *    allow restoration if needed."
 * 
 * 6. "I used MongoDB's text indexes for full-text search, but
 *    acknowledged that Elasticsearch would be better at scale."
 * 
 * 7. "I normalized user data to prevent inconsistencies, but
 *    denormalized counts for performance."
 */

/**
 * ===================================
 * SUMMARY
 * ===================================
 * 
 * This schema design demonstrates:
 * ✅ Proper relationship modeling (1:N, N:M)
 * ✅ Strategic denormalization for performance
 * ✅ Comprehensive indexing strategy
 * ✅ Scalability considerations
 * ✅ Security best practices
 * ✅ Real-world patterns used by major platforms
 * 
 * It's resume-ready and interview-ready! 🚀
 */

export default {
  // This file is for documentation only
  // Actual models are in User.js, Design.js, Comment.js
};
