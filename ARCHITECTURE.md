# 🎨 DesignHub - Architecture Documentation

## 📌 Table of Contents
1. [Features Breakdown](#features)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Schema Design](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Image Upload Flow](#image-upload-flow)
7. [Folder Structure](#folder-structure)
8. [API Documentation](#api-documentation)

---

## 1. Features Breakdown {#features}

### 🎯 MVP (Minimum Viable Product) - Build These First
These are MUST-HAVE features to make the app functional. Every design portfolio needs these.

| Feature | Description | Real-World Example |
|---------|-------------|-------------------|
| **User Registration** | Sign up with name, email, password | Dribbble's "Sign Up" |
| **User Login** | Authenticate users with JWT tokens | Behance login system |
| **Upload Design** | Upload image with title, description, tags | Posting a "shot" on Dribbble |
| **View All Designs (Feed)** | Browse all designs in grid layout | Dribbble homepage feed |
| **Design Detail Page** | Click a design to see full details | Dribbble shot detail page |
| **User Profile** | View a user's uploaded designs | Designer profile on Behance |
| **Like Design** | Toggle like on designs | Heart button on Dribbble |
| **Responsive Layout** | Mobile, tablet, desktop support | All modern platforms |

**Why MVP First?**  
In real startups, you build MVP to validate the idea quickly. Once users like it, you add advanced features.

---

### ✨ Nice-to-Have Features (Phase 2)
These make your project stand out in interviews but aren't critical for launch.

| Feature | Description | Impact on Resume |
|---------|-------------|------------------|
| **Comments** | Users can comment on designs | Shows you can handle nested data |
| **Follow System** | Follow designers to see their work | Relationship modeling (Many-to-Many) |
| **Search & Filter** | Search by tags, filter by category | Full-text search, query optimization |
| **Trending/Popular** | Sort by likes, views, recent | Aggregation queries (MongoDB) |
| **User Settings** | Edit profile, change password | CRUD operations mastery |
| **Email Notifications** | Notify on likes/comments | Integration with external services |
| **Dark Mode** | Toggle theme | Modern UX feature |
| **Infinite Scroll** | Load more designs on scroll | Pagination & lazy loading |

**Interview Tip:** Even if you don't build all nice-to-have features, mention them in interviews to show you understand scalability.

---

## 2. Frontend Architecture {#frontend-architecture}

### 📄 Pages & Routes

| Route | Page Component | Purpose | Requires Auth? |
|-------|---------------|---------|----------------|
| `/` | Home/Feed | Browse all designs | No |
| `/login` | Login | User login form | No |
| `/register` | Register | Sign up form | No |
| `/upload` | UploadDesign | Upload new design | **Yes** |
| `/design/:id` | DesignDetail | View single design | No |
| `/profile/:userId` | UserProfile | View user's portfolio | No |
| `/profile/edit` | EditProfile | Edit own profile | **Yes** |

**Real-World Comparison:**
- `/` → dribbble.com (homepage)
- `/design/:id` → dribbble.com/shots/12345
- `/profile/:userId` → dribbble.com/username

---

### 🧩 Component Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx           ← Top navigation bar
│   │   ├── Footer.jsx           ← Footer component
│   │   ├── Loader.jsx           ← Loading spinner
│   │   └── ProtectedRoute.jsx   ← Auth guard for private routes
│   │
│   ├── design/
│   │   ├── DesignCard.jsx       ← Single design preview card
│   │   ├── DesignGrid.jsx       ← Grid of design cards
│   │   ├── DesignDetail.jsx     ← Full design view
│   │   └── UploadForm.jsx       ← Design upload form
│   │
│   ├── auth/
│   │   ├── LoginForm.jsx        ← Login form
│   │   └── RegisterForm.jsx     ← Registration form
│   │
│   └── user/
│       ├── ProfileHeader.jsx    ← User info section
│       └── ProfileGallery.jsx   ← User's designs grid
```

**Why This Structure?**
- **Organized by feature:** Easier to find components (used in companies like Airbnb)
- **Reusable:** `DesignCard` used in Feed, Profile, Search
- **Scalable:** Easy to add new features without mess

---

### 🎨 Key Frontend Technologies Explained

```javascript
// Example: Why we use these libraries

// 1. REACT ROUTER (Routing)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Without it: You'd need to manually handle URL changes (messy!)
// With it: Clean routes like Dribbble (/shots/123)

// 2. AXIOS (API calls)
import axios from 'axios';
// Better than fetch() because:
// - Auto JSON parsing
// - Interceptors for auth tokens
// - Better error handling

// 3. REACT CONTEXT (State management)
import { createContext, useContext } from 'react';
// Avoid "prop drilling" - pass user data to any component
// Alternative: Redux (overkill for small projects)

// 4. REACT HOOK FORM (Form handling)
import { useForm } from 'react-hook-form';
// Handles validation, errors, submission smoothly
// Real apps ALWAYS use form libraries (never raw state)
```

---

## 3. Backend Architecture {#backend-architecture}

### 🗂️ MVC Pattern (Industry Standard)

```
backend/
├── models/        ← Database schemas (M = Model)
├── controllers/   ← Business logic (C = Controller)
├── routes/        ← API endpoints (routes to controllers)
├── middleware/    ← Auth, validation, error handling
└── utils/         ← Helper functions
```

**Why MVC?**
- **Separation of Concerns:** Database logic ≠ API logic
- **Used by:** Laravel, Django, Ruby on Rails, Express
- **Interview Gold:** Interviewers LOVE when you mention patterns

---

### 🛣️ Route Organization

```javascript
// routes/index.js
app.use('/api/auth', authRoutes);      // Login, Register
app.use('/api/users', userRoutes);     // User profiles
app.use('/api/designs', designRoutes); // Design CRUD
app.use('/api/upload', uploadRoutes);  // Cloudinary upload
```

**Real-World Example:**
- Stripe API: `api.stripe.com/v1/customers`
- Our API: `localhost:5000/api/designs`

---

## 4. Database Schema Design {#database-schema}

### 📊 ER Diagram (Entity Relationship)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    User      │         │   Design     │         │    Like      │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ _id          │────┐    │ _id          │         │ _id          │
│ username     │    │    │ title        │    ┌────│ userId       │
│ email        │    └───→│ userId       │    │    │ designId     │
│ password     │         │ imageUrl     │    │    │ createdAt    │
│ avatar       │         │ description  │    │    └──────────────┘
│ bio          │         │ tags[]       │    │
│ createdAt    │         │ likes[]      │────┘
└──────────────┘         │ views        │
                         │ createdAt    │
                         └──────────────┘
```

---

### 🗄️ MongoDB Collections (Tables)

#### **1. Users Collection**

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  username: "john_designer",
  email: "john@example.com",
  password: "$2b$10$hashed_password_here", // NEVER store plain text!
  avatar: "https://cloudinary.com/avatar.jpg",
  bio: "UI/UX Designer from San Francisco",
  createdAt: ISODate("2026-01-15T10:30:00Z")
}
```

**Why These Fields?**
- `_id`: Auto-generated by MongoDB (unique identifier)
- `password`: Hashed with bcrypt (10 rounds = secure)
- `avatar`: Cloudinary URL (not stored in DB, just link)
- `createdAt`: Timestamp for "Member since 2026"

---

#### **2. Designs Collection**

```javascript
{
  _id: ObjectId("507f191e810c19729de860ea"),
  title: "Modern Dashboard UI",
  description: "Clean dashboard design for SaaS products",
  imageUrl: "https://res.cloudinary.com/designhub/image.jpg",
  thumbnailUrl: "https://res.cloudinary.com/designhub/thumb.jpg", // Optimized
  tags: ["dashboard", "ui", "saas", "modern"],
  category: "Web Design", // Optional: UI, Illustration, Branding, etc.
  
  // Relationships
  userId: ObjectId("507f1f77bcf86cd799439011"), // Who uploaded this?
  
  // Engagement metrics
  likes: [
    ObjectId("user1_id"),
    ObjectId("user2_id")
  ], // Array of user IDs who liked
  views: 245,
  
  createdAt: ISODate("2026-02-05T14:20:00Z"),
  updatedAt: ISODate("2026-02-05T14:20:00Z")
}
```

**Design Decisions Explained:**

| Field | Why? | Real-World Example |
|-------|------|-------------------|
| `thumbnailUrl` | Load thumbnails in feed (fast), full image on detail page | Instagram feed vs post view |
| `tags[]` | Enable search/filter functionality | Dribbble's tag system |
| `likes[]` | Array of user IDs = easy to check "did I like this?" | YouTube likes |
| `views` | Track popularity (increment on each view) | Medium article views |

**Beginner Mistake to Avoid:**
❌ **Don't store images in MongoDB** (max 16MB document size)  
✅ **Store Cloudinary URLs** (images live on CDN, DB stores links)

---

#### **3. Likes Collection (Optional - Better Approach)**

Instead of `likes[]` array in Design, use separate collection for scalability:

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  designId: ObjectId("507f191e810c19729de860ea"),
  createdAt: ISODate("2026-02-08T09:15:00Z")
}
```

**Why Separate Collection?**
- **Scalability:** If a design has 10,000 likes, the array grows huge
- **Query Performance:** Faster to query "give me all designs this user liked"
- **Used by:** Instagram, Twitter (separate likes table)

**For MVP:** Use `likes[]` array (simpler)  
**For Resume Impact:** Mention you'd use separate collection at scale

---

## 5. Authentication Flow {#authentication-flow}

### 🔐 How JWT Authentication Works

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │                    │  Database   │
│  (React)    │                    │  (Express)  │                    │  (MongoDB)  │
└─────────────┘                    └─────────────┘                    └─────────────┘
      │                                    │                                    │
      │  1. POST /api/auth/register       │                                    │
      │  { email, password, username }    │                                    │
      │───────────────────────────────────>│                                    │
      │                                    │  2. Hash password (bcrypt)         │
      │                                    │───────────────────────────────────>│
      │                                    │                                    │
      │                                    │  3. Save user to DB                │
      │                                    │<───────────────────────────────────│
      │                                    │                                    │
      │  4. Return success                 │                                    │
      │<───────────────────────────────────│                                    │
      │                                    │                                    │
      │  5. POST /api/auth/login           │                                    │
      │  { email, password }               │                                    │
      │───────────────────────────────────>│                                    │
      │                                    │  6. Find user by email             │
      │                                    │───────────────────────────────────>│
      │                                    │<───────────────────────────────────│
      │                                    │                                    │
      │                                    │  7. Compare password (bcrypt)      │
      │                                    │  8. Generate JWT token             │
      │  9. Return { token, user }         │                                    │
      │<───────────────────────────────────│                                    │
      │                                    │                                    │
      │ 10. Store token in localStorage    │                                    │
      │                                    │                                    │
      │ 11. GET /api/designs               │                                    │
      │ Headers: { Authorization: token }  │                                    │
      │───────────────────────────────────>│                                    │
      │                                    │ 12. Verify JWT token               │
      │                                    │ 13. Decode user ID from token      │
      │                                    │ 14. Fetch designs                  │
      │                                    │───────────────────────────────────>│
      │ 15. Return designs                 │<───────────────────────────────────│
      │<───────────────────────────────────│                                    │
```

### 🔑 JWT Token Explained

```javascript
// What's inside a JWT token?

// HEADER
{
  "alg": "HS256",      // Algorithm used
  "typ": "JWT"         // Token type
}

// PAYLOAD (your data)
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "iat": 1675849200,   // Issued at (timestamp)
  "exp": 1676454000    // Expires in 7 days
}

// SIGNATURE (prevents tampering)
HMACSHA256(
  base64(header) + "." + base64(payload),
  SECRET_KEY  // Only server knows this!
)

// Final token looks like:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJpYXQiOjE2NzU4NDkyMDAsImV4cCI6MTY3NjQ1NDAwMH0.signature_here
```

**Why JWT?**
- **Stateless:** Server doesn't store sessions (scales to millions of users)
- **Secure:** Tamper-proof (thanks to signature)
- **Used by:** Google, GitHub, Stripe APIs

**Where to Store JWT on Frontend?**
- ✅ **localStorage** (simple, good for learning)
- ⚠️ **httpOnly cookies** (more secure, prevents XSS attacks - use in production)

---

### 🛡️ Protected Routes Flow

```javascript
// Frontend: Protect routes that require login

// ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />; // Redirect to login
  }
  
  return children; // Show protected page
};

