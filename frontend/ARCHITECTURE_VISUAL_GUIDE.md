# Frontend Architecture Overview

Visual guide to how all architectural pieces work together in DesignHub.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE LAYER                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │  HomePage      │  │ ProfilePage    │  │ DesignDetailPage   │ │
│  │  LoginPage     │  │ UploadPage     │  │ RegisterPage       │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
│                                                                   │
│  Components:                                                      │
│  ├─ Button, Input, Card (Base UI)                              │
│  ├─ DesignCard, Header (Feature UI)                            │
│  └─ ErrorBoundary (Error Handling)                             │
└──────────────┬────────────────────────────────────┬─────────────┘
               │                                    │
    ┌──────────▼──────────┐           ┌────────────▼──────────┐
    │  STATE LAYER        │           │  ROUTING LAYER       │
    │                     │           │                      │
    │  Context API:       │           │  React Router:       │
    │  ├─ AuthContext     │           │  ├─ Path navigation  │
    │  └─ Notifications   │           │  ├─ Query params     │
    │                     │           │  └─ Route guards     │
    │  useState:          │           │                      │
    │  ├─ Form values     │           │  Router State:       │
    │  ├─ UI toggles      │           │  ├─ Search query     │
    │  └─ Modals open     │           │  ├─ Filters         │
    │                     │           │  └─ Page number      │
    │  Custom Hooks:      │           │                      │
    │  ├─ useDesigns      │           └──────────────────────┘
    │  ├─ useAuth         │
    │  └─ useInfiniteScroll           ProtectedRoute
    │                     │           (auth-guarded pages)
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────────────────────────────┐
    │  BUSINESS LOGIC LAYER                            │
    │                                                  │
    │  useDesigns Hook:                               │
    │  ├─ Fetch designs (pagination)                 │
    │  ├─ Like/Save (optimistic updates)             │
    │  └─ Error handling & rollback                  │
    │                                                  │
    │  useAuth Hook:                                 │
    │  ├─ Login/Register                             │
    │  ├─ Token management                           │
    │  └─ Session persistence                        │
    │                                                  │
    │  Validation Utilities:                         │
    │  ├─ Email validation                           │
    │  ├─ Password validation                        │
    │  └─ Field validators                           │
    │                                                  │
    └──────────┬──────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────┐
    │  API CLIENT LAYER                               │
    │                                                  │
    │  Axios Instance:                               │
    │  ├─ Base URL: http://localhost:5000            │
    │  ├─ Request interceptors (add token)           │
    │  └─ Response interceptors (handle 401)         │
    │                                                  │
    │  API Services:                                 │
    │  ├─ authAPI (login, register, logout)          │
    │  ├─ designsAPI (CRUD operations)               │
    │  ├─ commentsAPI (comment operations)           │
    │  ├─ uploadAPI (cloud upload)                   │
    │  └─ types.ts (centralized types)              │
    │                                                  │
    │  Error Handling:                               │
    │  ├─ 401: Auto-logout & redirect               │
    │  ├─ 429: Rate limit message                    │
    │  └─ 5xx: Retry logic                           │
    │                                                  │
    └──────────┬──────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────┐
    │  BACKEND SERVER                                 │
    │  (Node.js + Express + MongoDB)                 │
    │  Running on http://localhost:5000              │
    │                                                  │
    │  Endpoints:                                    │
    │  ├─ POST /auth/login                           │
    │  ├─ POST /auth/register                        │
    │  ├─ GET /designs                               │
    │  ├─ GET /designs/:id                           │
    │  ├─ POST /designs                              │
    │  ├─ PUT /designs/:id/like                      │
    │  ├─ PUT /designs/:id/save                      │
    │  └─ [more endpoints...]                        │
    │                                                  │
    └──────────────────────────────────────────────────┘
