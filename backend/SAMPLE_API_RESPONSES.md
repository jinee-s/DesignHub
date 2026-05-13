# Sample API Responses

This document contains example responses for all API endpoints. Use these as reference when building your frontend.

---

## 📝 Authentication Responses

### Register Success
**Request:** `POST /api/auth/register`
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NSIsImlhdCI6MTczOTI5NTYwMCwiZXhwIjoxNzQxODg3NjAwfQ.7Jx9K3mP2nQ8rT5vW1yZ4cX6bH7gN9jL0mA2sB3dC4e",
  "user": {
    "_id": "65f1234567890abcdef12345",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": "",
    "avatar": "",
    "followers": 0,
    "following": 0,
    "designCount": 0,
    "createdAt": "2026-02-10T15:30:00.000Z",
    "updatedAt": "2026-02-10T15:30:00.000Z"
  }
}
```

### Register Error (Validation)
**Response:** `400 Bad Request`
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Password must be at least 8 characters"
}
```

### Register Error (Duplicate Email)
**Response:** `409 Conflict`
```json
{
  "status": "fail",
  "statusCode": 409,
  "message": "Email already exists"
}
```

### Login Success
**Request:** `POST /api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NSIsImlhdCI6MTczOTI5NTYwMCwiZXhwIjoxNzQxODg3NjAwfQ.7Jx9K3mP2nQ8rT5vW1yZ4cX6bH7gN9jL0mA2sB3dC4e",
  "user": {
    "_id": "65f1234567890abcdef12345",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": "UI/UX Designer passionate about creating beautiful interfaces",
    "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/john_doe.jpg",
    "followers": 42,
    "following": 15,
    "designCount": 8,
    "createdAt": "2026-02-10T15:30:00.000Z",
    "updatedAt": "2026-02-11T10:20:00.000Z"
  }
}
```

### Login Error (Invalid Credentials)
**Response:** `401 Unauthorized`
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### Login Error (Rate Limited)
**Response:** `429 Too Many Requests`
```json
{
  "status": "fail",
  "statusCode": 429,
  "message": "Too many login attempts. Please try again in 15 minutes."
}
```

### Get Current User
**Request:** `GET /api/auth/me`
**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": "UI/UX Designer passionate about creating beautiful interfaces",
    "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/john_doe.jpg",
    "followers": 42,
    "following": 15,
    "designCount": 8,
    "savedDesigns": ["65f2345678901bcdef23456", "65f3456789012cdef34567"],
    "createdAt": "2026-02-10T15:30:00.000Z",
    "updatedAt": "2026-02-11T10:20:00.000Z"
  }
}
```

### Auth Error (No Token)
**Response:** `401 Unauthorized`
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "Not authorized to access this route"
}
```

### Auth Error (Invalid Token)
**Response:** `401 Unauthorized`
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "Invalid token. Please log in again."
}
```

---

## 🎨 Design Responses

### Get All Designs
**Request:** `GET /api/designs?page=1&limit=2&sort=popular`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "total": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "title": "Modern Dashboard UI",
      "description": "Clean and minimal dashboard design with dark mode support",
      "imageUrl": "https://res.cloudinary.com/designhub/image/upload/v1739295600/designs/dashboard.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/designhub/image/upload/w_400,h_300,c_fill/v1739295600/designs/dashboard.jpg",
      "cloudinaryId": "designhub/designs/dashboard_abc123",
      "category": "UI/UX",
      "tags": ["dashboard", "minimal", "modern", "dark-mode"],
      "user": {
        "_id": "65f9876543210fedcba54321",
        "username": "jane_designer",
        "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/jane.jpg"
      },
      "likes": 145,
      "views": 1250,
      "saves": 89,
      "commentCount": 12,
      "createdAt": "2026-02-10T15:30:00.000Z",
      "updatedAt": "2026-02-10T16:45:00.000Z"
    },
    {
      "_id": "65f2345678901bcdef23456",
      "title": "Mobile App Mockup",
      "description": "E-commerce mobile application design with smooth animations",
      "imageUrl": "https://res.cloudinary.com/designhub/image/upload/v1739295600/designs/mobile-app.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/designhub/image/upload/w_400,h_300,c_fill/v1739295600/designs/mobile-app.jpg",
      "cloudinaryId": "designhub/designs/mobile_xyz789",
      "category": "Mobile Design",
      "tags": ["mobile", "ecommerce", "app", "ios"],
      "user": {
        "_id": "65f1234567890abcdef12345",
        "username": "john_doe",
        "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/john_doe.jpg"
      },
      "likes": 89,
      "views": 567,
      "saves": 34,
      "commentCount": 5,
      "createdAt": "2026-02-09T10:20:00.000Z",
      "updatedAt": "2026-02-09T10:20:00.000Z"
    }
  ]
}
```