// App.jsx
<Route 
  path="/upload" 
  element={
    <ProtectedRoute>
      <UploadDesign />
    </ProtectedRoute>
  } 
/>
```

---

## 6. Image Upload Flow {#image-upload-flow}

### 📸 Cloudinary Integration (Why Not Store in MongoDB?)

**Problem:** Images are BIG (2-5 MB). MongoDB has 16MB document limit.  
**Solution:** Upload to Cloudinary (CDN), store URL in MongoDB.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Server    │         │ Cloudinary  │         │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │                        │
      │ 1. Select image file   │                        │                        │
      │ (from file input)      │                        │                        │
      │                        │                        │                        │
      │ 2. POST /api/upload    │                        │                        │
      │ FormData: { image }    │                        │                        │
      │───────────────────────>│                        │                        │
      │                        │ 3. Upload to Cloudinary│                        │
      │                        │───────────────────────>│                        │
      │                        │                        │ 4. Optimize & store    │
      │                        │                        │ 5. Return secure URL   │
      │                        │<───────────────────────│                        │
      │                        │                        │                        │
      │                        │ 6. Save design with URL│                        │
      │                        │───────────────────────────────────────────────>│
      │ 7. Return design object│                        │                        │
      │<───────────────────────│                        │                        │
      │                        │                        │                        │
      │ 8. Display image using │                        │                        │
      │ Cloudinary URL         │                        │                        │
```

