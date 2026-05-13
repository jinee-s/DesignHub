# State Management & Architecture Summary

This document ties together all architectural decisions and explains when/why to use each pattern.

---

## Quick Reference: Choose Your Pattern

```
Need to store...          → Use this...              → Why
─────────────────────────────────────────────────────────────
User authentication       Context API               Persistent, global
Notifications/Toasts      Context API               Simple list, global
User preferences/theme    Context API + localStorage Persist across sessions
Design feed data          Custom hook (useDesigns)  Page-specific, cached
Form values               useState (local)          Single-component
Dropdown open/closed      useState (local)          Single-component
Search/filter state       URL (router state)        Bookmarkable, shareable

Large app (1M+ users):
All global state          Zustand/Redux            DevTools, dev experience
Complex async flows       TanStack Query            Automatic caching, sync
```

---

## Architecture Layers

```
┌────────────────────────────────────────────────────┐
│  User Interface Layer                              │
│  (React Components - HomePage, ProfilePage, etc.)  │
└──────────────────┬─────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────┐
│  State Management Layer                            │
│  Context API (Auth, Notifications)                 │
│  useState hooks (Form values, UI toggles)          │
│  Router state (Search, filters)                    │
└──────────────────┬─────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────┐
│  Business Logic Layer                              │
│  Custom hooks (useDesigns, useAuth, useFetch)      │
│  Service functions (designService, authService)    │
│  Validation utilities                              │
└──────────────────┬─────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────┐
│  API Client Layer                                  │
│  Axios instance with interceptors                  │
│  Request/response transformation                   │
│  Error handling                                    │
└──────────────────┬─────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────┐
│  Backend Services                                  │
│  Node.js/Express APIs                              │
│  MongoDB database                                  │
│  Authentication (JWT)                              │
└────────────────────────────────────────────────────┘
```

---

## Context API (Global State)

### When to Use
✅ Multiple components need same data
✅ Data is shared across pages
✅ Data persists (user doesn't expect it to reset)
✅ Not updating frequently (< 10x per second)
✅ Team size < 10 people

### When NOT to Use
❌ Form field values (use useState)
❌ Animation state (updates too frequently)
❌ Deeply nested data (hard to update)
❌ Team > 10 people OR 1M+ users (use Zustand/Redux)

### Current Implementation

```typescript
// src/context/AuthContext.tsx
export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout } = useContext(AuthContext);
  // Returns global auth state + methods
};

// Usage in any component:
const MyComponent = () => {
  const { user } = useAuth();
  return <p>{user?.username}</p>;
};
```

### Performance Optimization

```typescript
// Problem: Every component re-renders when context changes
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Creates new object every render!
  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Solution: Memoize the value
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token] // Only recreate when these change
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

## useState (Local Component State)

### When to Use
✅ Only one component needs the data
✅ Data resets when component unmounts
✅ User doesn't care if it's forgotten
✅ Simple state (string, boolean, number)

### Examples

```typescript
// ✅ Good: Form field local state
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Only LoginForm cares about these values
};

// ✅ Good: UI toggles
const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Only Menu cares if it's open/closed
};

// ✅ Good: Temporary search input
const SearchPage = () => {
  const [searchInput, setSearchInput] = useState('');
  // Temporary, resets on unmount
};

// ❌ Bad: Auth state as local state
const Header = () => {
  const [user, setUser] = useState(null);
  // Multiple components need this, should be global!
};

// ❌ Bad: Theme as local state
const App = () => {
  const [theme, setTheme] = useState('light');
  // All components need this, should be global/context!
};
```

---

## useReducer (Complex Local State)

Use when you have multiple related pieces of state that update together.

```typescript
// Problem: Too many useState calls
const Form = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Getting messy!
};

// Solution: useReducer
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD_VALUE':
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    default:
      return state;
  }
};

const Form = () => {
  const [form, dispatch] = useReducer(formReducer, initialState);

  const handleFieldChange = (field, value) => {
    dispatch({ type: 'SET_FIELD_VALUE', field, value });
  };
  // Much cleaner!
};
```

---

## Custom Hooks (Encapsulate Logic)

Business logic that multiple components might use.

### Examples in DesignHub

**1. useDesigns**
```typescript
// Problem: Every page that shows designs has pagination logic
const HomePage = () => {
  const [designs, setDesigns] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  // Duplicated in ProfilePage, SearchPage, etc.
};

// Solution: Custom hook
const useDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [page, setPage] = useState(1);
  // ... all pagination logic

  return { designs, page, loadMore, toggleLike };
};

// Now used everywhere:
const HomePage = () => {
  const { designs, loadMore } = useDesigns();
};

