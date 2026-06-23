# DesignVerse

Full-stack portfolio platform built with **React 18**, **Vite 7**, **TypeScript**, **Node.js**, **Express**, **MongoDB**, and **Tailwind CSS**. Features authentication, image uploads (Cloudinary), design showcase, user profiles, and real-time interactions.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ (npm 8+)
- **MongoDB** running locally (default: `mongodb://localhost:27017/creativehub`)
- Environment variables set (see `.env` files)

### 1. **Start Backend** (Serves SPA + API)
```bash
cd backend
npm install
npm start
```
Backend listening at: **http://localhost:5000**
- SPA served from `frontend/dist`
- API endpoints at `/api/*`
- Health check: `GET /api/health`

### 2. **Build Frontend** (Production)
```bash
cd frontend
npm install
npm run build
```
Outputs optimized SPA to `frontend/dist/`

### 3. **Access Demo**
Open browser: **http://localhost:5000/**

**Test Credentials (Pre-created):**
- Email: `test+bot@example.com`
- Password: `SecurePass123`

---

## 📦 Project Structure

```
Project1/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/              # HomePage, LoginPage, UploadPage, etc.
│   │   ├── components/         # ReusableUI (Button, Input, ErrorBoundary)
│   │   ├── api/                # Axios client, API calls
│   │   ├── contexts/           # AuthContext, NotificationContext
│   │   └── hooks/              # Custom hooks (useAuth, useFetch, etc.)
│   ├── dist/                   # Production build (optimized)
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                     # Node + Express + MongoDB
│   ├── src/
│   │   ├── controllers/        # Business logic (auth, designs, uploads)
│   │   ├── models/             # Mongoose schemas (User, Design, Comment)
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Auth, upload, rate limiting
│   │   └── config/             # MongoDB connection
│   ├── server.js               # Entry point
│   ├── package.json
│   └── .env                    # Configuration (PORT, JWT_SECRET, MongoDB URI)
│
├── ARCHITECTURE.md             # Detailed system design & API docs
└── README.md                   # This file
```

---

## ✅ Features Implemented & Tested

### Core Features
- ✅ **User Authentication** — Register, Login, JWT tokens
- ✅ **Design Showcase** — Browse public designs catalog
- ✅ **Image Uploads** — Upload designs to Cloudinary (protected route)
- ✅ **User Profiles** — View/edit user info and designs
- ✅ **Comments** — Add/delete comments on designs
- ✅ **Like & Save** — Like and save designs (with optimistic updates)
- ✅ **Follow System** — Follow/unfollow users

### Security & Performance
- ✅ **JWT Authentication** — Secure token-based auth with httpOnly cookie support
- ✅ **Password Hashing** — bcrypt (10 rounds)
- ✅ **CORS** — Configured for frontend origins
- ✅ **Rate Limiting** — 100 requests per 15 minutes per IP
- ✅ **Input Sanitization** — NoSQL injection & XSS prevention
- ✅ **Security Headers** — Helmet middleware (HTTPS, CSP, etc.)
- ✅ **Production Build** — Minified, tree-shaken, optimized SPA

### Frontend (React + TypeScript)
- ✅ **TypeScript** — Full type safety
- ✅ **Responsive Design** — Mobile-first, Tailwind CSS
- ✅ **Error Handling** — ErrorBoundary, global error states
- ✅ **Notifications** — Toast notifications (success, error, warning)
- ✅ **Form Validation** — Client-side validation before upload
- ✅ **Optimistic Updates** — Like/save without waiting for server
- ✅ **Lazy Loading** — Images load as they appear in viewport
- ✅ **Accessibility (ARIA)** — Labels, roles, keyboard navigation

### Backend (Node + Express)
- ✅ **RESTful API** — 20+ endpoints for auth, designs, comments, uploads
- ✅ **MongoDB** — Mongoose schemas with validation
- ✅ **Cloudinary Integration** — Image upload & storage
- ✅ **Error Handling** — Centralized error handler, consistent JSON responses
- ✅ **Validation** — Email, password, file type & size checks
- ✅ **Environment Config** — Validates all required env vars on startup

---

## 🧪 Smoke Tests Completed

All core flows verified:

```
✅ GET /api/health → returns { success: true, ... }
✅ GET /api/designs → returns array of designs
✅ GET /api/designs/:id → returns single design
✅ POST /api/auth/register → creates user account
✅ POST /api/auth/login → returns JWT token
✅ GET /api/auth/me (protected) → returns user profile
✅ POST /api/upload/image (protected) → uploads image to Cloudinary
✅ GET / → serves built SPA (index.html from frontend/dist)
```

