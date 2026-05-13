/**
 * ===================================
 * ADMIN MIDDLEWARE
 * ===================================
 * 
 * Middleware to protect admin-only routes.
 * Must be used AFTER authMiddleware (protect).
 * Verifies that authenticated user has 'admin' role.
 * 
 * FLOW:
 * Request → authMiddleware (check token) → adminMiddleware (check role) → Route Handler
 *
 * USAGE:
 * import { protect } from './middleware/authMiddleware.js';
 * import { requireAdmin } from './middleware/adminMiddleware.js';
 * 
 * // Admin-only route
 * app.delete('/api/admin/users/:id', protect, requireAdmin, deleteUserController);
 *
 * PURPOSE:
 * - Verify user is authenticated
 * - Verify user has admin role
 * - Block unauthorized access (non-admins, designers, clients)
 * - Return 403 Forbidden if user lacks permissions
 */

import asyncHandler from 'express-async-handler';

/**
 * ===================================
 * REQUIRE ADMIN
 * ===================================
 * 
 * Checks if authenticated user is an admin.
 * 
 * PREREQUISITES:
 * - Must be used AFTER protect middleware
 * - User object must exist on req.user
 * 
 * What happens:
 * 1. Check if req.user exists (should after protect middleware)
 * 2. Check if user.role === 'admin'
 * 3. If admin: call next() to continue to route handler
 * 4. If not admin: return 403 Forbidden
 * 
 * ERROR CODES:
 * - 403: User authenticated but not authorized (lacks admin role)
 * - 401: User not authenticated (should not reach here if protect() used first)
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  /**
   * STEP 1: Verify user is authenticated
   * If protect middleware ran successfully, req.user should exist
   */
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized. User not found.');
  }

  /**
   * STEP 2: Verify user has admin role
   * 
   * WHY 403 NOT 401?
   * - 401 Unauthorized: "You need to authenticate"
   * - 403 Forbidden: "You're authenticated but don't have permission"
   * 
   * ROLE VALUES:
   * - 'admin': Full platform control (users, designs, moderation)
   * - 'designer': Can upload designs, manage portfolio
   * - 'client': Can browse, hire designers
   */
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error(`Access denied. Admin role required. Your role: ${req.user.role}`);
  }

  /**
   * STEP 3: User is admin, continue to route handler
   * Similar to how protect() calls next()
   */
  next();
});

/**
 * EXAMPLE USAGE IN ROUTES
 * ─────────────────────────
 * 
 * import { protect } from './middleware/authMiddleware.js';
 * import { requireAdmin } from './middleware/adminMiddleware.js';
 * import { adminController } from './controllers/adminController.js';
 * 
 * // Admin panel: List all users
 * app.get('/api/admin/users', protect, requireAdmin, adminController.listUsers);
 * 
 * // Admin panel: Delete user
 * app.delete('/api/admin/users/:id', protect, requireAdmin, adminController.deleteUser);
 * 
 * // Admin panel: Approve/Reject design
 * app.post('/api/admin/designs/:id/approve', protect, requireAdmin, adminController.approveDesign);
 * 
 * TESTING SCENARIOS:
 * ──────────────────
 * 
 * SCENARIO 1: Non-authenticated user
 * Request: GET /api/admin/users
 * Response: 401 Unauthorized (from protect middleware)
 * 
 * SCENARIO 2: Designer user
 * Request: GET /api/admin/users (with valid JWT for designer)
 * Response: 403 Forbidden (from requireAdmin middleware)
 * Body: "Access denied. Admin role required. Your role: designer"
 * 
 * SCENARIO 3: Admin user
 * Request: GET /api/admin/users (with valid JWT for admin)
 * Response: 200 OK (route handler executes)
 * Body: List of all users
 */