const ProfilePage = () => {
  const { designs, loadMore } = useDesigns();
};
```

**2. useAuth**
```typescript
// Instead of calling useContext directly
const MyComponent = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('...');
  // Tedious
};

// Use the hook:
const MyComponent = () => {
  const { user, login } = useAuth();
  // Clean!
};
```

**3. useFetch (Hypothetical)**
```typescript
// Custom hook for API calls with loading/error states
const useFetch = <T,>(url: string): { data: T | null; isLoading: boolean; error: Error | null } => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(url);
        setData(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, isLoading, error };
};

// Usage:
const HomePage = () => {
  const { data: designs, isLoading } = useFetch('/api/designs');
};
```

---

## Form Validation (3-Layer Strategy)

### Layer 1: HTML5 Native Validation
```typescript
// Browser handles before JS
<input
  type="email"               // Browser validates format
  required                   // Browser prevents empty
  minLength={3}              // Browser prevents too short
  maxLength={50}             // Browser prevents too long
/>
```

### Layer 2: Frontend Validation (UX)
```typescript
// Real-time feedback as user types
const Register = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);

    // Validate immediately
    if (!newEmail.includes('@')) {
      setError('Invalid email');
    } else {
      setError('');
    }
  };

  return (
    <>
      <input value={email} onChange={(e) => handleEmailChange(e.target.value)} />
      {error && <span className="text-red-600">{error}</span>}
    </>
  );
};
```

### Layer 3: Backend Validation (Security)
```typescript
// Always validate on server too!
app.post('/auth/register', (req, res) => {
  const { email, password } = req.body;

  // Server-side validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // Check if email already exists (can't do on client!)
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Create user
  // ...
});
```

**Why 3 layers?**
- HTML5: Browser prevents obvious mistakes
- Frontend: Instant feedback (good UX)
- Backend: Can't be bypassed (security)

---

## Error Boundaries

Catch React errors and show fallback UI.

```typescript
// Without error boundary:
User clicks → Component throws error → Whole app crashes ❌

// With error boundary:
User clicks → Component throws error → Show fallback UI ✅

// Implementation:
<ErrorBoundary fallback={(error) => <h1>Oops: {error.message}</h1>}>
  <YourComponent />
</ErrorBoundary>

// Or wrap entire app:
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Errors caught:**
✅ Render errors (JSX syntax)
✅ Lifecycle method errors
✅ Component constructor errors

**Errors NOT caught:**
❌ Event handlers (use try-catch)
❌ Async code (use try-catch)
❌ Server rendering
❌ Errors in the boundary itself

---

## Scaling Strategy

### Phase 1: MVP (< 100k users)
```
Architecture:
├─ Context API (auth, notifications)
├─ useState for local state
├─ Custom hooks (useDesigns)
├─ Simple file structure

Tools:
├─ React Router (pages)
├─ Axios (API calls)
├─ Tailwind CSS (styles)
└─ localStorage (persistence)

This can handle ~500k concurrent users
```

### Phase 2: Growth (100k - 1M users)
```
Add:
├─ Zustand (global state management)
├─ React Query (server state caching)
├─ Code splitting (lazy loading pages)
├─ Service worker (offline support)
├─ Sentry (error tracking)

Why:
- Context API gets complex (50+ global values)
- Need automatic caching (React Query)
- Loading times matter (code splitting)
- Need analytics (Sentry)
```

### Phase 3: Scale (> 1M users)
```
Add:
├─ Redux with middleware
├─ GraphQL (instead of REST)
├─ Web Workers (background processing)
├─ Redis (caching layer)
├─ CDN (global distribution)
└─ Analytics pipeline

Why:
- Redux middleware for logging/analytics
- GraphQL for precise data fetching
- Web Workers for heavy computations
- Redis for session management
- CDN for fast delivery
```

---

## File Organization

### Current Structure (Good for 500k users)
```
src/
├─ api/          (API calls)
├─ components/   (React components)
├─ context/      (Context API)
├─ hooks/        (Custom hooks)
├─ pages/        (Page components)
├─ App.tsx       (Main app)
└─ main.tsx      (Entry)
```

### Recommended (For 1M+ users)
```
src/
├─ api/
│  ├─ endpoints/  (Grouped by domain)
│  ├─ client.ts
│  └─ types.ts
├─ components/
│  ├─ ui/        (Button, Input, Card)
│  ├─ common/    (Header, Layout)
│  ├─ features/  (Design, Profile, Auth)
│  └─ errors/    (ErrorBoundary)
├─ store/        (Zustand stores)
│  ├─ auth.ts
│  ├─ ui.ts
│  └─ designs.ts
├─ hooks/
│  ├─ useAuth.ts
│  ├─ useDesigns.ts
│  └─ useFetch.ts
├─ pages/
│  ├─ Home/
│  ├─ Auth/
│  ├─ Design/
│  └─ Profile/
├─ services/     (Business logic)
│  ├─ design-service.ts
│  └─ auth-service.ts
├─ types/        (TypeScript types)
├─ utils/        (Helpers)
├─ App.tsx
└─ main.tsx
```