### 🔧 Cloudinary Setup

```javascript
// Backend: config/cloudinary.js

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // From Cloudinary dashboard
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload function
const uploadImage = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'designhub',           // Organizes uploads
    transformation: [
      { width: 1200, crop: 'limit' },  // Max width (responsive)
      { quality: 'auto' },              // Auto optimize
      { fetch_format: 'auto' }          // WebP for Chrome, JPG for Safari
    ]
  });
  
  return result.secure_url; // HTTPS URL
};
```

**Benefits:**
- **Auto-optimization:** Cloudinary converts to WebP (smaller size)
- **CDN delivery:** Fast loading worldwide
- **Free tier:** 25 GB storage (enough for portfolio)

---

## 7. Folder Structure {#folder-structure}

### 📁 Backend Structure (Node.js + Express)

```
backend/
├── node_modules/           ← Dependencies (auto-generated)
├── src/
│   ├── config/
│   │   ├── db.js           ← MongoDB connection setup
│   │   └── cloudinary.js   ← Cloudinary config
│   │
│   ├── models/
│   │   ├── User.js         ← User schema (Mongoose)
│   │   └── Design.js       ← Design schema
│   │
│   ├── controllers/
│   │   ├── authController.js    ← Register, Login logic
│   │   ├── designController.js  ← CRUD for designs
│   │   ├── userController.js    ← User profile logic
│   │   └── uploadController.js  ← Cloudinary upload
│   │
│   ├── routes/
│   │   ├── authRoutes.js        ← /api/auth routes
│   │   ├── designRoutes.js      ← /api/designs routes
│   │   ├── userRoutes.js        ← /api/users routes
│   │   └── uploadRoutes.js      ← /api/upload routes
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    ← JWT verification
│   │   ├── errorHandler.js      ← Global error handler
│   │   └── uploadMiddleware.js  ← Multer (file upload)
│   │
│   └── utils/
│       ├── generateToken.js     ← JWT token generator
│       └── validators.js        ← Input validation helpers
│
├── .env                    ← Environment variables (NEVER commit!)
├── .gitignore              ← Git ignore file
├── package.json            ← Dependencies list
└── server.js               ← Entry point (starts server)
```

