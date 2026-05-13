# Frontend Integration Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Import Postman Collection
1. Open Postman
2. Click **Import** → Choose file → Select `DesignHub_API.postman_collection.json`
3. Create Environment:
   - Click **Environments** → **Create Environment**
   - Name: `DesignHub Local`
   - Add variable: `base_url` = `http://localhost:5000/api`
4. Select environment from dropdown

### Step 2: Test Backend
1. In Postman, select **Health Check** → **Check API Health**
2. Click **Send**
3. ✅ If you see `"success": true`, backend is running!

### Step 3: Get Your Token
1. Select **Authentication** → **Register New User**
2. Edit username/email in body (or use defaults)
3. Click **Send**
4. ✅ Token is auto-saved to `{{token}}` variable
5. All protected routes now work!

### Step 4: Test Creating Design
1. First upload image: **Upload** → **Upload Image**
   - Select image file in Body tab
   - Click **Send**
   - Copy `imageUrl`, `thumbnailUrl`, `cloudinaryId`
2. Create design: **Designs** → **Create Design**
   - Paste URLs into request body
   - Click **Send**
   - Design ID auto-saved to `{{design_id}}`

### Step 5: Test Interactions
- **Designs** → **Like/Unlike Design** → Send (toggles like)
- **Comments** → **Add Comment** → Send (adds comment)
- Get comments: **Comments** → **Get Comments for Design**

---

## 💻 Frontend Code Examples

### React + Fetch

#### Setup API Client
```javascript
// src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
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

  // Designs
  static getDesigns(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/designs?${query}`);
  }

  static createDesign(designData) {
    return this.request('/designs', {
      method: 'POST',
      body: JSON.stringify(designData),
    });
  }

  static likeDesign(id) {
    return this.request(`/designs/${id}/like`, { method: 'POST' });
  }

  // Upload
  static async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    return response.json();
  }
}

export default APIClient;
```

#### Login Component
```jsx
// src/components/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import APIClient from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await APIClient.login({ email, password });
      
      // Save token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

#### Designs List Component
```jsx
// src/components/DesignsList.jsx
import { useState, useEffect } from 'react';
import APIClient from '../utils/api';

export default function DesignsList() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchDesigns();
  }, [page]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const data = await APIClient.getDesigns({ page, limit: 20 });
      setDesigns(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (designId) => {
    try {
      const data = await APIClient.likeDesign(designId);
      
      // Update local state
      setDesigns(prev => prev.map(design => 
        design._id === designId 
          ? { ...design, likes: data.data.likesCount, isLiked: data.data.liked }
          : design
      ));
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="designs-grid">
      {designs.map(design => (
        <div key={design._id} className="design-card">
          <img src={design.thumbnailUrl} alt={design.title} />
          <h3>{design.title}</h3>
          <p>{design.description}</p>
          
          <div className="design-actions">
            <button onClick={() => handleLike(design._id)}>
              {design.isLiked ? '❤️' : '🤍'} {design.likes}
            </button>
            <span>👁️ {design.views}</span>
            <span>💬 {design.commentCount}</span>
          </div>
          
          <div className="design-author">
            <img src={design.user.avatar} alt={design.user.username} />
            <span>{design.user.username}</span>
          </div>
        </div>
      ))}
      
      <div className="pagination">
        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
```

#### Image Upload Component
```jsx
// src/components/UploadDesign.jsx
import { useState } from 'react';
import APIClient from '../utils/api';

export default function UploadDesign() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI/UX');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);

    try {
      // Step 1: Upload image
      const uploadData = await APIClient.uploadImage(file);
      
      // Step 2: Create design
      const designData = {
        title,
        description,
        imageUrl: uploadData.data.imageUrl,
        thumbnailUrl: uploadData.data.thumbnailUrl,
        cloudinaryId: uploadData.data.cloudinaryId,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      
      await APIClient.createDesign(designData);
      
      alert('Design uploaded successfully!');
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setTags('');
      setPreview('');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Upload Design</h2>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        required
      />
      
      {preview && <img src={preview} alt="Preview" style={{ maxWidth: 300 }} />}
      
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
      />
      
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option>UI/UX</option>
        <option>Web Design</option>
        <option>Mobile Design</option>
        <option>Graphic Design</option>
      </select>
      
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Design'}
      </button>
    </form>
  );
}
```