---

## Decision Checklist

When building a feature, ask:

### 1. State Scope
```
[ ] Is multiple components using this data? 
    YES → Global (Context/Zustand)
    NO  → Local state
```

### 2. State Lifetime
```
[ ] Should it persist across page navigation?
    YES → Global
    NO  → Local
```

### 3. State Complexity
```
[ ] Multiple related pieces (form with many fields)?
    YES → useReducer
    NO  → useState
```

### 4. Validation Needed
```
[ ] Can it be done on client only?
    YES → Frontend validation enough
    NO  → Add backend validation too
```

### 5. Error Handling
```
[ ] Can component throw errors?
    YES → Wrap in ErrorBoundary
    NO  → Use try-catch in event handlers
```

---

## Common Mistakes & Fixes

### Mistake 1: All State in Global Context
```typescript
// ❌ BAD: Context has everything
const AppProvider = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [theme, setTheme] = useState('light');
  const [designs, setDesigns] = useState([]);
  // Too much, too many re-renders!
};

// ✅ GOOD: Only truly global state
const AuthProvider = () => {
  const [user, setUser] = useState(null);
  // Just auth
};

const NotificationProvider = () => {
  const [notifications, setNotifications] = useState([]);
  // Just notifications
};

// Form values stay local
const Form = () => {
  const [formValues, setFormValues] = useState({});
};
```

### Mistake 2: Not Memoizing Context Value
```typescript
// ❌ BAD: Creates new context value every render
const Provider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// ✅ GOOD: Memoize context value
const Provider = ({ children }) => {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
```

### Mistake 3: Validating Only on Frontend
```typescript
// ❌ BAD: Only frontend validation
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.create({ email, password });
  // Anyone can bypass frontend validation and send any data!
});

// ✅ GOOD: Validate on backend too
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  // Validate server-side
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // Check server-specific constraints
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: 'Email exists' });
  }

  const user = await User.create({ email, password: hashPassword(password) });
  res.json(user);
});
```

### Mistake 4: Not Using Error Boundaries
```typescript
// ❌ BAD: One error crashes entire app
<App />

// ✅ GOOD: Catch errors gracefully
<ErrorBoundary>
  <App />
</ErrorBoundary>

// ✅ EVEN BETTER: Multiple boundaries per page
<ErrorBoundary>
  <Header />
</ErrorBoundary>

<ErrorBoundary>
  <MainContent />
</ErrorBoundary>

<ErrorBoundary>
  <Sidebar />
</ErrorBoundary>
```

---

## Recommended Tools

### For Current Scale (< 1M users)
```
Core:
├─ React: Components
├─ React Router: Navigation
└─ TypeScript: Type safety

State:
├─ Context API: Global state
└─ useState: Local state

Server:
├─ Axios: HTTP client
└─ localStorage: Persistence

UI:
├─ Tailwind CSS: Styling
└─ React component library (optional)

Dev Tools:
├─ Vite: Build tool
├─ TypeScript: Type checking
└─ Vitest: Unit testing
```

### For Large Scale (> 1M users)
```
Add to above:
├─ Zustand: State management
├─ React Query: Server state caching
├─ Redux: Complex state (with middleware)
├─ GraphQL: Precise data fetching
├─ Sentry: Error tracking
├─ Segment: Analytics
└─ Playwright: E2E testing
```

---

## Summary

### Key Principles
1. **Local State First** - Only promote to global if multiple components need it
2. **Three Layers of Validation** - HTML5 → Frontend → Backend
3. **Error Boundaries** - Catch component errors gracefully
4. **Memoization** - Optimize re-renders with useMemo/useCallback
5. **Separation of Concerns** - Each layer has one job

### When to Use What
```
Need type-safe data?      → TypeScript + Context types
Need to share state?      → Context API or Zustand
Need form validation?     → 3-layer validation
Need offline support?     → Service Worker
Need error handling?      → Error Boundaries + try-catch
Need persistence?         → localStorage
Need caching?             → React Query
Need analytics?           → Segment/Sentry
```

### Avoid
❌ Props drilling too deep (use context)
❌ Storing passwords in localStorage (use httpOnly cookies)
❌ Validating only on frontend (always validate backend)
❌ Global state for everything (use local state first)
❌ Ignoring error boundaries (they catch real errors)