---

### 📁 Frontend Structure (React + Vite)

```
frontend/
├── node_modules/           ← Dependencies
├── public/
│   └── favicon.ico         ← Site icon
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── design/
│   │   │   ├── DesignCard.jsx
│   │   │   ├── DesignGrid.jsx
│   │   │   ├── DesignDetail.jsx
│   │   │   └── UploadForm.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   │
│   │   └── user/
│   │       ├── ProfileHeader.jsx
│   │       └── ProfileGallery.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx              ← Feed page
│   │   ├── Login.jsx             ← Login page
│   │   ├── Register.jsx          ← Register page
│   │   ├── UploadDesign.jsx      ← Upload page
│   │   ├── DesignDetailPage.jsx  ← Single design view
│   │   └── UserProfile.jsx       ← Profile page
│   │
│   ├── context/
│   │   └── AuthContext.jsx       ← Global auth state
│   │
│   ├── api/
│   │   └── axios.js              ← Axios config (base URL, interceptors)
│   │
│   ├── utils/
│   │   ├── formatDate.js         ← Helper functions
│   │   └── truncate.js
│   │
│   ├── App.jsx                   ← Main app component
│   ├── main.jsx                  ← Entry point
│   └── index.css                 ← Global styles (Tailwind)
│
├── .env                          ← Frontend env variables
├── .gitignore
├── tailwind.config.js            ← Tailwind configuration
├── vite.config.js                ← Vite configuration
└── package.json
```

