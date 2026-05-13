/**
 * ===================================
 * DESIGN ROUTES
 * ===================================
 * 
 * RESTful API routes for design operations.
 * 
 * REST PRINCIPLES:
 * ════════════════════════════════════
 * 
 * 1. RESOURCE-BASED URLS
 * ────────────────────────────────────
 * URL represents a resource (noun), not action (verb)
 * 
 * ✅ Good: /designs, /designs/:id, /designs/:id/like
 * ❌ Bad: /getDesigns, /createDesign, /likeDesign
 * 
 * HTTP method indicates the action:
 * - GET = Read
 * - POST = Create
 * - PUT/PATCH = Update
 * - DELETE = Delete
 * 
 * 
 * 2. HTTP METHOD SEMANTICS
 * ────────────────────────────────────
 * 
 * GET (Safe & Idempotent)
 * - No side effects (doesn't modify data)
 * - Can be cached
 * - Can be bookmarked
 * - Multiple calls = same result
 * Example: GET /designs (always returns designs list)
 * 
 * POST (Not idempotent)
 * - Creates new resource
 * - Has side effects
 * - Multiple calls = multiple resources
 * Example: POST /designs (creates new design each time)
 * 
 * PUT (Idempotent)
 * - Updates resource (full replacement)
 * - Multiple calls = same final state
 * Example: PUT /designs/:id (same update applied twice = same result)
 * 
 * PATCH (Idempotent)
 * - Partial update
 * - Only specified fields changed
 * Example: PATCH /designs/:id { title: "New" }
 * 
 * DELETE (Idempotent)
 * - Removes resource
 * - Second delete = 404 or 200 (already gone)
 * Example: DELETE /designs/:id
 * 
 * 
 * 3. STATUS CODE CONVENTIONS
 * ────────────────────────────────────
 * 
 * Success:
 * 200 OK - GET, PUT, PATCH, DELETE with body
 * 201 Created - POST (resource created)
 * 204 No Content - DELETE with no body
 * 
 * Client Error:
 * 400 Bad Request - Invalid input
 * 401 Unauthorized - Not authenticated
 * 403 Forbidden - Authenticated but no permission
 * 404 Not Found - Resource doesn't exist
 * 409 Conflict - Duplicate resource
 * 
 * Server Error:
 * 500 Internal Server Error - Unexpected error
 * 503 Service Unavailable - Server overloaded
 * 
 * 
 * 4. URL STRUCTURE
 * ────────────────────────────────────
 * 
 * COLLECTION:
 * /designs - Represents all designs
 * 
 * ITEM:
 * /designs/:id - Represents single design
 * 
 * SUB-RESOURCE:
 * /designs/:id/comments - Comments for design
 * /designs/:id/like - Like action on design
 * 
 * FILTER/SEARCH:
 * /designs?category=web - Query parameters
 * /designs?search=gradient
 * 
 * PAGINATION:
 * /designs?page=2&limit=20
 * 
 * SORT:
 * /designs?sortBy=popular
 * 
 * 
 * 5. VERSIONING
 * ────────────────────────────────────
 * 
 * URL-based:
 * /api/v1/designs
 * /api/v2/designs
 * 
 * Header-based:
 * Accept: application/vnd.myapi.v1+json
 * 
 * For MVP: No versioning yet
 * When to version: Breaking changes to API contract
 * 
 * 
 * ROUTE ORGANIZATION:
 * ════════════════════════════════════
 * 
 * By resource type:
 * - authRoutes.js → /api/auth/*
 * - designRoutes.js → /api/designs/*
 * - userRoutes.js → /api/users/*
 * - commentRoutes.js → /api/comments/*
 * 
 * NOT by HTTP method:
 * ❌ getRoutes.js (all GET routes)
 * ❌ postRoutes.js (all POST routes)
 * ✅ Group by resource for cohesion!
 */

import express from 'express';
import {
  createDesign,
  getAllDesigns,
  getDesignById,
  updateDesign,
  deleteDesign,
  likeDesign,
  saveDesign,
  getSavedDesigns,
  getTrendingDesigns
} from '../controllers/designController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * ===================================
 * PUBLIC ROUTES (No authentication)
 * ===================================
 */

