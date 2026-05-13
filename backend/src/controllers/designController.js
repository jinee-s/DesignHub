/**
 * ===================================
 * DESIGN CONTROLLER
 * ===================================
 * 
 * Handles HTTP requests for design operations.
 * 
 * CONTROLLER RESPONSIBILITY:
 * ════════════════════════════════════
 * 
 * ✅ Extract data from HTTP request
 *    - req.body (POST/PUT data)
 *    - req.params (URL parameters)
 *    - req.query (query strings)
 *    - req.user (from auth middleware)
 * 
 * ✅ Validate input
 *    - Check required fields
 *    - Sanitize data
 * 
 * ✅ Call service layer
 *    - Pass data to business logic
 *    - Let service handle complex operations
 * 
 * ✅ Return HTTP response
 *    - Proper status codes
 *    - Consistent JSON format
 *    - Error handling
 * 
 * ❌ NO business logic here!
 *    - Don't write database queries
 *    - Don't implement algorithms
 *    - Keep controllers thin!
 * 
 * 
 * HTTP STATUS CODES (REST API Standard):
 * ════════════════════════════════════
 * 
 * SUCCESS (2xx):
 * ────────────────────────────────────
 * 200 OK
 * - GET requests (fetch data)
 * - PUT/PATCH requests (update successful)
 * - DELETE requests (delete successful)
 * Example: GET /designs → 200 + designs array
 * 
 * 201 Created
 * - POST requests (resource created)
 * Example: POST /designs → 201 + new design object
 * 
 * 204 No Content
 * - DELETE with no response body
 * - PUT with no content to return
 * Example: DELETE /designs/:id → 204 (success, no data)
 * 
 * 
 * CLIENT ERRORS (4xx):
 * ────────────────────────────────────
 * 400 Bad Request
 * - Invalid input data
 * - Missing required fields
 * - Validation errors
 * Example: POST /designs with no title → 400
 * 
 * 401 Unauthorized
 * - No authentication token
 * - Invalid/expired token
 * Example: POST /designs without login → 401
 * 
 * 403 Forbidden
 * - Authenticated but no permission
 * - Not the owner of resource
 * Example: DELETE someone else's design → 403
 * 
 * 404 Not Found
 * - Resource doesn't exist
 * - Invalid ID
 * Example: GET /designs/invalidID → 404
 * 
 * 409 Conflict
 * - Duplicate resource
 * - Conflicting state
 * Example: Like already liked design → 409 (or 200 with idempotent response)
 * 
 * 422 Unprocessable Entity
 * - Syntax correct but semantic errors
 * - Business rule violations
 * Example: Upload design > 10MB → 422
 * 
 * 
 * SERVER ERRORS (5xx):
 * ────────────────────────────────────
 * 500 Internal Server Error
 * - Unexpected server error
 * - Database connection failed
 * - Unhandled exception
 * Example: MongoDB down → 500
 * 
 * 503 Service Unavailable
 * - Server overloaded
 * - Maintenance mode
 * Example: Rate limit exceeded → 503
 * 
 * 
 * REST API PRINCIPLES:
 * ════════════════════════════════════
 * 
 * 1. RESOURCE-BASED URLS
 * ────────────────────────────────────
 * ✅ Good: /designs, /users, /comments
 * ❌ Bad: /getDesigns, /createUser, /deleteComment
 * 
 * Resources are nouns, not verbs!
 * HTTP method indicates action:
 * - GET /designs → Fetch designs
 * - POST /designs → Create design
 * - PUT /designs/:id → Update design
 * - DELETE /designs/:id → Delete design
 * 
 * 
 * 2. HTTP METHODS (CRUD)
 * ────────────────────────────────────
 * GET (Read)
 * - Fetch data
 * - Safe (no side effects)
 * - Idempotent (same result every time)
 * - Cacheable
 * 
 * POST (Create)
 * - Create new resource
 * - NOT idempotent (creates multiple resources)
 * - Returns 201 Created
 * 
 * PUT (Update - full replace)
 * - Update entire resource
 * - Idempotent (same result every time)
 * - Returns 200 OK
 * 
 * PATCH (Update - partial)
 * - Update specific fields
 * - Idempotent
 * - Returns 200 OK
 * 
 * DELETE (Delete)
 * - Remove resource
 * - Idempotent
 * - Returns 200 OK or 204 No Content
 * 
 * 
 * 3. CONSISTENT RESPONSE FORMAT
 * ────────────────────────────────────
 * Success:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "message": "Design created successfully"
 * }
 * 
 * Error:
 * {
 *   "success": false,
 *   "message": "Design not found",
 *   "error": "NotFoundError"
 * }
 * 
 * 
 * 4. VERSIONING (Future)
 * ────────────────────────────────────
 * /api/v1/designs
 * /api/v2/designs
 * 
 * Or header-based:
 * Accept: application/vnd.myapi.v1+json
 * 
 * 
 * 5. FILTERING, SORTING, PAGINATION
 * ────────────────────────────────────
 * GET /designs?category=web&sortBy=popular&page=2&limit=20
 * 
 * Query parameters for:
 * - Filter: ?category=web
 * - Sort: ?sortBy=popular
 * - Paginate: ?page=2&limit=20
 * - Search: ?search=gradient
 */