**Why This Structure?**
- **pages/**: Top-level route components
- **components/**: Reusable pieces
- **context/**: Global state (auth user info)
- **api/**: Centralized API logic

---

## 8. API Documentation {#api-documentation}

### 📡 REST API Endpoints

#### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| POST | `/api/auth/register` | Create new user | No | `{ username, email, password }` | `{ token, user }` |
| POST | `/api/auth/login` | Login user | No | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | Get current user | Yes | - | `{ user }` |

**Example Request:**
```javascript
// Register
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_designer",
  "email": "john@example.com",
  "password": "SecurePass123"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_designer",
    "email": "john@example.com"
  }
}
```

---

#### **Design Endpoints**

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/api/designs` | Get all designs (feed) | No | - | `{ designs[] }` |
| GET | `/api/designs/:id` | Get single design | No | - | `{ design }` |
| POST | `/api/designs` | Create design | Yes | `{ title, description, imageUrl, tags[] }` | `{ design }` |
| PUT | `/api/designs/:id` | Update design | Yes | `{ title, description, tags[] }` | `{ design }` |
| DELETE | `/api/designs/:id` | Delete design | Yes | - | `{ message }` |
| POST | `/api/designs/:id/like` | Toggle like | Yes | - | `{ design }` |
| POST | `/api/designs/:id/view` | Increment view count | No | - | `{ design }` |

**Example Request:**
```javascript
// Get all designs (with query params for filtering)
GET /api/designs?tags=ui,dashboard&sort=popular&limit=20

// Response
{
  "success": true,
  "count": 15,
  "designs": [
    {
      "_id": "507f191e810c19729de860ea",
      "title": "Modern Dashboard",
      "imageUrl": "https://cloudinary.com/...",
      "userId": {
        "_id": "...",
        "username": "john_designer",
        "avatar": "..."
      },
      "likes": 24,
      "views": 150,
      "tags": ["dashboard", "ui"],
      "createdAt": "2026-02-05T14:20:00Z"
    }
    // ... more designs
  ]
}
```

---

#### **User Endpoints**

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/api/users/:userId` | Get user profile | No | - | `{ user, designs[] }` |
| PUT | `/api/users/:userId` | Update profile | Yes (own) | `{ bio, avatar }` | `{ user }` |
| GET | `/api/users/:userId/designs` | Get user's designs | No | - | `{ designs[] }` |

---

#### **Upload Endpoint**

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| POST | `/api/upload` | Upload image to Cloudinary | Yes | FormData: `{ image }` | `{ imageUrl }` |

**Example Request:**
```javascript
// Frontend code
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await axios.post('/api/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  }
});

// Response
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/designhub/image/upload/v1234567890/designhub/abc123.jpg"
}
```

---

## 🎯 Common Beginner Mistakes to Avoid

### ❌ Backend Mistakes

1. **Storing passwords in plain text**
   ```javascript
   // ❌ NEVER DO THIS
   const user = new User({ password: req.body.password });
   
   // ✅ ALWAYS HASH
   const hashedPassword = await bcrypt.hash(req.body.password, 10);
   const user = new User({ password: hashedPassword });
   ```

2. **Not validating user input**
   ```javascript
   // ❌ BAD - No validation
   const { email } = req.body;
   
   // ✅ GOOD - Validate
   if (!email || !email.includes('@')) {
     return res.status(400).json({ error: 'Invalid email' });
   }
   ```

3. **Exposing sensitive data**
   ```javascript
   // ❌ DON'T send password in response
   res.json({ user });
   
   // ✅ Exclude password
   const user = await User.findById(id).select('-password');
   ```

---

### ❌ Frontend Mistakes

1. **Not handling loading states**
   ```javascript
   // ❌ Users see blank screen while loading
   return <div>{designs.map(...)}</div>
   
   // ✅ Show loader
   if (loading) return <Loader />;
   return <div>{designs.map(...)}</div>
   ```

2. **Not handling errors**
   ```javascript
   // ❌ Silent failures
   axios.get('/api/designs').then(res => setDesigns(res.data));
   
   // ✅ Catch errors
   axios.get('/api/designs')
     .then(res => setDesigns(res.data))
     .catch(err => setError(err.message));
   ```

3. **Hardcoding API URLs**
   ```javascript
   // ❌ Breaks in production
   axios.get('http://localhost:5000/api/designs');
   
   // ✅ Use environment variables
   axios.get(`${import.meta.env.VITE_API_URL}/api/designs`);
   ```

---

## 🚀 Next Steps

Now that you understand the architecture, here's the build sequence:

### Phase 1: Backend Foundation (Days 1-3)
1. ✅ Initialize Node.js project
2. ✅ Setup MongoDB connection
3. ✅ Create User model
4. ✅ Build authentication (register/login)
5. ✅ Test with Postman

### Phase 2: Design System (Days 4-6)
1. ✅ Create Design model
2. ✅ Setup Cloudinary
3. ✅ Build upload endpoint
4. ✅ Build CRUD endpoints
5. ✅ Test image upload

### Phase 3: Frontend Setup (Days 7-9)
1. ✅ Initialize Vite + React
2. ✅ Setup Tailwind CSS
3. ✅ Configure routing
4. ✅ Create auth context
5. ✅ Build Navbar component

### Phase 4: UI Development (Days 10-14)
1. ✅ Build auth pages (Login/Register)
2. ✅ Build feed page with DesignGrid
3. ✅ Build upload form
4. ✅ Build design detail page
5. ✅ Build user profile page

### Phase 5: Integration & Features (Days 15-17)
1. ✅ Connect frontend to backend
2. ✅ Implement like functionality
3. ✅ Add search/filter
4. ✅ Responsive design polish

### Phase 6: Deployment (Days 18-20)
1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Configure environment variables
4. ✅ Test production build

---

## 📚 Interview Talking Points

When discussing this project in interviews:

1. **Architecture:** "I used MVC pattern to separate concerns"
2. **Authentication:** "Implemented JWT for stateless auth, bcrypt for password security"
3. **Database:** "Chose MongoDB for flexible schema, indexed userId for faster queries"
4. **Images:** "Used Cloudinary CDN to optimize images and reduce server load"
5. **Frontend:** "Built reusable components, protected routes with custom HOC"
6. **Deployment:** "Deployed on Vercel (frontend) and Render (backend) with CI/CD"

---

**Ready to start building? Let me know which phase you want to begin with! 🚀**