```

---

## Data Flow Example: Login

```
User Input
  │
  ├─ "Email & Password" in LoginPage form
  │
  └─► Component (LoginPage)
      ├─ Store in useState: { email, password }
      ├─ Validate frontend: email format, password length
      │
      └─► Call API
          ├─ authAPI.login(email, password)
          │
          └─► Axios Request
              ├─ POST http://localhost:5000/auth/login
              ├─ Headers: { "Content-Type": "application/json" }
              ├─ Body: { email, password }
              │
              └─► Backend
                  ├─ Validate backend: email exists, password matches
                  ├─ Hash password & compare
                  ├─ Generate JWT token
                  │
                  └─► Response
                      ├─ Status 200
                      ├─ Body: { token, user: { id, username, email } }
                      │
                      └─► Response Interceptor
                          ├─ Extract token
                          ├─ Extract user
                          │
                          └─► Update AuthContext
                              ├─ setUser(user)
                              ├─ setToken(token)
                              ├─ localStorage.setItem('token', token)
                              │
                              └─► Redirect to HomePage
                                  └─ User is now authenticated!
```

---

## Data Flow Example: Like a Design

```
User Click (Like Button)
  │
  ├─ On DesignCard component
  │
  └─► Optimistic Update (instant UI feedback)
      ├─ setDesign({ ...design, isLiked: !isLiked })
      ├─ Increment like count immediately
      └─ Heart icon fills red instantly ✅
  
  Parallel: Send to API
      ├─ PUT /designs/:id/like
      ├─ Headers: { Authorization: "Bearer {token}" }
      │
      └─► Backend
          ├─ Verify user authenticated (JWT check)
          ├─ Find design by ID
          ├─ Add/remove like from database
          │
          └─► Response
              ├─ Status 200
              ├─ Body: { design: { ...updated } }
              │
              └─► Frontend Response Handler
                  ├─ If success: Keep UI as-is (was already updated)
                  └─ If error: Revert UI
                      └─ setDesign({ ...design, isLiked: wasLiked })
                          └─ Heart unfills (rollback)
```

---

## Component Tree with State

```
App
├─ ErrorBoundary (catches all errors)
│
└─ BrowserRouter
   │
   └─ AuthProvider (auth state)
      ├─ user, token, isAuthenticated
      ├─ login(), logout()
      │
      ├─ NotificationProvider (notifications state)
      │  ├─ notifications[]
      │  ├─ addNotification()
      │  ├─ removeNotification()
      │  │
      │  └─ Routes
      │     │
      │     ├─ /login → LoginPage
      │     │  ├─ useState: email, password
      │     │  ├─ calls: useAuth().login()
      │     │  └─ shows: useNotification().addNotification()
      │     │
      │     ├─ /register → RegisterPage
      │     │  ├─ useState: username, email, password, confirmPassword
      │     │  ├─ calls: useAuth().register()
      │     │  └─ shows: useNotification()
      │     │
      │     ├─ / → MainLayout
      │     │  └─ Header
      │     │     ├─ uses: useAuth() (display user)
      │     │     └─ shows: NotificationDisplay (all toasts)
      │     │
      │     └─ Protected Routes
      │        │
      │        ├─ /designs/:id → DesignDetailPage
      │        │  ├─ useState: design, isLoading, error
      │        │  ├─ useEffect: fetch design by ID
      │        │  ├─ onClick like: toggleLike() → optimistic
      │        │  ├─ onClick save: toggleSave() → optimistic
      │        │  └─ ErrorBoundary: wraps detail view
      │        │
      │        ├─ / → HomePage
      │        │  ├─ Custom Hook: useDesigns()
      │        │  │  ├─ designs[]
      │        │  │  ├─ isLoading, error
      │        │  │  ├─ fetchDesigns(page)
      │        │  │  ├─ loadMore()
      │        │  │  ├─ toggleLike(id)
      │        │  │  └─ toggleSave(id)
      │        │  │
      │        │  ├─ Custom Hook: useInfiniteScroll()
      │        │  │  ├─ ref (attach to bottom)
      │        │  │  └─ onLoadMore callback
      │        │  │
      │        │  ├─ Renders:
      │        │  │  ├─ DesignCard (for each design)
      │        │  │  │  ├─ onLike callback
      │        │  │  │  └─ onSave callback
      │        │  │  │
      │        │  │  ├─ or Loading (skeleton)
      │        │  │  ├─ or Error (with retry)
      │        │  │  └─ or EmptyState
      │        │  │
      │        │  └─ <div ref={ref}> (infinite scroll trigger)
      │        │
      │        ├─ /upload → UploadPage
      │        │  ├─ useState: step (1 or 2)
      │        │  ├─ useState: image, title, description, category
      │        │  ├─ useState: validation errors
      │        │  │
      │        │  ├─ Step 1: Image upload
      │        │  │  ├─ Drag-drop zone
      │        │  │  ├─ File validation
      │        │  │  └─ setImage(file)
      │        │  │
      │        │  ├─ Step 2: Form
      │        │  │  ├─ Input: title
      │        │  │  ├─ Input: description
      │        │  │  ├─ Select: category
      │        │  │  └─ Button: Publish
      │        │  │
      │        │  ├─ On Submit:
      │        │  │  ├─ uploadAPI.image()
      │        │  │  ├─ designsAPI.create()
      │        │  │  ├─ addNotification()
      │        │  │  └─ navigate to detail
      │        │  │
      │        │  └─ ErrorBoundary: wraps form
      │        │
      │        └─ /profile → ProfilePage
      │           ├─ Gets user from: useAuth()
      │           │
      │           ├─ useState: activeTab ('designs'|'liked'|'saved')
      │           │
      │           ├─ Custom Hook: useDesigns() instance 1
      │           │  └─ Used when activeTab === 'designs'
      │           │
      │           ├─ Custom Hook: useDesigns() instance 2
      │           │  └─ Used when activeTab === 'liked'
      │           │
      │           ├─ Custom Hook: useDesigns() instance 3
      │           │  └─ Used when activeTab === 'saved'
      │           │
      │           ├─ Each tab renders:
      │           │  ├─ DesignCard grid
      │           │  ├─ Loading skeleton
      │           │  ├─ Error message
      │           │  └─ EmptyState
      │           │
      │           └─ Load More button (pagination)
