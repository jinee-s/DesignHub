# Design & Comment API Tests

## Setup
```powershell
# Login and get token
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{email="test@test.com"; password="Password123!"} | ConvertTo-Json)
$token = $login.token

# Get design ID
$designs = Invoke-RestMethod -Uri "http://localhost:5000/api/designs" -Method GET
$designId = $designs.data[0]._id
Write-Host "Design ID: $designId"
```

## Test Results

### ✅ 1. POST /api/designs - Create Design
**Status:** PASS  
**Response:** 201 Created
```json
{
  "_id": "698b73c61b5deee9d8e042aa",
  "title": "Modern Dashboard UI",
  "likesCount": 0,
  "views": 0
}
```

### ✅ 2. GET /api/designs - Get All Designs (with pagination)
**Status:** PASS  
**Response:** 200 OK
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "total": 1,
    "pages": 1,
    "hasNextPage": false
  }
}
```

### ✅ 3. GET /api/designs/:id - Get Single Design
**Status:** PASS  
**Views incremented:** 0 → 1 ✅
```json
{
  "views": 1,
  "isLiked": false,
  "isSaved": false
}
```

### ✅ 4. POST /api/designs/:id/like - Toggle Like
**Status:** PASS  
**Like:** `{ "liked": true, "likesCount": 1 }`  
**Unlike:** `{ "liked": false, "likesCount": 0 }`  

### ✅ 5. POST /api/designs/:id/save - Toggle Save
**Status:** PASS  
**Save:** `{ "saved": true }`  
**Unsave:** `{ "saved": false }`  

### ✅ 6. POST /api/designs/:designId/comments - Add Comment
**Status:** PASS  
**Response:** 201 Created
```json
{
  "_id": "698b75678b0b5864a65678c5",
  "content": "This is an amazing design! Love the color scheme and layout.",
  "likesCount": 0,
  "replyCount": 0
}
```
**Fix Applied:** Added `{ mergeParams: true }` to comment router

### ✅ 7. GET /api/designs/:designId/comments - Get Comments
**Status:** PASS  
**Response:** 200 OK with pagination

### ✅ 8. POST /api/comments/:id/like - Like Comment
**Status:** PASS  
**Response:** `{ "liked": true, "likesCount": 1 }`

### ✅ 9. PUT /api/comments/:id - Update Comment
**Status:** PASS  
**Response:** `{ "isEdited": true, "content": "Updated..." }`

## PowerShell Test Commands

```powershell
# 1. Create Design
$body = @{
  title="Modern Dashboard UI"
  description="A clean and minimal dashboard design"
  category="Web Design"
  tags=@("dashboard","ui","minimal")
  imageUrl="https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800"
  thumbnailUrl="https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400"
  cloudinaryId="test_design_1"
} | ConvertTo-Json

$design = Invoke-RestMethod -Uri "http://localhost:5000/api/designs" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $body

# 2. Get all designs
$all = Invoke-RestMethod -Uri "http://localhost:5000/api/designs" -Method GET

# 3. Get single design
$single = Invoke-RestMethod -Uri "http://localhost:5000/api/designs/$designId" -Method GET

# 4. Like design
$like = Invoke-RestMethod -Uri "http://localhost:5000/api/designs/$designId/like" -Method POST -Headers @{"Authorization"="Bearer $token"}

# 5. Save design
$save = Invoke-RestMethod -Uri "http://localhost:5000/api/designs/$designId/save" -Method POST -Headers @{"Authorization"="Bearer $token"}

# 6. Add comment (NEEDS FIX)
$comment = Invoke-RestMethod -Uri "http://localhost:5000/api/designs/$designId/comments" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body (@{content="Great design!"} | ConvertTo-Json)
```

## Summary

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| /api/designs | POST | ✅ PASS | Creates design with all fields |
| /api/designs | GET | ✅ PASS | Returns paginated results |
| /api/designs/:id | GET | ✅ PASS | Increments view count |
| /api/designs/:id/like | POST | ✅ PASS | Toggles like/unlike |
| /api/designs/:id/save | POST | ✅ PASS | Toggles save/unsave |
| /api/designs/:id/comments | POST | ✅ PASS | Adds comment (mergeParams fix) |
| /api/designs/:id/comments | GET | ✅ PASS | Gets comments with pagination |
| /api/comments/:id/like | POST | ✅ PASS | Toggles comment like |
| /api/comments/:id | PUT | ✅ PASS | Updates comment, sets isEdited |

**All core backend APIs  are working!** ✅

## Bugs Fixed
1. **ObjectId constructor error** - Changed `mongoose.Types.ObjectId(id)` to `new mongoose.Types.ObjectId(id)` in Design.js and Comment.js
2. **Comment routes 404** - Added `{ mergeParams: true }` to commentRoutes router
3. **Route ordering** - Moved nested comment routes BEFORE design routes in server.js
