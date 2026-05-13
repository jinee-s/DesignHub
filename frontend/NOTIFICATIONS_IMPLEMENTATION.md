# Practical State Management: Adding Notifications

This guide walks through adding a global `NotificationContext` to demonstrate state management patterns.

---

## Step 1: Create NotificationContext

File: `src/context/NotificationContext.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (message: string, type: NotificationType, duration: number = 3000) => {
      const id = Date.now().toString();

      // Add notification to list
      setNotifications((prev) => [...prev, { id, message, type, duration }]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => removeNotification(id), duration);
      }
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used inside NotificationProvider');
  }
  return context;
};
```

---

## Step 2: Create NotificationDisplay Component

File: `src/components/NotificationDisplay.tsx`

```typescript
import React from 'react';
import { useNotification } from '../context/NotificationContext';

const NotificationDisplay: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${bgColor[notification.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}
        >
          <span className="text-lg font-bold">{icon[notification.type]}</span>
          <span>{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-2 hover:opacity-80"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationDisplay;
```

---

## Step 3: Update App.tsx

File: `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationDisplay from './components/NotificationDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DesignDetailPage from './pages/DesignDetailPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            {/* Display notifications globally */}
            <NotificationDisplay />

            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes with layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/designs/:id" element={<DesignDetailPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
```

---

## Step 4: Use Notifications in Components

### Example 1: LoginPage

File: `src/pages/LoginPage.tsx` (updated)

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Button from '../components/Button';
import Input from '../components/Input';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);

      // Show success notification
      addNotification('Login successful!', 'success');

      // Navigate to home
      navigate('/');
    } catch (error) {
      // Show error notification
      addNotification(
        error instanceof Error ? error.message : 'Login failed',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
        >
          Login
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
```

### Example 2: UploadPage

File: `src/pages/UploadPage.tsx` (updated)

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { uploadAPI, designsAPI } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import Loading from '../components/Loading';

const UploadPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [image, setImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI');
  const [isLoading, setIsLoading] = useState(false);

  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleImageSelect = (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      addNotification('Please select an image file', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addNotification('Image must be less than 10MB', 'error');
      return;
    }

    setImage(file);
    addNotification('Image selected successfully', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Step 1: Upload image
      addNotification('Uploading image...', 'info');
      const uploadResponse = await uploadAPI.image(image!);

      // Step 2: Create design
      addNotification('Creating design...', 'info');
      const designResponse = await designsAPI.create({
        title,
        description,
        category,
        imageUrl: uploadResponse.url,
      });

      // Success
      addNotification('Design uploaded successfully!', 'success', 2000);

      // Navigate to design detail
      navigate(`/designs/${designResponse.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      addNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload Design</h1>

      {step === 1 ? (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && handleImageSelect(e.target.files[0])}
          />
          {image && <p className="mt-2">✓ {image.name} selected</p>}
          <Button onClick={() => setStep(2)} disabled={!image}>
            Next
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            as="textarea"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option>UI</option>
            <option>UX</option>
            <option>Web</option>
          </select>

          <Button type="submit" isLoading={isLoading}>
            Publish
          </Button>
        </form>
      )}
    </div>
  );
};

export default UploadPage;
```

---

## Local vs Global State Decision

```
NOTIFICATION STATE: Should it be global?

Questions:
1. Is it needed by multiple components?
   YES → Shows in header, sidebar, and page ✓

2. Should it persist across page nav?
   YES → User sees toast across pages ✓

3. Is it complex?
   NO → Just a list to add/remove from ✓

4. Updates frequently?
   NO → Maybe 5-6 times per user session ✓

DECISION: Use Global State (Context) ✅
```

---

## Performance Considerations

### 1. Optimize Re-renders

```typescript
// Without optimization:
// Every component rerenders when notifications change
const { notifications, addNotification } = useNotification();

// With optimization:
// Separate the display from the logic
const { notifications } = useNotification();
const { addNotification } = useNotification();

