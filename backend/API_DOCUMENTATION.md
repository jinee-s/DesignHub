# DesignHub API Documentation for Frontend Developers

## 🎯 Welcome, Frontend Developer!

This guide explains **exactly** how to use the DesignHub backend API in your React/Vue/Angular application. Think of the backend as a waiter at a restaurant - you order (make requests), and it brings you food (returns data).

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Frontend Integration Examples](#frontend-integration-examples)
5. [Error Handling](#error-handling)
6. [Common Patterns](#common-patterns)

---

## Quick Start

### Base URL
```
Local Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Header
Most endpoints require a JWT token:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
  'Content-Type': 'application/json'
}
```

### Quick Test (No Auth Required)
```javascript
// Test if backend is running
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
// Returns: { success: true, message: "DesignHub API is running! 🚀" }
```

---

## Authentication Flow

### 🔐 How Authentication Works

**Think of it like a movie theater:**
1. You buy a ticket (register/login)
2. You get a stamped ticket (JWT token)
3. You show the ticket to enter (include token in requests)
4. Ticket expires after some time (token has expiration)

### Step-by-Step Frontend Flow

#### 1. Register New User
```javascript
// POST /api/auth/register
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
console.log(data);
```

**✅ Success Response (201 Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65f1234567890abcdef12345",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": "",
    "avatar": "",
    "createdAt": "2026-02-10T15:30:00.000Z"
  }
}
```

**❌ Error Response (400 Bad Request):**
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Password must be at least 8 characters"
}
```

**What to do with the response:**
```javascript
if (data.success) {
  // Save token to localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // Redirect to dashboard
  navigate('/dashboard');
} else {
  // Show error to user
  setError(data.message);
}
```

#### 2. Login Existing User
```javascript
// POST /api/auth/login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
```

**✅ Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65f1234567890abcdef12345",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": "UI/UX Designer",
    "avatar": "https://res.cloudinary.com/...",
    "followers": 42,
    "following": 15,
    "designCount": 8,
    "createdAt": "2026-02-10T15:30:00.000Z"
  }
}
```

**❌ Error Response (401 Unauthorized):**
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

#### 3. Get Current User (Protected Route)
```javascript
// GET /api/auth/me
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

**✅ Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": "UI/UX Designer",
    "avatar": "https://res.cloudinary.com/...",
    "followers": 42,
    "following": 15
  }
}
```

**❌ Error Response (401 Unauthorized):**
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "Invalid token. Please log in again."
}
```

---

## API Endpoints Reference

### 📝 Designs

#### 1. Get All Designs (Public)
```javascript
// GET /api/designs?page=1&limit=20&sort=popular
const response = await fetch('http://localhost:5000/api/designs?page=1&limit=20');
const data = await response.json();
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort` (optional): `newest`, `oldest`, `popular`, `trending`
- `category` (optional): Filter by category

**✅ Success Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "total": 2,
    "hasNext": false,
    "hasPrev": false
  },
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "title": "Modern Dashboard UI",
      "description": "Clean and minimal dashboard design",
      "imageUrl": "https://res.cloudinary.com/designhub/image.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/.../w_400,h_300/image.jpg",
      "cloudinaryId": "designhub/designs/abc123",
      "category": "UI/UX",
      "tags": ["dashboard", "minimal", "modern"],
      "user": {
        "_id": "65f9876543210fedcba54321",
        "username": "jane_designer",
        "avatar": "https://res.cloudinary.com/..."
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
      "description": "E-commerce mobile application design",
      "imageUrl": "https://res.cloudinary.com/designhub/image2.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/.../w_400,h_300/image2.jpg",
      "category": "Mobile Design",
      "tags": ["mobile", "ecommerce", "app"],
      "user": {
        "_id": "65f1234567890abcdef12345",
        "username": "john_doe",
        "avatar": "https://res.cloudinary.com/..."
      },
      "likes": 89,
      "views": 567,
      "saves": 34,
      "commentCount": 5,
      "createdAt": "2026-02-09T10:20:00.000Z"
    }
  ]
}
```

**Frontend Usage:**
```javascript
// React example
const [designs, setDesigns] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchDesigns = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/designs');
      const data = await response.json();
      
      if (data.success) {
        setDesigns(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchDesigns();
}, []);