---

### React + Axios (Alternative)

#### Install Axios
```bash
npm install axios
```

#### Setup API Client (Axios)
```javascript
// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

export const designsAPI = {
  getAll: (params) => api.get('/designs', { params }),
  getOne: (id) => api.get(`/designs/${id}`),
  create: (designData) => api.post('/designs', designData),
  update: (id, designData) => api.put(`/designs/${id}`, designData),
  delete: (id) => api.delete(`/designs/${id}`),
  like: (id) => api.post(`/designs/${id}/like`),
  save: (id) => api.post(`/designs/${id}/save`),
};

export const commentsAPI = {
  getAll: (designId) => api.get(`/designs/${designId}/comments`),
  create: (designId, commentData) => api.post(`/designs/${designId}/comments`, commentData),
  update: (id, content) => api.put(`/comments/${id}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
  like: (id) => api.post(`/comments/${id}/like`),
};

export const uploadAPI = {
  image: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
```

#### Usage with Axios
```jsx
import { designsAPI } from '../utils/api';

const DesignsList = () => {
  const [designs, setDesigns] = useState([]);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const data = await designsAPI.getAll({ page: 1, limit: 20 });
        setDesigns(data.data);
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchDesigns();
  }, []);

  // ... rest of component
};
```

---

## 🔐 Authentication State Management

### React Context
```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(data => setUser(data.data))
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Protected Routes
```jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// App.jsx usage
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

## ⚠️ Common Pitfalls & Solutions

### ❌ Problem: CORS Error
**Error:** `Access to fetch at 'http://localhost:5000' blocked by CORS`
**Solution:** Backend already has CORS enabled. Make sure you're using correct BASE_URL.

### ❌ Problem: Token not sent
**Error:** `401 Unauthorized` on protected routes
**Solution:** Check Authorization header format:
```javascript
headers: {
  'Authorization': `Bearer ${token}` // Note the space after Bearer
}
```

### ❌ Problem: FormData upload not working
**Error:** `400 Bad Request` on image upload
**Solution:** Don't set Content-Type header for FormData:
```javascript
// ❌ Wrong
fetch('/api/upload/image', {
  headers: { 'Content-Type': 'multipart/form-data' }, // Don't do this!
  body: formData
})

// ✅ Correct
fetch('/api/upload/image', {
  // No Content-Type header - browser sets it automatically
  body: formData
})
```

### ❌ Problem: Rate limit errors
**Error:** `429 Too Many Requests`
**Solution:** Check headers and implement backoff:
```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Wait ${retryAfter} seconds before retry`);
}
```

### ❌ Problem: Invalid MongoDB ID
**Error:** `400 Invalid MongoDB ID format`
**Solution:** Validate ID before making request:
```javascript
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

if (!isValidObjectId(designId)) {
  console.error('Invalid ID');
  return;
}
```

---

## 🎯 Next Steps

1. ✅ Import Postman collection and test API
2. ✅ Copy API client code to your frontend
3. ✅ Implement login/register pages
4. ✅ Create designs list component
5. ✅ Add design upload functionality
6. ✅ Implement like/save interactions
7. ✅ Add comments section
8. ✅ Handle errors and loading states
9. ✅ Add protected routes
10. ✅ Test rate limiting behavior

---

## 📚 Resources

- **API Documentation:** `API_DOCUMENTATION.md`
- **Sample Responses:** `SAMPLE_API_RESPONSES.md`
- **Postman Collection:** `DesignHub_API.postman_collection.json`
- **Production Guide:** `PRODUCTION_IMPROVEMENTS.md`

---

**Questions?** Check the documentation or contact the backend team! 🚀