### Get Single Design
**Request:** `GET /api/designs/65f1234567890abcdef12345`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "title": "Modern Dashboard UI",
    "description": "Clean and minimal dashboard design with dark mode support. Features responsive layout, data visualization charts, and user-friendly navigation.",
    "imageUrl": "https://res.cloudinary.com/designhub/image/upload/v1739295600/designs/dashboard.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/designhub/image/upload/w_400,h_300,c_fill/v1739295600/designs/dashboard.jpg",
    "cloudinaryId": "designhub/designs/dashboard_abc123",
    "category": "UI/UX",
    "tags": ["dashboard", "minimal", "modern", "dark-mode", "responsive"],
    "user": {
      "_id": "65f9876543210fedcba54321",
      "username": "jane_designer",
      "email": "jane@example.com",
      "bio": "Senior UI/UX Designer specializing in SaaS products",
      "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/jane.jpg",
      "followers": 1250,
      "following": 340,
      "designCount": 47
    },
    "likes": 145,
    "likedBy": [
      "65f1234567890abcdef12345",
      "65f2468024680acef24680",
      "65f3579135791bdf35791"
    ],
    "isLiked": false,
    "views": 1250,
    "saves": 89,
    "savedBy": [
      "65f4680246802ceg46802",
      "65f5791357913dhf57913"
    ],
    "isSaved": false,
    "commentCount": 12,
    "createdAt": "2026-02-10T15:30:00.000Z",
    "updatedAt": "2026-02-10T16:45:00.000Z"
  }
}
```

### Get Single Design (Not Found)
**Response:** `404 Not Found`
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "Design not found"
}
```

### Get Single Design (Invalid ID)
**Response:** `400 Bad Request`
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Invalid MongoDB ID format"
}
```

### Create Design Success
**Request:** `POST /api/designs`
```json
{
  "title": "My Awesome Design",
  "description": "A beautiful design I created for a client project",
  "imageUrl": "https://res.cloudinary.com/designhub/image/upload/v1739295600/designs/my-design.jpg",
  "thumbnailUrl": "https://res.cloudinary.com/designhub/image/upload/w_400,h_300,c_fill/v1739295600/designs/my-design.jpg",
  "cloudinaryId": "designhub/designs/my-design_def456",
  "category": "Web Design",
  "tags": ["web", "landing-page", "modern"]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "65f3456789012cdef34567",
    "title": "My Awesome Design",
    "description": "A beautiful design I created for a client project",
    "imageUrl": "https://res.cloudinary.com/designhub/image/upload/v1739295600/designs/my-design.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/designhub/image/upload/w_400,h_300,c_fill/v1739295600/designs/my-design.jpg",
    "cloudinaryId": "designhub/designs/my-design_def456",
    "category": "Web Design",
    "tags": ["web", "landing-page", "modern"],
    "user": "65f1234567890abcdef12345",
    "likes": 0,
    "likedBy": [],
    "views": 0,
    "saves": 0,
    "savedBy": [],
    "createdAt": "2026-02-11T12:30:00.000Z",
    "updatedAt": "2026-02-11T12:30:00.000Z"
  }
}
```

### Create Design Error (Validation)
**Response:** `400 Bad Request`
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Title must be between 3 and 100 characters"
}
```

### Like Design
**Request:** `POST /api/designs/65f1234567890abcdef12345/like`

**Response (First Like):** `200 OK`
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 146
  }
}
```

**Response (Unlike):** `200 OK`
```json
{
  "success": true,
  "data": {
    "liked": false,
    "likesCount": 145
  }
}
```

### Save Design
**Request:** `POST /api/designs/65f1234567890abcdef12345/save`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "saved": true,
    "savesCount": 90
  }
}
```