// Render
return (
  <div className="grid">
    {designs.map(design => (
      <DesignCard key={design._id} design={design} />
    ))}
  </div>
);
```

#### 2. Get Single Design (Public)
```javascript
// GET /api/designs/:id
const designId = '65f1234567890abcdef12345';
const response = await fetch(`http://localhost:5000/api/designs/${designId}`);
const data = await response.json();
```

**✅ Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "title": "Modern Dashboard UI",
    "description": "Clean and minimal dashboard design with dark mode support",
    "imageUrl": "https://res.cloudinary.com/designhub/image.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../w_400,h_300/image.jpg",
    "category": "UI/UX",
    "tags": ["dashboard", "minimal", "modern", "dark-mode"],
    "user": {
      "_id": "65f9876543210fedcba54321",
      "username": "jane_designer",
      "email": "jane@example.com",
      "bio": "Senior UI/UX Designer",
      "avatar": "https://res.cloudinary.com/...",
      "followers": 1250,
      "following": 340
    },
    "likes": 145,
    "likedBy": ["user_id_1", "user_id_2"],
    "isLiked": false,
    "views": 1250,
    "saves": 89,
    "savedBy": ["user_id_3", "user_id_4"],
    "isSaved": false,
    "commentCount": 12,
    "createdAt": "2026-02-10T15:30:00.000Z",
    "updatedAt": "2026-02-10T16:45:00.000Z"
  }
}
```

**❌ Error Response (404 Not Found):**
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "Design not found"
}
```

#### 3. Create Design (Protected)
```javascript
// POST /api/designs
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/designs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Awesome Design',
    description: 'A beautiful design I created',
    imageUrl: 'https://res.cloudinary.com/designhub/my-image.jpg',
    thumbnailUrl: 'https://res.cloudinary.com/.../w_400,h_300/my-image.jpg',
    cloudinaryId: 'designhub/designs/xyz789',
    category: 'UI/UX',
    tags: ['modern', 'clean', 'minimal']
  })
});

const data = await response.json();
```

**✅ Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "65f3456789012cdef34567",
    "title": "My Awesome Design",
    "description": "A beautiful design I created",
    "imageUrl": "https://res.cloudinary.com/designhub/my-image.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../w_400,h_300/my-image.jpg",
    "cloudinaryId": "designhub/designs/xyz789",
    "category": "UI/UX",
    "tags": ["modern", "clean", "minimal"],
    "user": "65f1234567890abcdef12345",
    "likes": 0,
    "views": 0,
    "saves": 0,
    "createdAt": "2026-02-10T18:20:00.000Z",
    "updatedAt": "2026-02-10T18:20:00.000Z"
  }
}
```

**Complete Upload Flow (Image + Design):**
```javascript
// Step 1: Upload image first
const formData = new FormData();
formData.append('image', selectedFile);

const uploadResponse = await fetch('http://localhost:5000/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const uploadData = await uploadResponse.json();
// uploadData.data contains: { imageUrl, thumbnailUrl, cloudinaryId }

// Step 2: Create design with image URLs
const designResponse = await fetch('http://localhost:5000/api/designs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Design',
    description: 'Description here',
    imageUrl: uploadData.data.imageUrl,
    thumbnailUrl: uploadData.data.thumbnailUrl,
    cloudinaryId: uploadData.data.cloudinaryId,
    category: 'UI/UX',
    tags: ['modern']
  })
});
```

#### 4. Like/Unlike Design (Protected)
```javascript
// POST /api/designs/:id/like
const token = localStorage.getItem('token');
const designId = '65f1234567890abcdef12345';

const response = await fetch(`http://localhost:5000/api/designs/${designId}/like`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

**✅ Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 146
  }
}
```

**Frontend Usage:**
```javascript
// React example - Toggle like button
const [liked, setLiked] = useState(false);
const [likesCount, setLikesCount] = useState(145);

