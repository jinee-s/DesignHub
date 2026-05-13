# Frontend Architecture Guide

## Overview

This document explains the architecture patterns, state management decisions, and scaling strategies for the DesignHub frontend.

---

## Table of Contents

1. [State Management Strategy](#state-management-strategy)
2. [Global State (Context API)](#global-state-context-api)
3. [Local State Patterns](#local-state-patterns)
4. [Reusable Components](#reusable-components)
5. [Form Validation](#form-validation)
6. [Error Boundaries](#error-boundaries)
7. [Scaling to Large Products](#scaling-to-large-products)
8. [File Structure](#file-structure)

---

## State Management Strategy

### **Mental Model: Where Does State Live?**

```
┌────────────────────────────────────────────────────┐
│            STATE MANAGEMENT PYRAMID                │
├────────────────────────────────────────────────────┤
│                                                    │
│  GLOBAL (Context API)                             │
│  ├─ Authentication (user, token)                  │
│  ├─ Theme (dark/light mode)                       │
│  └─ Notifications (toast messages)                │
│                                                    │
│  PAGE-LEVEL (useState in page component)          │
│  ├─ Current tab (profile page)                    │
│  ├─ Sort order (designs grid)                     │
│  └─ Search query (search page)                    │
│                                                    │
│  COMPONENT-LEVEL (useState in component)          │
│  ├─ Form input values                             │
│  ├─ Dropdown open/closed                          │
│  └─ Loading spinner on/off                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

### **Decision Tree: Which State Type?**

```
Question 1: Needed by many components?
├─ YES → Global State (Context)
│   Examples: user, token, theme
│
└─ NO → Go to Question 2

Question 2: Affects multiple pages?
├─ YES → URL/Router State
│   Examples: current page, filters, search query
│
└─ NO → Go to Question 3

Question 3: Just for one component?
├─ YES → Local State (useState)
│   Examples: form value, dropdown open, tooltip
│
└─ (Never reached)
```

### **Example Applications**

| State | Type | Example | Why |
|-------|------|---------|-----|
| `user` | Global | `{ id, email, username }` | Needed by Header, ProfilePage, UploadPage |
| `token` | Global | JWT string from localStorage | Needed by API client interceptor |
| `theme` | Global | `'light' \| 'dark'` | Applies to entire page |
| `activeTab` | Page-Level | `'designs' \| 'liked' \| 'saved'` | Only ProfilePage cares |
| `searchQuery` | URL State | `/search?q=ui` | Shareable, bookmarkable |
| `formValue` | Component-Level | Form input text | Only LoginForm cares |
| `isDropdownOpen` | Component-Local | Boolean | Only Dropdown cares |

---

## Global State (Context API)

### **1. When to Use Context (Global State)**

✅ **Use Context when:**
- Multiple components need the same data
- Data persists across page navigation
- Data changes rarely (not every millisecond)
- Users expect it to be consistent

❌ **Don't use for:**
- Form values (use local useState)
- Animations (too frequent updates)
- Large frequently-changing lists

### **2. Current Implementation: AuthContext**

File: `src/context/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Easy hook for components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
```

**Usage:**

```typescript
const MyComponent = () => {
  const { user, login, logout } = useAuth();

  if (!user) return <LoginPrompt />;

  return (
    <div>
      <p>Welcome, {user.username}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### **3. Adding New Global State: Notifications**

**Why add it:**
- Toast messages (success/error) need to appear anywhere
- Multiple API calls may trigger notifications
- All notifications should use same styling

**Implementation:**

```typescript
// src/context/NotificationContext.tsx

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: NotificationType) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => removeNotification(id), 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used inside NotificationProvider');
  return context;
};
```

**Usage:**

```typescript
const UploadPage = () => {
  const { addNotification } = useNotification();

  const handleUpload = async () => {
    try {
      await uploadAPI.image(file);
      addNotification('Design uploaded successfully!', 'success');
    } catch (error) {
      addNotification('Upload failed. Try again.', 'error');
    }
  };

  return <button onClick={handleUpload}>Upload</button>;
};
```

### **4. Setting Up Multiple Providers**

File: `src/App.tsx`

```typescript
export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* All routes here have access to auth + notifications */}
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
```

**Pattern:**
```
AuthProvider (outer)
  ↓
NotificationProvider
  ↓
Routes (inner)
  ↓ Components can use both useAuth() and useNotification()
```

---

## Local State Patterns

### **1. Component-Level Local State**

Used for: Form values, UI visibility, single-component logic

```typescript
// ✅ GOOD: Local state for form
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit form
  };

  return (
    <>
      <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input value={password} type="password" onChange={(e) => setPassword(e.target.value)} />
      {errors.email && <Error message={errors.email} />}
      <Button onClick={handleSubmit}>Login</Button>
    </>
  );
};
```

### **2. Page-Level State**

Used for: Active tab, sorting, filtering on single page

```typescript
// ✅ Component state, but page-level
const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'designs' | 'liked' | 'saved'>('designs');

  return (
    <div>
      <Tabs
        tabs={[
          { id: 'designs', label: 'My Designs', onClick: () => setActiveTab('designs') },
          { id: 'liked', label: 'Liked', onClick: () => setActiveTab('liked') },
          { id: 'saved', label: 'Saved', onClick: () => setActiveTab('saved') },
        ]}
      />

      {activeTab === 'designs' && <DesignsTab />}
      {activeTab === 'liked' && <LikedTab />}
      {activeTab === 'saved' && <SavedTab />}
    </div>
  );
};
```

### **3. useCallback for Optimizing Re-renders**

```typescript
// ❌ BAD: Function recreated on every render
const Parent = () => {
  const handleClick = () => { /* ... */ };  // New function every render!
  return <Child onClick={handleClick} />;
};

// ✅ GOOD: Function cached with useCallback
import { useCallback } from 'react';

const Parent = () => {
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);  // Only recreate if dependencies change

  return <Child onClick={handleClick} />;
};
```

### **4. useReducer for Complex State**

When state has multiple related pieces:

```typescript
// ❌ Multiple useState calls
const Form = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Getting complicated!
};

// ✅ useReducer for form state
interface FormState {
  values: { email: string; password: string; confirmPassword: string };
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      };
    case 'SET_FIELD_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };
    case 'SET_TOUCHED':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    default:
      return state;
  }
};

const Form = () => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleFieldChange = (field: string, value: string) => {
    dispatch({ type: 'SET_FIELD_VALUE', field, value });
  };

  // Cleaner, more manageable
};
```

---

## Reusable Components

### **1. Component Composition Strategy**

```
Level 1: Base/Primitive Components
  ├─ Button
  ├─ Input
  └─ Card

Level 2: Feature Components
  ├─ LoginForm (uses Button + Input)
  ├─ DesignCard (uses Card + Button)
  └─ UploadDropZone

Level 3: Page Components
  ├─ HomePage (uses DesignCard grid)
  ├─ ProfilePage (uses multiple feature components)
  └─ UploadPage
```

### **2. Base Components: Button**

File: `src/components/Button.tsx`

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 disabled:text-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </button>
  );
};
```

**Usage:**

```typescript
// ✅ Consistent button styling everywhere
<Button variant="primary">Submit</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger" isLoading={isSaving}>Save</Button>
<Button disabled>Disabled</Button>
```

### **3. Compound Components Pattern**

For complex components with multiple parts:

```typescript
// Instead of: <Card title={...} content={...} footer={...} />
// Use compound pattern for more flexibility:

<Card>
  <Card.Header>
    <h2>Title</h2>
  </Card.Header>
  <Card.Body>
    <p>Content here</p>
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>

// Implementation:
const Card: React.FC<{ children: React.ReactNode }> & {
  Header: React.FC<{ children: React.ReactNode }>;
  Body: React.FC<{ children: React.ReactNode }>;
  Footer: React.FC<{ children: React.ReactNode }>;
} = ({ children }) => (
  <div className="border rounded-lg shadow-sm">
    {children}
  </div>
);

Card.Header = ({ children }) => (
  <div className="border-b px-4 py-3">
    {children}
  </div>
);

Card.Body = ({ children }) => (
  <div className="px-4 py-3">
    {children}
  </div>
);

Card.Footer = ({ children }) => (
  <div className="border-t px-4 py-3 bg-gray-50">
    {children}
  </div>
);
```

### **4. Variants Pattern**

```typescript
// Single component, multiple styles
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
}

// Single variant file:
const Button = ({ variant = 'primary' }: ButtonProps) => {
  const styles = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    ghost: 'text-gray-600 border border-gray-300',
  };

  return <button className={styles[variant]}>Click</button>;
};

// Usage: <Button variant="primary" />
```

---

## Form Validation

### **1. Multi-Layer Validation Strategy**

```
┌─────────────────────────────────────┐
│  Three Layers of Validation         │
├─────────────────────────────────────┤
│                                     │
│  Layer 1: HTML5 (Type)              │
│  <input type="email" />             │
│  Browser validates format           │
│                                     │
│  Layer 2: Frontend (UX)             │
│  Real-time feedback as typing       │
│  Shows errors immediately           │
│                                     │
│  Layer 3: Backend (Security)        │
│  Can't be bypassed                  │
│  Prevents injection/spam            │
│                                     │
└─────────────────────────────────────┘
```

### **2. Frontend Validation: Real-Time Feedback**

File: `src/pages/RegisterPage.tsx`

```typescript
interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export const RegisterPage = () => {
  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    errors: {},
    touched: {},
  });

  // Validate as user types (Layer 2)
  const handleFieldChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
      touched: { ...prev.touched, [field]: true },
    }));

    // Real-time validation
    const errors = validateField(field, value, form);
    setForm(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errors },
    }));
  };

  const validateField = (field: string, value: string, form: FormState) => {
    const errors: Record<string, string> = {};

    switch (field) {
      case 'username':
        if (value.length < 3) errors.username = 'Username must be 3+ chars';
        break;

      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Invalid email format';
        }
        break;

      case 'password':
        if (value.length < 6) errors.password = 'Password must be 6+ chars';
        break;

      case 'confirmPassword':
        if (value !== form.password) errors.confirmPassword = 'Passwords do not match';
        break;
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Full validation before submit
    if (!form.username || !form.email || !form.password) {
      alert('Fill all fields');
      return;
    }

    if (Object.keys(form.errors).length > 0) {
      alert('Fix errors before submitting');
      return;
    }

    // Send to backend (Layer 3)
    try {
      await authAPI.register(form.username, form.email, form.password);
      // Success
    } catch (error) {
      // Backend validation failed (e.g., email already exists)
      // Show error to user
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Username"
        value={form.username}
        onChange={(e) => handleFieldChange('username', e.target.value)}
        error={form.touched.username ? form.errors.username : undefined}
      />
      {/* Same for other fields */}
      <Button>Register</Button>
    </form>
  );
};
```

### **3. Backend Validation (Security)**

```typescript
// Backend: POST /auth/register
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Layer 3: Backend validation
  const errors: Record<string, string> = {};

  // Prevent XSS
  if (!username || username.trim().length < 3) {
    errors.username = 'Username required (3+ chars)';
  }

  // Prevent injection
  if (!email || !isValidEmail(email)) {
    errors.email = 'Valid email required';
  }

  // Check email not already used
  const existing = await User.findOne({ email });
  if (existing) {
    errors.email = 'Email already registered';
  }

  // Prevent brute force
  if (password.length < 6) {
    errors.password = 'Password must be 6+ chars';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  res.json({ user, token });
});
```

### **4. Common Validation Patterns**

```typescript
// Validation utilities
export const validators = {
  isEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  isUrl: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isStrongPassword: (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) && // Has uppercase
      /[0-9]/.test(password) && // Has number
      /[!@#$%]/.test(password) // Has special char
    );
  },

  isCreditCard: (card: string) => {
    // Luhn algorithm
    const digits = card.replace(/\D/g, '');
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let digit = parseInt(digits[i]);
      if (i % 2 === 0) digit *= 2;
      if (digit > 9) digit -= 9;
      sum += digit;
    }
    return sum % 10 === 0;
  },

  isPhoneNumber: (phone: string) => /^[0-9\-\+\(\)\s]{10,}$/.test(phone),

  isUsername: (username: string) => /^[a-zA-Z0-9_]{3,20}$/.test(username),
};