```

---

## State Usage Pattern

```
State Decision Tree:

Is it needed by        ┌─ YES ─► Global Context
multiple components?   │         (AuthContext)
                       │
                       └─ NO ──┐
                               │
                        Is it  ┌─ YES ─► Router State
                        URL    │         (search?q=foo)
                        state? │
                               └─ NO ──┐
                                       │
                        Multiple ┌─ YES ─► useReducer
                        fields?  │         (complex form)
                                 │
                                 └─ NO ──► useState
                                           (simple state)
```

---

## Performance Optimization Points

```
1. Component Rendering
   ├─ React.memo for DesignCard
   ├─ useCallback for click handlers
   └─ useMemo for memoizing context value

2. Network Requests
   ├─ Batch requests (12 designs at once, not 12 requests)
   ├─ Deduplicate requests (check isLoading before fetching)
   ├─ Lazy load images (browser-native)
   └─ Cache in Cloudinary (browser cache headers)

3. Bundle Size
   ├─ Tree-shaking unused CSS (Tailwind)
   ├─ Code splitting pages (lazy routes)
   ├─ Minimize vendor libraries
   └─ Gzip compression

4. State Management
   ├─ Keep Context minimal (only global state)
   ├─ Use local useState for UI toggles
   ├─ Don't recreate context value every render
   └─ Split contexts (auth, notifications, ...not one mega-context)

5. Rendering
   ├─ Infinite scroll with Intersection Observer
   ├─ Skeleton loading (not spinners)
   ├─ Optimistic updates (not loading spinners)
   └─ Progressive enhancement