---

## 💬 Comment Responses

### Get Comments for Design
**Request:** `GET /api/designs/65f1234567890abcdef12345/comments`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65f4567890123def45678",
      "content": "This is amazing! Love the color scheme and typography choices.",
      "user": {
        "_id": "65f9876543210fedcba54321",
        "username": "jane_designer",
        "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/jane.jpg"
      },
      "design": "65f1234567890abcdef12345",
      "parentId": null,
      "likes": 5,
      "likedBy": [
        "65f1234567890abcdef12345",
        "65f2468024680acef24680"
      ],
      "isLiked": false,
      "replyCount": 2,
      "createdAt": "2026-02-10T16:30:00.000Z",
      "updatedAt": "2026-02-10T16:30:00.000Z",
      "replies": [
        {
          "_id": "65f5678901234ef56789",
          "content": "Thank you so much! Really appreciate it.",
          "user": {
            "_id": "65f1234567890abcdef12345",
            "username": "john_doe",
            "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/john_doe.jpg"
          },
          "design": "65f1234567890abcdef12345",
          "parentId": "65f4567890123def45678",
          "likes": 2,
          "likedBy": ["65f9876543210fedcba54321"],
          "isLiked": false,
          "createdAt": "2026-02-10T17:00:00.000Z",
          "updatedAt": "2026-02-10T17:00:00.000Z"
        },
        {
          "_id": "65f6789012345f67890a",
          "content": "I agree! The dark mode is perfect.",
          "user": {
            "_id": "65f2468024680acef24680",
            "username": "designer_mike",
            "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/mike.jpg"
          },
          "design": "65f1234567890abcdef12345",
          "parentId": "65f4567890123def45678",
          "likes": 1,
          "likedBy": [],
          "isLiked": false,
          "createdAt": "2026-02-10T17:15:00.000Z",
          "updatedAt": "2026-02-10T17:15:00.000Z"
        }
      ]
    },
    {
      "_id": "65f7890123456g78901b",
      "content": "What font did you use for the headings?",
      "user": {
        "_id": "65f3579135791bdf35791",
        "username": "curious_dev",
        "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/dev.jpg"
      },
      "design": "65f1234567890abcdef12345",
      "parentId": null,
      "likes": 0,
      "likedBy": [],
      "isLiked": false,
      "replyCount": 0,
      "createdAt": "2026-02-10T18:00:00.000Z",
      "updatedAt": "2026-02-10T18:00:00.000Z",
      "replies": []
    },
    {
      "_id": "65f8901234567h89012c",
      "content": "Incredible work! Very inspiring.",
      "user": {
        "_id": "65f4680246802ceg46802",
        "username": "design_lover",
        "avatar": ""
      },
      "design": "65f1234567890abcdef12345",
      "parentId": null,
      "likes": 3,
      "likedBy": [
        "65f1234567890abcdef12345",
        "65f9876543210fedcba54321",
        "65f2468024680acef24680"
      ],
      "isLiked": true,
      "replyCount": 0,
      "createdAt": "2026-02-11T09:30:00.000Z",
      "updatedAt": "2026-02-11T09:30:00.000Z",
      "replies": []
    }
  ]
}
```

### Add Comment
**Request:** `POST /api/designs/65f1234567890abcdef12345/comments`
```json
{
  "content": "Great work! Very inspiring."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "65f9012345678i90123d",
    "content": "Great work! Very inspiring.",
    "user": {
      "_id": "65f1234567890abcdef12345",
      "username": "john_doe",
      "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/john_doe.jpg"
    },
    "design": "65f1234567890abcdef12345",
    "parentId": null,
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026-02-11T12:45:00.000Z",
    "updatedAt": "2026-02-11T12:45:00.000Z"
  }
}
```

### Add Reply to Comment
**Request:** `POST /api/designs/65f1234567890abcdef12345/comments`
```json
{
  "content": "Thank you!",
  "parentId": "65f4567890123def45678"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "65f0123456789j01234e",
    "content": "Thank you!",
    "user": {
      "_id": "65f9876543210fedcba54321",
      "username": "jane_designer",
      "avatar": "https://res.cloudinary.com/designhub/image/upload/v1739295600/avatars/jane.jpg"
    },
    "design": "65f1234567890abcdef12345",
    "parentId": "65f4567890123def45678",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026-02-11T13:00:00.000Z",
    "updatedAt": "2026-02-11T13:00:00.000Z"
  }
}
```

### Comment Error (Too Long)
**Response:** `400 Bad Request`
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Content must not exceed 500 characters"
}
```