const handleLike = async () => {
  try {
    const response = await fetch(`/api/designs/${designId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      setLiked(data.data.liked);
      setLikesCount(data.data.likesCount);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

return (
  <button onClick={handleLike}>
    {liked ? '❤️' : '🤍'} {likesCount}
  </button>
);
```

### 💬 Comments

#### 1. Get Comments for Design (Public)
```javascript
// GET /api/designs/:designId/comments
const designId = '65f1234567890abcdef12345';
const response = await fetch(`http://localhost:5000/api/designs/${designId}/comments`);
const data = await response.json();
```

**✅ Success Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65f4567890123def45678",
      "content": "This is amazing! Love the color scheme.",
      "user": {
        "_id": "65f9876543210fedcba54321",
        "username": "jane_designer",
        "avatar": "https://res.cloudinary.com/..."
      },
      "design": "65f1234567890abcdef12345",
      "parentId": null,
      "likes": 5,
      "isLiked": false,
      "replyCount": 1,
      "createdAt": "2026-02-10T16:30:00.000Z",
      "replies": [
        {
          "_id": "65f5678901234ef56789",
          "content": "Thank you so much!",
          "user": {
            "_id": "65f1234567890abcdef12345",
            "username": "john_doe",
            "avatar": "https://res.cloudinary.com/..."
          },
          "parentId": "65f4567890123def45678",
          "likes": 2,
          "createdAt": "2026-02-10T17:00:00.000Z"
        }
      ]
    },
    {
      "_id": "65f6789012345f67890",
      "content": "What font did you use?",
      "user": {
        "_id": "65f2468024680acef24680",
        "username": "designer_mike",
        "avatar": "https://res.cloudinary.com/..."
      },
      "likes": 0,
      "isLiked": false,
      "replyCount": 0,
      "createdAt": "2026-02-10T18:00:00.000Z",
      "replies": []
    }
  ]
}
```

#### 2. Add Comment (Protected)
```javascript
// POST /api/designs/:designId/comments
const token = localStorage.getItem('token');
const designId = '65f1234567890abcdef12345';

const response = await fetch(`http://localhost:5000/api/designs/${designId}/comments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Great work! Very inspiring.'
  })
});

// Add reply to comment
const parentCommentId = '65f4567890123def45678';
const replyResponse = await fetch(`http://localhost:5000/api/designs/${designId}/comments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Thank you!',
    parentId: parentCommentId  // Makes this a reply
  })
});
```

**✅ Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "65f7890123456g78901",
    "content": "Great work! Very inspiring.",
    "user": {
      "_id": "65f1234567890abcdef12345",
      "username": "john_doe",
      "avatar": "https://res.cloudinary.com/..."
    },
    "design": "65f1234567890abcdef12345",
    "parentId": null,
    "likes": 0,
    "createdAt": "2026-02-10T18:30:00.000Z",
    "updatedAt": "2026-02-10T18:30:00.000Z"
  }
}
```

### 📤 Image Upload

#### Upload Single Image (Protected)
```javascript
// POST /api/upload/image
const token = localStorage.getItem('token');
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('image', file);

const response = await fetch('http://localhost:5000/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Note: Don't set Content-Type for FormData, browser sets it automatically
  },
  body: formData
});

const data = await response.json();
```

**✅ Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://res.cloudinary.com/designhub/designs/abc123.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../w_400,h_300/abc123.jpg",
    "cloudinaryId": "designhub/designs/abc123",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "size": 245678
  }
}
```

**React Upload Component:**
```jsx
const ImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB)');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.data.imageUrl);
        // Now use data.data.imageUrl in design creation
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} accept="image/*" />
      {uploading && <p>Uploading...</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
};
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | What Happened |
|------|---------|---------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input (validation failed) |
| 401 | Unauthorized | Not logged in or invalid token |
| 403 | Forbidden | Logged in but no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (email exists) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server bug (report to backend team) |

### Error Response Format

All errors follow this structure:
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Validation error message here"
}
```

### Frontend Error Handling Pattern