/**
 * @route   GET /api/designs
 * @desc    Get all designs with pagination
 * @access  Public
 * 
 * QUERY PARAMS:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - category: Filter by category
 * - tags: Filter by tags (comma-separated)
 * - userId: Filter by user
 * - search: Text search
 * - sortBy: newest, popular, trending, views, oldest
 * 
 * EXAMPLES:
 * GET /api/designs
 * GET /api/designs?page=2&limit=30
 * GET /api/designs?category=web&sortBy=popular
 * GET /api/designs?tags=dashboard,ui&page=1
 * GET /api/designs?search=gradient
 * GET /api/designs?userId=65a8b3c9e123456789abcde
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": [ {...}, {...} ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 150,
 *     "pages": 8,
 *     "hasNextPage": true,
 *     "hasPrevPage": false
 *   }
 * }
 * 
 * WHY PUBLIC?
 * - Anyone can browse designs (like Dribbble)
 * - Increases discoverability
 * - SEO-friendly (Google can index)
 * - Login only required for actions (create, like, comment)
 */
router.get('/', getAllDesigns);

/**
 * @route   GET /api/designs/trending
 * @desc    Get trending designs
 * @access  Public
 * 
 * QUERY PARAMS:
 * - limit: Number of designs (default: 20)
 * 
 * IMPORTANT: Must be BEFORE /:id route!
 * WHY?
 * - Routes match in order defined
 * - If /:id comes first, "trending" matches as an ID
 * - Always put specific routes before parameterized routes
 * 
 * ✅ Correct order:
 * /designs/trending → Matches "trending" string
 * /designs/:id → Matches any ID
 * 
 * ❌ Wrong order:
 * /designs/:id → "trending" treated as ID!
 * /designs/trending → Never reached
 */
router.get('/trending', getTrendingDesigns);

/**
 * @route   GET /api/designs/:id
 * @desc    Get single design by ID
 * @access  Public
 * 
 * URL PARAMS:
 * - id: Design MongoDB ObjectId
 * 
 * OPTIONAL AUTH:
 * - If user logged in, includes isLiked/isSaved status
 * - If not logged in, works but no personalization
 * 
 * EXAMPLE:
 * GET /api/designs/65a8b3c9e123456789abcde
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "65a8b3c9...",
 *     "title": "Modern Dashboard",
 *     "imageUrl": "https://...",
 *     "user": { "username": "john_designer" },
 *     "likesCount": 42,
 *     "viewsCount": 350,
 *     "isLiked": false,     ← Only if authenticated
 *     "isSaved": true,      ← Only if authenticated
 *     "createdAt": "2024-01-17T10:30:00.000Z"
 *   }
 * }
 * 
 * AUTO INCREMENTS VIEW COUNT
 * Each GET request increments viewsCount by 1
 */
router.get('/:id', getDesignById);

/**
 * ===================================
 * PROTECTED ROUTES (Auth required)
 * ===================================
 * 
 * All routes below require valid JWT token.
 * Must include Authorization header:
 * Authorization: Bearer <token>
 */

/**
 * @route   POST /api/designs
 * @desc    Create new design
 * @access  Private
 * 
 * HEADERS:
 * Authorization: Bearer <token>
 * Content-Type: application/json
 * 
 * BODY:
 * {
 *   "title": "Modern Dashboard UI",
 *   "description": "Clean dashboard design with dark mode",
 *   "imageUrl": "https://cloudinary.com/...",
 *   "thumbnailUrl": "https://cloudinary.com/thumb...",
 *   "cloudinaryId": "designs/abc123",
 *   "tags": ["dashboard", "ui", "modern"],
 *   "category": "web"
 * }
 * 
 * RESPONSE (201 Created):
 * {
 *   "success": true,
 *   "data": { ...new design... }
 * }
 * 
 * NOTE: imageUrl comes from separate upload endpoint
 * FLOW:
 * 1. Upload image → POST /api/upload → Get imageUrl
 * 2. Create design → POST /api/designs → With imageUrl
 */
router.post('/', protect, createDesign);

/**
 * @route   GET /api/designs/saved
 * @desc    Get user's saved designs
 * @access  Private
 * 
 * QUERY PARAMS:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * 
 * IMPORTANT: Must be BEFORE /:id route!
 * (Same reason as /trending)
 * 
 * EXAMPLE:
 * GET /api/designs/saved?page=1&limit=20
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "designId": { ...design object... },
 *       "savedAt": "2024-01-17T10:30:00.000Z"
 *     }
 *   ],
 *   "pagination": { ... }
 * }
 */
router.get('/saved', protect, getSavedDesigns);

/**
 * @route   PUT /api/designs/:id
 * @desc    Update design
 * @access  Private (owner only)
 * 
 * BODY (partial update):
 * {
 *   "title": "Updated Title",
 *   "description": "New description",
 *   "tags": ["new", "tags"]
 * }
 * 
 * OWNERSHIP CHECK:
 * - Only design owner can update
 * - Returns 403 Forbidden if not owner
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": { ...updated design... },
 *   "message": "Design updated successfully"
 * }
 */