import asyncHandler from 'express-async-handler';
import * as designService from '../services/designService.js';

/**
 * ===================================
 * CREATE DESIGN
 * ===================================
 * 
 * @route   POST /api/designs
 * @access  Private (requires authentication)
 * 
 * REQUEST BODY:
 * {
 *   "title": "Modern Dashboard UI",
 *   "description": "Clean dashboard design...",
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
 *   "data": {
 *     "_id": "65a8b3c9...",
 *     "title": "Modern Dashboard UI",
 *     "imageUrl": "https://...",
 *     "user": { "username": "john_designer", "avatar": "..." },
 *     "likesCount": 0,
 *     "createdAt": "2024-01-17T10:30:00.000Z"
 *   }
 * }
 */
export const createDesign = asyncHandler(async (req, res) => {
  const { title, description, imageUrl, thumbnailUrl, cloudinaryId, tags, category } = req.body;

  // Normalize category shortcuts (accept short keys from clients)
  const categoryMap = {
    web: 'Web Design',
    'web design': 'Web Design',
    mobile: 'Mobile UI',
    'mobile ui': 'Mobile UI',
    illustration: 'Illustration',
    branding: 'Branding',
    typography: 'Typography',
    icon: 'Icon Design',
    'icon design': 'Icon Design',
    logo: 'Logo Design',
    'logo design': 'Logo Design',
    print: 'Print Design',
    'print design': 'Print Design',
    product: 'Product Design',
    other: 'Other'
  };

  let normalizedCategory = undefined;
  if (category !== undefined && category !== null) {
    const key = String(category).toLowerCase().trim();
    normalizedCategory = categoryMap[key] || category; // allow full label passthrough
  }

  // NOTE: Removed debug logging for production safety.

  // Validation
  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('Title is required');
  }

  if (!imageUrl) {
    res.status(400);
    throw new Error('Image is required');
  }

  // Call service layer
  const design = await designService.createDesign(
    {
      title,
      description,
      imageUrl,
      thumbnailUrl,
      cloudinaryId,
      tags,
      category: normalizedCategory
    },
    req.user._id // From protect middleware
  );

  res.status(201).json({
    success: true,
    data: design
  });
});

/**
 * ===================================
 * GET ALL DESIGNS
 * ===================================
 * 
 * @route   GET /api/designs
 * @access  Public
 * 
 * QUERY PARAMETERS:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - category: Filter by category (web, mobile, illustration, etc.)
 * - tags: Filter by tags (comma-separated)
 * - userId: Filter by user
 * - search: Text search in title/description
 * - sortBy: Sort option (newest, popular, trending, views, oldest)
 * 
 * EXAMPLES:
 * GET /api/designs
 * GET /api/designs?page=2&limit=30
 * GET /api/designs?category=web
 * GET /api/designs?tags=dashboard,ui
 * GET /api/designs?sortBy=popular
 * GET /api/designs?search=gradient
 * 
 * RESPONSE (200 OK):
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
 */