// Better: Use useCallback to memoize functions
const addNotification = useCallback(
  (message: string, type: NotificationType) => {
    // ...
  },
  [] // Empty deps: function never changes
);
```

### 2. Limit Notification Count

```typescript
const addNotification = useCallback(
  (message: string, type: NotificationType, duration: number = 3000) => {
    const id = Date.now().toString();

    setNotifications((prev) => {
      // Keep max 5 notifications
      const updated = [...prev, { id, message, type, duration }];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });

    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
  },
  []
);
```

### 3. Memoize Context Value

```typescript
// Without memoization:
const value = { notifications, addNotification, removeNotification };
// Creates new object every render!

// With memoization:
const value = useMemo(
  () => ({ notifications, addNotification, removeNotification }),
  [notifications, addNotification, removeNotification]
);
```

---

## Testing NotificationContext

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider, useNotification } from './NotificationContext';

const TestComponent = () => {
  const { addNotification } = useNotification();

  return (
    <button onClick={() => addNotification('Test message', 'success')}>
      Show notification
    </button>
  );
};

describe('NotificationContext', () => {
  it('adds notification when button clicked', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    // Check that notification appears
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('removes notification after duration', async () => {
    jest.useFakeTimers();

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('throws error when used outside provider', () => {
    const TestComponentWithout = () => {
      const { addNotification } = useNotification();
      return null;
    };

    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => render(<TestComponentWithout />)).toThrow(
      'useNotification must be used inside NotificationProvider'
    );

    spy.mockRestore();
  });
});
```

---

## Common Patterns

### 1. Notification for API Calls

```typescript
// Automatic notification for any API call
const useFetch = (fn: () => Promise<any>) => {
  const { addNotification } = useNotification();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const result = await fn();
      setData(result);
      addNotification('Loaded successfully', 'success');
    } catch (err) {
      setError(err as Error);
      addNotification((err as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, fetch };
};

// Usage:
const { data, fetch } = useFetch(() => designsAPI.getAll());
```

### 2. Confirmation Before Action

```typescript
const useConfirm = () => {
  const { addNotification } = useNotification();

  return (message: string) => {
    return new Promise<boolean>((resolve) => {
      // Show custom confirmation dialog
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  };
};

// Usage:
const confirm = useConfirm();
if (await confirm('Delete design?')) {
  await designsAPI.delete(id);
  addNotification('Design deleted', 'success');
}
```

### 3. Batch Notifications

```typescript
const useNotifications = () => {
  const { addNotification } = useNotification();

  return {
    success: (message: string) => addNotification(message, 'success'),
    error: (message: string) => addNotification(message, 'error'),
    info: (message: string) => addNotification(message, 'info'),
    warning: (message: string) => addNotification(message, 'warning'),
  };
};

// Usage:
const notify = useNotifications();
notify.success('Saved!');
notify.error('Failed to save');
notify.info('Loading...');
```

---

## Scaling Notifications

### Current (Good for < 100k users)
- Single Context for notifications
- Notifications stored in state array
- Auto-remove after 3 seconds

### For 1M+ Users
- Move to Zustand store
- Add notification history/logs
- Add notification categories (silent, warning, error)
- Add sound/vibration for alerts
- Add do-not-disturb mode
- Add notification badges (unread count)

```typescript
// src/store/notificationStore.ts
import create from 'zustand';

interface NotificationStore {
  notifications: Notification[];
  history: Notification[];
  addNotification: (message: string, type: NotificationType) => void;
  archiveNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  history: [],

  addNotification: (message: string, type: NotificationType) => {
    const notification = { id: Date.now().toString(), message, type };

    set((state) => ({
      notifications: [...state.notifications, notification],
      history: [...state.history, notification],
    }));

    // Auto-remove after 3s
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notification.id),
      }));
    }, 3000);
  },

  archiveNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () =>
    set({
      notifications: [],
    }),
}));
```

---

## Summary

### What We Built:
✅ Global NotificationContext for managing toasts
✅ NotificationDisplay component for rendering
✅ Integration in Login, Upload, and other pages
✅ Auto-removal after duration
✅ Multiple notification types (success, error, info, warning)

### Why It's Global:
✅ Needed by many components (not just one)
✅ Shows across pages (not page-specific)
✅ Simple state (just add/remove)
✅ Not updated frequently

### Performance:
✅ useCallback to memoize functions
✅ Limit notifications to 5 max
✅ Auto-remove after duration
✅ Context value memoized

### When to Upgrade:
- 100k+ users → Move to Zustand
- Complex rules → Add notification middleware
- Analytics → Add notification tracking