router.put('/:id', protect, updateDesign);

/**
 * @route   DELETE /api/designs/:id
 * @desc    Delete design (soft delete)
 * @access  Private (owner only)
 * 
 * SOFT DELETE:
 * - Sets isDeleted = true
 * - Design not shown in lists
 * - Can be restored by admin
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Design deleted successfully"
 * }
 */
router.delete('/:id', protect, deleteDesign);

/**
 * @route   POST /api/designs/:id/like
 * @desc    Like or unlike design (toggle)
 * @access  Private
 * 
 * IDEMPOTENT OPERATION:
 * - First call: Adds like
 * - Second call: Removes like
 * - Third call: Adds like again
 * 
 * NO BODY REQUIRED (just URL param)
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "liked": true,
 *     "likesCount": 43
 *   },
 *   "message": "Design liked"
 * }
 * 
 * ALTERNATIVE DESIGN (Separate routes):
 * POST /api/designs/:id/like → Add like only
 * DELETE /api/designs/:id/like → Remove like only
 * 
 * Our choice: Single toggle endpoint (simpler for frontend)
 */
router.post('/:id/like', protect, likeDesign);

/**
 * @route   POST /api/designs/:id/save
 * @desc    Save or unsave design (toggle bookmark)
 * @access  Private
 * 
 * IDEMPOTENT: Toggle save/unsave
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "saved": true,
 *     "saveCount": 25
 *   },
 *   "message": "Design saved"
 * }
 */
router.post('/:id/save', protect, saveDesign);

/**
 * ===================================
 * ROUTE ORDERING EXPLAINED
 * ===================================
 * 
 * ORDER MATTERS!
 * Express matches routes in definition order.
 * First match wins.
 * 
 * ✅ Correct order:
 * 1. GET /designs/trending
 * 2. GET /designs/saved
 * 3. GET /designs/:id
 * 4. POST /designs/:id/like
 * 
 * Request: GET /designs/trending
 * → Matches route 1 ✅
 * 
 * Request: GET /designs/65a8b3c9e123
 * → Skips route 1 (doesn't match "trending")
 * → Skips route 2 (doesn't match "saved")
 * → Matches route 3 ✅
 * 
 * 
 * ❌ Wrong order:
 * 1. GET /designs/:id
 * 2. GET /designs/trending
 * 
 * Request: GET /designs/trending
 * → Matches route 1 (treats "trending" as ID) ❌
 * → Tries to find design with ID "trending"
 * → Returns 404 Not Found
 * → Route 2 never reached!
 * 
 * RULE: Specific routes BEFORE parameterized routes
 */

/**
 * ===================================
 * FRONTEND INTEGRATION EXAMPLES
 * ===================================
 * 
 * REACT + AXIOS:
 * ──────────────────────────────────
 * 
 * // Get all designs
 * const getDesigns = async (page = 1, filters = {}) => {
 *   const params = new URLSearchParams({
 *     page,
 *     limit: 20,
 *     ...filters
 *   });
 *   
 *   const response = await axios.get(`/api/designs?${params}`);
 *   return response.data;
 * };
 * 
 * // Get single design
 * const getDesign = async (designId) => {
 *   const response = await axios.get(`/api/designs/${designId}`);
 *   return response.data.data;
 * };
 * 
 * // Create design (with auth)
 * const createDesign = async (designData) => {
 *   const token = localStorage.getItem('token');
 *   const response = await axios.post('/api/designs', designData, {
 *     headers: {
 *       Authorization: `Bearer ${token}`
 *     }
 *   });
 *   return response.data.data;
 * };
 * 
 * // Like design (with auth)
 * const likeDesign = async (designId) => {
 *   const token = localStorage.getItem('token');
 *   const response = await axios.post(`/api/designs/${designId}/like`, {}, {
 *     headers: {
 *       Authorization: `Bearer ${token}`
 *     }
 *   });
 *   return response.data.data;
 * };
 * 
 * // Axios interceptor (auto-add token)
 * axios.interceptors.request.use((config) => {
 *   const token = localStorage.getItem('token');
 *   if (token) {
 *     config.headers.Authorization = `Bearer ${token}`;
 *   }
 *   return config;
 * });
 * 
 * // Now all requests auto-include token:
 * await axios.post('/api/designs', designData); // Token added automatically!
 */

export default router;