// Usage
if (!validators.isEmail(email)) {
  errors.email = 'Invalid email';
}
```

---

## Error Boundaries

### **1. What Are Error Boundaries?**

Error boundaries catch JavaScript errors anywhere in the component tree and display a fallback UI instead of crashing the entire app.

```
Without Error Boundary:
User clicks → Component error → Whole app crashes ❌

With Error Boundary:
User clicks → Component error → Fallback UI shown ✅
```

### **2. Implementation**

File: `src/components/ErrorBoundary.tsx`

```typescript
interface Props {
  children: React.ReactNode;
  fallback?: (error: Error) => React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    // Could send to Sentry, LogRocket, etc.
    // Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!) ?? (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mt-2">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### **3. Wrapping Components**

File: `src/App.tsx`

```typescript
export const App = () => {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <div>
          <h1>Page Error: {error.message}</h1>
          <button onClick={() => location.reload()}>Reload</button>
        </div>
      )}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Other routes... */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
```

### **4. Page-Level Error Boundaries**

For more granular error handling:

```typescript
export const HomePage = () => {
  return (
    <ErrorBoundary>
      {/* Page content */}
    </ErrorBoundary>
  );
};

export const DesignDetailPage = () => {
  return (
    <ErrorBoundary>
      {/* Page content */}
    </ErrorBoundary>
  );
};
```

### **5. Async Error Handling**

Error boundaries DON'T catch:
- Event handlers (use try-catch)
- Async code (use try-catch)
- Server-side rendering

```typescript
// ❌ Won't be caught by Error Boundary
const handleClick = () => {
  throw new Error('This is not caught!');
};

// ✅ Catch with try-catch
const handleClick = () => {
  try {
    throw new Error('This is caught!');
  } catch (error) {
    // Handle error
  }
};

// ❌ Async code not caught
useEffect(() => {
  throw new Error('Not caught!');
}, []);

// ✅ Catch async errors
useEffect(() => {
  Promise.reject('Error').catch(error => {
    // Handle error
  });
}, []);
```

---

## Scaling to Large Products

### **1. When to Move from Context to Redux/Zustand**

```
Product Size         | State Management       | When to Switch
──────────────────────────────────────────────────────────────
5 pages              | Context API           | ← Current
10-15 pages          | Context API           | Still fine
20+ pages            | Consider Redux/Zustand| Multiple contexts getting complex
                     |                       |

Features            | Context API           | When to Switch
────────────────────────────────────────────────────────────
3-5 global states   | Context API           | ✅
6-10 global states  | Context API           | Still fine
11+ global states   | Redux/Zustand         | Too many providers (prop drilling)
```

### **2. Current Architecture (Scales to ~100k Monthly Users)**

```
AuthContext (User, Token)
  ↓
Global Tree Structure:
├─ AuthProvider
│  ├─ NotificationProvider
│  │  ├─ Header (uses auth + notifications)
│  │  ├─ HomePage (local state for grid)
│  │  ├─ ProfilePage (local state for tabs)
│  │  └─ ...more pages
```

**Scaling to 1M+ Users:**

```
Zustand Store:
├─ authStore
│  ├─ user
│  ├─ token
│  └─ login/logout actions
├─ notificationStore
│  ├─ notifications[]
│  └─ add/remove actions
├─ designStore
│  ├─ designs[]
│  ├─ favorites[]
│  └─ cache status
└─ uiStore
   ├─ theme
   ├─ sidebarOpen
   └─ ...more UI state
```

### **3. Implementing Zustand (for large products)**

```typescript
// src/store/authStore.ts
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,

        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),

        login: async (email, password) => {
          const response = await api.login(email, password);
          set({ user: response.user, token: response.token });
        },

        logout: () => set({ user: null, token: null }),
      }),
      { name: 'auth-store' }
    )
  )
);

// Usage:
const MyComponent = () => {
  const { user, login } = useAuthStore();
  // ...
};
```

### **4. Folder Structure for Large Projects**

```
src/
├─ api/              (API calls)
│  ├─ auth.ts
│  ├─ designs.ts
│  ├─ comments.ts
│  └─ types.ts
│
├─ components/       (Reusable components)
│  ├─ common/        (Button, Input, Card)
│  ├─ layout/        (Header, Footer, Sidebar)
│  ├─ forms/         (LoginForm, RegisterForm)
│  └─ errors/        (ErrorBoundary, ErrorMessage)
│
├─ context/          (Context API for small state)
│  ├─ AuthContext.tsx
│  └─ NotificationContext.tsx
│
├─ hooks/            (Custom hooks)
│  ├─ useAuth.ts
│  ├─ useNotification.ts
│  ├─ useDesigns.ts
│  ├─ useInfiniteScroll.ts
│  └─ useFetch.ts
│
├─ pages/            (Page components)
│  ├─ HomePage.tsx
│  ├─ LoginPage.tsx
│  ├─ ProfilePage.tsx
│  ├─ DesignDetailPage.tsx
│  └─ UploadPage.tsx
│
├─ store/            (Zustand stores - for large products)
│  ├─ authStore.ts
│  ├─ designStore.ts
│  └─ uiStore.ts
│
├─ types/            (TypeScript types)
│  ├─ models.ts
│  └─ index.ts
│
├─ utils/            (Helper functions)
│  ├─ validators.ts
│  ├─ formatters.ts
│  └─ api-utils.ts
│
├─ styles/           (Global styles)
│  └─ globals.css
│
├─ App.tsx
├─ main.tsx
└─ index.html
```

### **5. Code Splitting for Performance**

```typescript
// src/routes.tsx
import { lazy } from 'react';

// Only load pages when needed
const HomePage = lazy(() => import('./pages/HomePage'));
const DesignDetailPage = lazy(() => import('./pages/DesignDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// With Suspense boundary
export const routes = [
  {
    path: '/',
    element: <Suspense fallback={<Loading />}><HomePage /></Suspense>,
  },
  {
    path: '/designs/:id',
    element: <Suspense fallback={<Loading />}><DesignDetailPage /></Suspense>,
  },
  // ...
];
```

---

## File Structure

### **Current Structure (Scales to 500k Users)**

```
frontend/
├─ src/
│  ├─ api/
│  │  ├─ client.ts
│  │  ├─ auth.ts
│  │  ├─ designs.ts
│  │  ├─ comments.ts
│  │  ├─ upload.ts
│  │  ├─ types.ts
│  │  └─ index.ts
│  │
│  ├─ components/
│  │  ├─ Button.tsx
│  │  ├─ Input.tsx
│  │  ├─ Loading.tsx
│  │  ├─ Error.tsx
│  │  ├─ EmptyState.tsx
│  │  ├─ DesignCard.tsx
│  │  ├─ layout/
│  │  │  ├─ Header.tsx
│  │  │  ├─ MainLayout.tsx
│  │  │  └─ ProtectedRoute.tsx
│  │  └─ index.ts
│  │
│  ├─ context/
│  │  ├─ AuthContext.tsx
│  │  └─ index.ts
│  │
│  ├─ hooks/
│  │  ├─ useDesigns.ts
│  │  ├─ useInfiniteScroll.ts
│  │  └─ index.ts
│  │
│  ├─ pages/
│  │  ├─ HomePage.tsx
│  │  ├─ LoginPage.tsx
│  │  ├─ RegisterPage.tsx
│  │  ├─ DesignDetailPage.tsx
│  │  ├─ UploadPage.tsx
│  │  ├─ ProfilePage.tsx
│  │  └─ index.ts
│  │
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
│
├─ public/
├─ .env
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ tailwind.config.js
├─ postcss.config.js
└─ index.html
```

### **Recommended Structure (For 1M+ Users)**

```
frontend/
├─ src/
│  ├─ api/
│  │  ├─ client.ts                 (Axios instance)
│  │  ├─ endpoints/
│  │  │  ├─ auth.ts
│  │  │  ├─ designs.ts
│  │  │  ├─ comments.ts
│  │  │  └─ users.ts
│  │  ├─ types.ts                  (All API types)
│  │  └─ index.ts
│  │
│  ├─ components/
│  │  ├─ ui/                        (Base components)
│  │  │  ├─ Button/
│  │  │  │  ├─ Button.tsx
│  │  │  │  └─ Button.test.tsx
│  │  │  ├─ Input/
│  │  │  ├─ Card/
│  │  │  └─ ...
│  │  ├─ common/                    (Common layouts)
│  │  │  ├─ Header/
│  │  │  ├─ Footer/
│  │  │  ├─ Sidebar/
│  │  │  └─ ErrorBoundary/
│  │  ├─ features/                  (Feature-specific)
│  │  │  ├─ Design/
│  │  │  │  ├─ DesignCard.tsx
│  │  │  │  ├─ DesignGrid.tsx
│  │  │  │  └─ DesignFilters.tsx
│  │  │  ├─ Profile/
│  │  │  ├─ Auth/
│  │  │  └─ Upload/
│  │  └─ index.ts
│  │
│  ├─ store/                        (Zustand stores)
│  │  ├─ auth.ts
│  │  ├─ ui.ts
│  │  ├─ designs.ts
│  │  └─ index.ts
│  │
│  ├─ hooks/                        (Custom hooks)
│  │  ├─ useAuth.ts
│  │  ├─ useDesigns.ts
│  │  ├─ useFetch.ts
│  │  ├─ useLocalStorage.ts
│  │  └─ index.ts
│  │
│  ├─ pages/
│  │  ├─ Home/
│  │  ├─ Auth/
│  │  │  ├─ LoginPage.tsx
│  │  │  └─ RegisterPage.tsx
│  │  ├─ Design/
│  │  │  ├─ DesignDetailPage.tsx
│  │  │  └─ UploadPage.tsx
│  │  ├─ Profile/
│  │  │  └─ ProfilePage.tsx
│  │  └─ routes.tsx                (Centralized route definitions)
│  │
│  ├─ services/                     (Business logic)
│  │  ├─ design-service.ts
│  │  ├─ user-service.ts
│  │  └─ auth-service.ts
│  │
│  ├─ types/
│  │  ├─ models.ts                 (Domain models)
│  │  ├─ api.ts                    (API response types)
│  │  └─ index.ts
│  │
│  ├─ utils/
│  │  ├─ validators.ts
│  │  ├─ formatters.ts
│  │  ├─ api-helpers.ts
│  │  ├─ storage.ts               (localStorage wrapper)
│  │  └─ index.ts
│  │
│  ├─ styles/
│  │  ├─ globals.css
│  │  └─ themes/
│  │
│  ├─ config/
│  │  └─ constants.ts
│  │
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
│
├─ tests/                           (Test files)
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
│
├─ public/
├─ .env
├─ .env.example
├─ .gitignore
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ vitest.config.ts               (Unit testing)
├─ tailwind.config.js
├─ postcss.config.js
├─ index.html
└─ README.md
```

---

## Decision Flow: What Architecture to Use

```
Deciding on Architecture

1. How many global values do you need?
   └─ < 5 (auth, notifications) → Use Context API ✅
   └─ > 10 → Use Zustand/Redux

2. How is state updated?
   └─ Synchronously → Context API ✅
   └─ Async with caching → Zustand/Redux

3. Will you debug state?
   └─ Need state inspector → Zustand (has devtools) ✅
   └─ Simple logging → Context API

4. How many dev hours do you have?
   └─ < 40 hours → Context API ✅
   └─ > 100 hours → Redux/Zustand

5. Team size?
   └─ 1-3 devs → Context API ✅
   └─ 5+ devs → Zustand (easier to understand)
```

---

## Summary

### Current Implementation:
✅ Context API for auth (global state)
✅ useState for local component state
✅ useCallback for optimized functions
✅ Form validation on frontend + backend
✅ Error boundaries for crash prevention
✅ Reusable component library

### Scales to:
✅ 500k monthly active users
✅ 20-30 component types
✅ 3-5 global state values

### When to Upgrade:
- 📈 1M+ users → Consider code splitting
- 📈 50+ pages → Move to Zustand
- 📈 10+ global states → Use state machine (Redux)
- 📈 Complex data flows → Use service layer

### Next Steps:
- [ ] Add Zustand for larger global state
- [ ] Implement service layer for business logic
- [ ] Add unit tests with Vitest
- [ ] Set up E2E tests with Playwright
- [ ] Implement React Query for server state
- [ ] Add state machine for complex flows
- [ ] Implement error tracking (Sentry)
