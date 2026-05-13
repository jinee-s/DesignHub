# 🎨 DesignHub Backend API

Backend server for DesignHub - A Dribbble-inspired design showcase platform.

## 🚀 Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + bcrypt
- **Image Storage**: Cloudinary
- **Environment**: dotenv

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── db.js        # MongoDB connection
│   ├── controllers/     # Route controllers (business logic)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   │   └── errorHandler.js
│   └── utils/           # Helper functions
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies and scripts
└── server.js            # Entry point
```

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/designhub
JWT_SECRET=your_random_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 3. Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 4. Test API Health

Open browser or use curl:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "DesignHub API is running! 🚀",
  "environment": "development",
  "timestamp": "2026-02-10T10:30:00.000Z"
}
```

## 📡 API Endpoints (Coming Soon)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Designs
- `GET /api/designs` - Get all designs
- `GET /api/designs/:id` - Get single design
- `POST /api/designs` - Create design (auth required)
- `PUT /api/designs/:id` - Update design (auth required)
- `DELETE /api/designs/:id` - Delete design (auth required)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile (auth required)

## 🛠️ Development Workflow

1. **Add a new feature:**
   - Create model in `src/models/`
   - Create controller in `src/controllers/`
   - Create routes in `src/routes/`
   - Import routes in `server.js`

2. **Test API:**
   - Use Postman or Thunder Client
   - Check logs in terminal
   - Verify MongoDB data with MongoDB Compass

3. **Debug errors:**
   - Check terminal for error messages
   - Review error stack trace (shown in development mode)
   - Use `console.log()` in controllers

## 🔒 Security Best Practices

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens for stateless authentication
- ✅ CORS configured for frontend origin
- ✅ Environment variables for sensitive data
- ✅ Input validation with Mongoose schemas
- ✅ Global error handling

## 📦 Dependencies Explained

| Package | Purpose | Why? |
|---------|---------|------|
| `express` | Web framework | Industry standard, minimal, flexible |
| `mongoose` | MongoDB ODM | Schema validation, easy queries |
| `dotenv` | Load env variables | Keeps secrets out of code |
| `bcryptjs` | Password hashing | Secure password storage |
| `jsonwebtoken` | JWT generation | Stateless authentication |
| `cors` | Cross-origin requests | Allow frontend to call API |
| `express-async-handler` | Async error handling | No try-catch needed |
| `multer` | File upload | Handle multipart/form-data |
| `cloudinary` | Image hosting | CDN for images |
| `validator` | Input validation | Email, URL validation |
| `colors` | Terminal colors | Better console logs |
| `nodemon` | Auto-restart server | Faster development |

## 🐛 Common Issues & Solutions

### Issue: Cannot connect to MongoDB
**Solution:** 
- Check if MongoDB is running: `mongod --version`
- Verify `MONGO_URI` in `.env` file
- For Atlas, check network access whitelist

### Issue: Port 5000 already in use
**Solution:** 
- Change `PORT` in `.env` to 5001
- Or kill process: `npx kill-port 5000`

### Issue: Module not found errors
**Solution:** 
- Run `npm install`
- Check file extensions (must use `.js` in imports)
- Verify `"type": "module"` in package.json

## 📚 Learning Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [REST API Best Practices](https://restfulapi.net/)

## 🚀 Next Steps

- [ ] Create User model
- [ ] Build authentication routes
- [ ] Test with Postman
- [ ] Create Design model
- [ ] Integrate Cloudinary
- [ ] Build design CRUD routes

---

**Built with ❤️ for learning and portfolio purposes**