```javascript
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if request was successful
    if (!response.ok) {
      // Handle specific error codes
      switch (response.status) {
        case 401:
          // Token expired or invalid - logout user
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Please login again');
        
        case 403:
          throw new Error('You do not have permission');
        
        case 404:
          throw new Error('Not found');
        
        case 429:
          throw new Error('Too many requests. Please slow down.');
        
        default:
          throw new Error(data.message || 'Something went wrong');
      }
    }

    return data;
  } catch (error) {
    // Network error or fetch failed
    console.error('API Error:', error);
    throw error;
  }
};

// Usage
try {
  const data = await apiCall('/api/designs', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  setDesigns(data.data);
} catch (error) {
  setError(error.message);
}
```

---

## Common Patterns

### 1. Create API Client Utility

```javascript
// utils/api.js
const API_BASE_URL = 'http://localhost:5000/api';

class API {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add token if available
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Auth methods
  static register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static getMe() {
    return this.request('/auth/me');
  }

  // Design methods
  static getDesigns(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/designs?${query}`);
  }

  static getDesign(id) {
    return this.request(`/designs/${id}`);
  }

  static createDesign(designData) {
    return this.request('/designs', {
      method: 'POST',
      body: JSON.stringify(designData),
    });
  }

  static likeDesign(id) {
    return this.request(`/designs/${id}/like`, {
      method: 'POST',
    });
  }

  // Comment methods
  static getComments(designId) {
    return this.request(`/designs/${designId}/comments`);
  }

  static addComment(designId, content, parentId = null) {
    return this.request(`/designs/${designId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  // Upload method
  static uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    
    return fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }).then(res => res.json());
  }
}

export default API;
```

**Usage:**
```javascript
// In your components
import API from './utils/api';

// Register
const handleRegister = async () => {
  try {
    const data = await API.register({ username, email, password });
    localStorage.setItem('token', data.token);
    navigate('/dashboard');
  } catch (error) {
    setError(error.message);
  }
};

// Get designs
useEffect(() => {
  const fetchDesigns = async () => {
    try {
      const data = await API.getDesigns({ page: 1, limit: 20 });
      setDesigns(data.data);
    } catch (error) {
      console.error(error);
    }
  };
  fetchDesigns();
}, []);
```

### 2. Protected Route Component (React)

```jsx
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Usage in App.jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

### 3. Context/State Management (React)

```jsx
// context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Verify token and get user
      API.getMe()
        .then(data => {
          setUser(data.data);
        })
        .catch(() => {
          // Invalid token
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Usage in components
const Dashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

---

## Rate Limiting

The API has rate limits to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| All routes | 100 requests | 15 minutes |
| Login/Register | 5 requests | 15 minutes |
| Image Upload | 20 uploads | 1 hour |
| Comments | 30 comments | 1 hour |

**HTTP Headers in Response:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1739295600
```

**Frontend Usage:**
```javascript
const response = await fetch('/api/designs');
console.log('Remaining requests:', response.headers.get('RateLimit-Remaining'));
```

**429 Error Handling:**
```javascript
if (response.status === 429) {
  const resetTime = response.headers.get('RateLimit-Reset');
  const minutesLeft = Math.ceil((resetTime * 1000 - Date.now()) / 60000);
  alert(`Too many requests. Try again in ${minutesLeft} minutes.`);
}
```

---

## Summary for Frontend Developers

### Quick Checklist

✅ **Authentication:**
1. Store JWT token in localStorage after login/register
2. Include token in Authorization header for protected routes
3. Handle 401 errors by redirecting to login
4. Clear token on logout

✅ **API Calls:**
1. Use fetch or axios (axios recommended for easier API)
2. Set Content-Type: application/json for JSON data
3. Don't set Content-Type for FormData (file uploads)
4. Check response.ok before using data

✅ **Error Handling:**
1. Always wrap API calls in try-catch
2. Display user-friendly error messages
3. Handle 401 (logout user), 429 (rate limit), 404 (not found)
4. Log errors to console for debugging

✅ **Best Practices:**
1. Create API utility class for reusable code
2. Use React Context/Redux for global state (user, auth)
3. Implement loading states while fetching
4. Show progress bars for uploads
5. Debounce search inputs
6. Cache responses when possible

---

**Need Help?**
- Check Postman collection: `POSTMAN_COLLECTION.json`
- View example responses: `SAMPLE_API_RESPONSES.md`
- Contact backend team: @backend-dev-team

Happy coding! 🚀