**Test Results:**
- All endpoints responding with expected status codes (200, 201, 400, 401 where applicable)
- JWT token generation and validation working
- Protected routes properly enforce authentication
- CORS headers correctly set for frontend origins

---

## 🛠️ Development Commands

### Frontend
```bash
cd frontend

# Dev server (Vite, localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build (localhost:4173)
npm run preview
```

### Backend
```bash
cd backend

# Watch mode (Nodemon)
npm run dev

# Production start
npm start
```

---

## 🔧 Environment Configuration

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (`.env`)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/designhub
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📊 API Endpoints Summary

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login & get token
- `GET /api/auth/me` — Current user (protected)
- `PUT /api/auth/password` — Update password (protected)

### Designs
- `GET /api/designs` — List all designs
- `GET /api/designs/:id` — Get design detail
- `POST /api/designs` — Create design (protected)
- `PUT /api/designs/:id` — Update design (protected)
- `DELETE /api/designs/:id` — Delete design (protected)
- `POST /api/designs/:id/like` — Like design (protected)
- `POST /api/designs/:id/save` — Save design (protected)

### Comments
- `GET /api/designs/:designId/comments` — List comments
- `POST /api/designs/:designId/comments` — Add comment (protected)
- `PUT /api/comments/:id` — Edit comment (protected)
- `DELETE /api/comments/:id` — Delete comment (protected)

### Upload
- `POST /api/upload/image` — Upload single image (protected)
- `POST /api/upload/multiple` — Upload multiple images (protected)
- `DELETE /api/upload/image/:publicId` — Delete image (protected)

### Health
- `GET /api/health` — Server health check

---

## 🚀 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Deploy Backend (e.g., Render, Heroku, AWS)
```bash
cd backend
npm install --production
npm start
```

**Environment Variables to Set:**
- `NODE_ENV=production`
- `PORT=5000` (or your provider's port)
- `MONGO_URI=mongodb+srv://...` (Atlas or other hosted DB)
- `JWT_SECRET=long_random_string` (generate with `openssl rand -base64 32`)
- `CLOUDINARY_*` keys

**Static File Serving:**
The backend automatically serves `frontend/dist` when it exists, enabling single-origin deployment.

---

## 📝 Architecture Highlights

- **Monorepo Structure** — Frontend and backend in one project for easy deployment
- **Type Safety** — TypeScript on frontend and backend
- **Separation of Concerns** — Controllers, models, routes clearly separated
- **Custom Hooks** — Reusable logic (useAuth, useFetch, useForm validation)
- **Context API** — Global state for auth & notifications
- **Error Boundaries** — Graceful error handling & recovery
- **Rate Limiting** — Prevents abuse without sacrificing UX
- **Optimistic Updates** — Fast UI feedback before server confirmation

---

## 🔐 Security Considerations

✅ **Passwords:** Hashed with bcrypt (10 rounds)
✅ **Tokens:** JWT, can be refreshed (7-day expiry)
✅ **Validation:** All inputs validated on backend
✅ **Sanitization:** NoSQL injection & XSS prevention
✅ **CORS:** Whitelisted origins only
✅ **Rate Limiting:** Prevents brute-force attacks
✅ **HTTPS Ready:** Helmet middleware configured

⚠️ **Future Improvements:**
- Refresh token rotation
- Email verification
- Password reset flow
- Two-factor authentication

---

## 📚 Additional Documentation

See `ARCHITECTURE.md` for:
- Detailed ER diagrams & entity relationships
- Request/response examples for all API endpoints
- Middleware explanation & flow
- Security best practices & attack prevention

---

## 🎯 Next Steps (Optional Enhancements)

- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add integration tests (Supertest)
- [ ] Run Lighthouse audit (performance, accessibility)
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Tighten TypeScript strict mode
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement email notifications
- [ ] Add analytics & monitoring

---

## 🤝 Support

All core features are working and tested. For issues:
1. Check backend logs: `npm run dev` in backend directory
2. Check frontend console: F12 in browser
3. Verify `.env` files have all required variables
4. Ensure MongoDB is running: `mongod` or MongoDB Atlas connection

---

## 📄 License

MIT — Feel free to use this as a template for your projects.

---

**Built with ❤️ — Full-stack MERN portfolio platform**