```

---

## Error Handling Flow

```
Browser
│
├─► React Error (JSX render crash)
│   │
│   └─► ErrorBoundary catches
│       ├─ Show fallback UI
│       ├─ Log to Sentry (future)
│       └─ "Try Again" button
│
├─► Event Handler Error (onClick)
│   │
│   └─► try-catch wraps
│       ├─ Show notification
│       └─ handleError()
│
├─► Async Error (Promise rejection)
│   │
│   └─► catch() in useEffect
│       ├─ Set error state
│       ├─ Show notification
│       └─ Show Error component
│
└─► Network Error (API call fails)
    │
    └─► Response Interceptor
        ├─ If 401: logout & redirect to /login
        ├─ If 429: show rate limit notification
        ├─ If 5xx: show error notification
        └─ If other: show generic error
```

---

## Request Flow with Interceptors

```
Component
  │
  └─► Call API: designsAPI.getAll()
      │
      └─► Axios Request Interceptor
          ├─ Add Authorization header
          │  └─ Authorization: "Bearer {token from localStorage}"
          │
          ├─ Add Content-Type
          │
          └─► HTTP Request
              └─► Backend
                  ├─ Verify JWT signature
                  ├─ Check token expiration
                  ├─ Query MongoDB
                  │
                  └─► HTTP Response
                      ├─ Status: 200
                      ├─ Body: { designs: [...] }
                      │
                      └─► Axios Response Interceptor
                          ├─ Check status
                          │
                          ├─ If success:
                          │  └─ Return response.data
                          │
                          ├─ If 401:
                          │  ├─ Clear token
                          │  ├─ Logout user
                          │  └─ Redirect to /login
                          │
                          └─ Component gets data ✅
```

---

## Adding New Feature: Checklist

When adding a new feature, follow this checklist:

### 1. Plan State
```
[ ] What state does this feature need?
[ ] Is state shared (global) or local?
[ ] Will it need validation?
[ ] How long does it persist?
```

### 2. Choose Storage
```
[ ] useState (component local)?
[ ] Context API (global)?
[ ] Router/URL (shareable)?
[ ] localStorage (persistent)?
```

### 3. Handle Errors
```
[ ] Wrap in ErrorBoundary?
[ ] Add try-catch for async?
[ ] Show user-friendly errors?
[ ] Log to error tracking?
```

### 4. Validate Input
```
[ ] Frontend validation (UX)?
[ ] Backend validation (security)?
[ ] Type checking (TypeScript)?
[ ] Test edge cases?
```

### 5. Optimize Performance
```
[ ] Prevent unnecessary re-renders?
[ ] Batch API requests?
[ ] Use React.memo if needed?
[ ] Lazy load if heavy?
```

### 6. Test
```
[ ] Unit test logic?
[ ] Integration test with API?
[ ] Manual browser test?
[ ] Mobile responsive?
```

---

## Scaling Decision Tree

```
How many monthly active users?

< 10k        │ Current architecture is fine
             │ Continue with Context API + useState
             │
10k - 100k   │ Consider optimizing:
             │ ├─ Code splitting
             │ ├─ Image optimization
             │ └─ SEO improvements
             │
100k - 1M    │ Start planning upgrade:
             │ ├─ Add React Query
             │ ├─ Add Zustand
             │ └─ Implement caching
             │
> 1M         │ Implement enterprise:
             │ ├─ Redux + middleware
             │ ├─ GraphQL API
             │ ├─ Service workers
             │ ├─ CDN distribution
             │ └─ Multiple servers
```

---

## Summary

### Architecture Principles:
1. **Layered** - UI → State → Logic → API → Backend
2. **Isolated** - Each layer has one responsibility
3. **Testable** - Can test each layer independently
4. **Scalable** - Adding features doesn't break existing ones
5. **Performant** - Optimizations at each layer

### State Management:
- Global: Context API (auth, notifications)
- Local: useState (form values, UI toggles)
- URL: Router (search, filters)
- Server: Custom hooks (designs, pagination)

### Error Handling:
- React errors → ErrorBoundary
- Async errors → try-catch + notification
- Network errors → Response interceptors
- User input → Validation + error messages

### Performance:
- Bundle: Tree-shake CSS, code splitting
- Rendering: React.memo, useCallback, useMemo
- Network: Batching, deduplication, caching
- State: Keep Context minimal, split concerns