export const getAllDesigns = asyncHandler(async (req, res) => {
  const { page, limit, category, tags, userId, search, sortBy } = req.query;

  // Parse tags (comma-separated string to array)
  const tagsArray = tags ? tags.split(',').map((tag) => tag.trim()) : undefined;

  // Limit max page size (prevent abuse)
  const maxLimit = 100;
  const parsedLimit = limit ? Math.min(parseInt(limit), maxLimit) : 20;

  const result = await designService.getAllDesigns({
    page,
    limit: parsedLimit,
    category,
    tags: tagsArray,
    userId,
    search,
    sortBy
  });

  res.status(200).json({
    success: true,
    data: result.designs,
    pagination: result.pagination
  });
});

/**
 * ===================================
 * GET DESIGN BY ID
 * ===================================
 * 
 * @route   GET /api/designs/:id
 * @access  Public
 * 
 * URL PARAMETER:
 * - id: Design ID
 * 
 * EXAMPLE:
 * GET /api/designs/65a8b3c9e123456789abcde
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "65a8b3c9...",
 *     "title": "Modern Dashboard",
 *     "description": "...",
 *     "imageUrl": "https://...",
 *     "user": { "username": "john_designer", "avatar": "..." },
 *     "likesCount": 42,
 *     "viewsCount": 350,
 *     "isLiked": false,     ← If user logged in
 *     "isSaved": false,     ← If user logged in
 *     "createdAt": "2024-01-17T10:30:00.000Z"
 *   }
 * }
 * 
 * RESPONSE (404 Not Found):
 * {
 *   "success": false,
 *   "message": "Design not found"
 * }
 */
export const getDesignById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get current user ID if authenticated (optional)
  const currentUserId = req.user ? req.user._id : null;

  try {
    const design = await designService.getDesignById(id, currentUserId);

    res.status(200).json({
      success: true,
      data: design
    });
  } catch (error) {
    if (error.message === 'Design not found') {
      res.status(404);
      throw new Error('Design not found');
    }
    throw error;
  }
});

/**
 * ===================================
 * UPDATE DESIGN
 * ===================================
 * 
 * @route   PUT /api/designs/:id
 * @access  Private (owner only)
 * 
 * REQUEST BODY (partial update):
 * {
 *   "title": "Updated Title",
 *   "description": "New description",
 *   "tags": ["new", "tags"]
 * }
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": { ...updated design... }
 * }
 * 
 * RESPONSE (403 Forbidden):
 * {
 *   "success": false,
 *   "message": "Not authorized to update this design"
 * }
 */
export const updateDesign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const design = await designService.updateDesign(id, req.user._id, updateData);

    res.status(200).json({
      success: true,
      data: design,
      message: 'Design updated successfully'
    });
  } catch (error) {
    if (error.statusCode === 403) {
      res.status(403);
      throw new Error('Not authorized to update this design');
    }
    if (error.message === 'Design not found') {
      res.status(404);
      throw new Error('Design not found');
    }
    throw error;
  }
});

/**
 * ===================================
 * DELETE DESIGN
 * ===================================
 * 
 * @route   DELETE /api/designs/:id
 * @access  Private (owner only)
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Design deleted successfully"
 * }
 * 
 * RESPONSE (403 Forbidden):
 * {
 *   "success": false,
 *   "message": "Not authorized to delete this design"
 * }
 */
export const deleteDesign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await designService.deleteDesign(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Design deleted successfully'
    });
  } catch (error) {
    if (error.statusCode === 403) {
      res.status(403);
      throw new Error('Not authorized to delete this design');
    }
    if (error.message === 'Design not found') {
      res.status(404);
      throw new Error('Design not found');
    }
    throw error;
  }
});

/**
 * ===================================
 * LIKE DESIGN
 * ===================================
 * 
 * @route   POST /api/designs/:id/like
 * @access  Private
 * 
 * IDEMPOTENT OPERATION:
 * Calling multiple times = same result
 * - First call: Adds like
 * - Second call: Removes like (unlike)
 * - Third call: Adds like again
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "liked": true,
 *     "likesCount": 43
 *   }
 * }
 */
export const likeDesign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await designService.toggleLike(id, req.user._id);

    res.status(200).json({
      success: true,
      data: result,
      message: result.liked ? 'Design liked' : 'Design unliked'
    });
  } catch (error) {
    if (error.message === 'Design not found') {
      res.status(404);
      throw new Error('Design not found');
    }
    throw error;
  }
});