### Comment Error (Rate Limited)
**Response:** `429 Too Many Requests`
```json
{
  "status": "fail",
  "statusCode": 429,
  "message": "Too many comments. Please slow down."
}
```

---

## 📤 Upload Responses

### Upload Image Success
**Request:** `POST /api/upload/image`
**Body:** `FormData with 'image' field`

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://res.cloudinary.com/designhub/image/upload/v1739295600/designs/upload_abc123.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/designhub/image/upload/w_400,h_300,c_fill/v1739295600/designs/upload_abc123.jpg",
    "cloudinaryId": "designhub/designs/upload_abc123",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "size": 245678
  }
}
```

### Upload Error (No File)
**Response:** `400 Bad Request`
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Please upload an image"
}
```

### Upload Error (File Too Large)
**Response:** `400 Bad Request`
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "File size exceeds 5MB limit"
}
```

### Upload Error (Invalid Format)
**Response:** `400 Bad Request`
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Invalid file format. Allowed: jpg, jpeg, png, gif, webp"
}
```

### Upload Error (Rate Limited)
**Response:** `429 Too Many Requests`
```json
{
  "status": "fail",
  "statusCode": 429,
  "message": "Too many uploads. You can upload 20 images per hour."
}
```

---

## 🔧 Error Responses (General)

### Unauthorized (No Token)
**Response:** `401 Unauthorized`
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "Not authorized to access this route"
}
```

### Forbidden (Not Owner)
**Response:** `403 Forbidden`
```json
{
  "status": "fail",
  "statusCode": 403,
  "message": "You do not have permission to perform this action"
}
```

### Not Found (Route)
**Response:** `404 Not Found`
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "Route /api/invalid not found"
}
```

### Internal Server Error
**Response:** `500 Internal Server Error`
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Something went wrong"
}
```
**Note:** In production, error details are hidden. In development, you'll see stack trace.

---

## 📊 Response Headers

All rate-limited endpoints include these headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1739295600
Retry-After: 900
```

**Frontend Usage:**
```javascript
const response = await fetch('/api/designs');

// Check rate limit status
const remaining = response.headers.get('RateLimit-Remaining');
const resetTime = response.headers.get('RateLimit-Reset');

if (remaining < 10) {
  console.warn(`Only ${remaining} requests remaining`);
}

// Handle 429 error
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  alert(`Too many requests. Try again in ${retryAfter} seconds.`);
}
```

---

## 🎯 Response Format Standards

### Success Responses

**Single Resource:**
```json
{
  "success": true,
  "data": { /* resource object */ }
}
```

**Multiple Resources:**
```json
{
  "success": true,
  "count": 10,
  "pagination": { /* pagination object */ },
  "data": [ /* array of resources */ ]
}
```

**Action Responses (like, save):**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 146
  }
}
```

### Error Responses

**All errors follow this format:**
```json
{
  "status": "fail" | "error",
  "statusCode": 400,
  "message": "Human-readable error message"
}
```

**Development Mode:** Includes `stack` property with stack trace
**Production Mode:** No stack trace, sanitized error messages

---

**Frontend Best Practices:**

1. **Always check `response.ok`** before parsing JSON
2. **Handle specific status codes** (401, 403, 404, 429, 500)
3. **Use `success` property** to determine if operation succeeded
4. **Check `statusCode`** for HTTP status
5. **Display `message`** to users (already human-readable)
6. **Parse `pagination`** for list responses
7. **Monitor rate limit headers** to prevent hitting limits
8. **Store `token`** securely (localStorage or httpOnly cookies)
9. **Show loading states** during API calls
10. **Implement retry logic** for network errors (not for 4xx errors)