/**
 * ===================================
 * SAVE DESIGN (Bookmark)
 * ===================================
 * 
 * @route   POST /api/designs/:id/save
 * @access  Private
 * 
 * IDEMPOTENT OPERATION:
 * Toggle save/unsave
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "saved": true,
 *     "saveCount": 25
 *   }
 * }
 */
export const saveDesign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await designService.toggleSave(id, req.user._id);

    res.status(200).json({
      success: true,
      data: result,
      message: result.saved ? 'Design saved' : 'Design unsaved'
    });
  } catch (error) {
    if (error.message === 'Design not found') {
      res.status(404);
      throw new Error('Design not found');
    }
    throw error;
  }
});

/**
 * ===================================
 * GET USER'S SAVED DESIGNS
 * ===================================
 * 
 * @route   GET /api/designs/saved
 * @access  Private
 * 
 * QUERY PARAMETERS:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": [ {...}, {...} ],
 *   "pagination": { ... }
 * }
 */
export const getSavedDesigns = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await designService.getUserSavedDesigns(req.user._id, {
    page,
    limit
  });

  res.status(200).json({
    success: true,
    data: result.saves,
    pagination: result.pagination
  });
});

/**
 * ===================================
 * GET TRENDING DESIGNS
 * ===================================
 * 
 * @route   GET /api/designs/trending
 * @access  Public
 * 
 * QUERY PARAMETERS:
 * - limit: Number of designs (default: 20)
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": [ {...}, {...} ]
 * }
 */
export const getTrendingDesigns = asyncHandler(async (req, res) => {
  const { limit } = req.query;

  const designs = await designService.getTrendingDesigns({ limit });

  res.status(200).json({
    success: true,
    data: designs
  });
});

/**
 * ===================================
 * CONTROLLER vs SERVICE SEPARATION
 * ===================================
 * 
 * EXAMPLE: Like Design
 * 
 * CONTROLLER (This file):
 * ────────────────────────────────────
 * export const likeDesign = async (req, res) => {
 *   const { id } = req.params;           ← Extract from HTTP request
 *   const userId = req.user._id;         ← From auth middleware
 *   
 *   const result = await designService.toggleLike(id, userId); ← Call service
 *   
 *   res.status(200).json({               ← HTTP response
 *     success: true,
 *     data: result
 *   });
 * };
 * 
 * SERVICE (designService.js):
 * ────────────────────────────────────
 * export const toggleLike = async (designId, userId) => {
 *   const design = await Design.findById(designId);  ← Database query
 *   
 *   if (!design) {
 *     throw new Error('Design not found');          ← Business logic
  }
 *   
 *   const result = await design.toggleLike(userId); ← Model method
 *   return result;                                   ← Return data (no HTTP)
 * };
 * 
 * MODEL (Design.js):
 * ────────────────────────────────────
 * designSchema.methods.toggleLike = async function (userId) {
 *   const index = this.likes.indexOf(userId);       ← Find user in array
 *   
 *   if (index === -1) {
 *     this.likes.push(userId);                      ← Add like
 *     this.likesCount += 1;
 *   } else {
 *     this.likes.splice(index, 1);                  ← Remove like
 *     this.likesCount -= 1;
 *   }
 *   
 *   await this.save();                               ← Save to database
 *   return { liked: index === -1, likesCount: this.likesCount };
 * };
 * 
 * 
 * WHY THIS SEPARATION?
 * ────────────────────────────────────
 * 
 * 1. REUSABILITY
 *    Service can be called from:
 *    - REST API (this controller)
 *    - GraphQL API (different interface, same logic)
 *    - CLI script (admin tools)
 *    - Background job (scheduled tasks)
 * 
 * 2. TESTABILITY
 *    Test service without HTTP:
 *    const result = await designService.toggleLike('designId', 'userId');
 *    expect(result.liked).toBe(true);
 *    (No need to mock req/res!)
 * 
 * 3. THIN CONTROLLERS
 *    Controller = 5-10 lines (just HTTP handling)
 *    Service = Complex logic
 *    Easy to read and maintain
 * 
 * 4. SINGLE RESPONSIBILITY
 *    Controller: HTTP interface
 *    Service: Business rules
 *    Model: Data structure
 *    Each does ONE thing well!
 */
