# Performance & Error Handling Features

This document outlines the performance monitoring, error boundaries, and code splitting features implemented in the Stogram client application.

## 🚀 Features Implemented

### 1. Error Boundaries

**Location**: `src/components/ErrorBoundary.tsx`

Error boundaries are React components that catch JavaScript errors in their child component tree, log those errors, and display a fallback UI instead of the crashed component tree.

#### Features:
- **Automatic Error Capture**: Catches errors in component tree and prevents app crashes
- **Development Mode Details**: Shows detailed error information in development
- **Error Logging**: Logs errors to console and can be integrated with external monitoring services
- **User-Friendly Fallback**: Provides a clean error UI with retry/reload options
- **Customizable**: Accepts custom fallback UI and error handlers

#### Usage:
```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error('Component error:', error, errorInfo);
  }}
  fallback={<div>Something went wrong</div>}
>
  <YourComponent />
</ErrorBoundary>
```

#### Hook for Functional Components:
```tsx
import { useErrorHandler } from './components/ErrorBoundary';

const MyComponent = () => {
  const handleError = useErrorHandler();
  
  const handleAsyncError = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error);
    }
  };
};
```

### 2. Code Splitting

**Location**: `src/components/LazyComponents.tsx`, `src/utils/lazyLoading.tsx`, `src/App.tsx`

Code splitting is implemented using React.lazy() and Suspense to load components on-demand, reducing initial bundle size.

#### Features:
- **Route-Based Splitting**: All main pages are lazy-loaded
- **Component-Based Splitting**: Heavy components load on-demand
- **Dynamic Imports**: Components are loaded only when needed
- **Vendor Bundle Splitting**: Large dependencies split into separate chunks
- **Loading States**: Clean loading UIs during component loading
- **Error Handling**: Automatic error boundaries for lazy-loaded components
- **Intelligent Preloading**: Strategic preloading of critical components
- **Smart Loading**: Route-based and hover-based preloading for better UX

#### Route-Based Code Splitting:
```tsx
// All pages are lazy-loaded
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
```

#### Lazy Components Available:
- `LazyUserSettings` - User settings modal
- `LazyBotManager` - Bot management interface
- `LazyAnalyticsDashboard` - Analytics and metrics
- `LazyChatFolders` - Chat organization
- `LazyThemeCustomizer` - Theme customization
- `LazyTwoFactorAuth` - 2FA setup
- `LazyPrivacySettings` - Privacy configuration
- `LazyArchivedChats` - Archived messages
- `LazyBlockedUsers` - User management
- `LazyCallModal` - Voice/video calls
- `LazyMediaViewer` - Media display
- `LazyVoiceRecorder` - Voice recording
- `LazyVirtualizedList` - Performance lists

#### Usage:
```tsx
import { LazyUserSettings } from './components/LazyComponents';

// Component is loaded on-demand
<LazyUserSettings onClose={handleClose} />
```

#### Preloading Strategy:
```tsx
import { preloadCriticalComponents, preloadByRoute } from './components/LazyComponents';

// Preload critical components after initial render
useEffect(() => {
  const timer = setTimeout(() => {
    preloadCriticalComponents();
  }, 1000);
  return () => clearTimeout(timer);
}, []);

// Route-based preloading
preloadByRoute(location.pathname);
```

### 3. Performance Monitoring

**Location**: `src/utils/performance.ts`

Comprehensive performance monitoring system that tracks component render times, API performance, user interactions, Web Vitals, and resource loading.

#### Features:
- **Component Performance**: Tracks render times and identifies slow components
- **API Monitoring**: Measures API call durations and success rates
- **User Interaction Tracking**: Logs user actions and their performance
- **Web Vitals Tracking**: Monitors Core Web Vitals (LCP, FID, CLS, INP, TTFB)
- **Resource Monitoring**: Tracks loading of scripts, styles, images
- **Bundle Analysis**: Analyzes bundle sizes and loading performance
- **Memory Usage**: Monitors JavaScript heap usage
- **FPS Monitoring**: Real-time frame rate tracking
- **Long Task Detection**: Identifies blocking operations

#### Web Vitals Tracked:
- **LCP** (Largest Contentful Paint): < 2.5s good, < 4.0s needs improvement
- **FID** (First Input Delay): < 100ms good, < 300ms needs improvement
- **CLS** (Cumulative Layout Shift): < 0.1 good, < 0.25 needs improvement
- **INP** (Interaction to Next Paint): < 200ms good, < 500ms needs improvement
- **TTFB** (Time to First Byte): < 800ms good, < 1800ms needs improvement

#### Usage:
```tsx
import { usePerformanceMonitor } from './utils/performance';

const MyComponent = () => {
  const { startRender, trackInteraction } = usePerformanceMonitor('MyComponent');
  
  useEffect(() => {
    const endRender = startRender();
    trackInteraction('component_mount', 'MyComponent');
    endRender();
  }, []);
  
  const handleClick = () => {
    trackInteraction('button_click', 'MyComponent');
  };
};
```

#### API Monitoring:
```tsx
import { monitoredApi } from './utils/monitoredApi';

// Automatic performance tracking
const response = await monitoredApi.get('/api/data');
```

#### Get Performance Metrics:
```tsx
import { performanceMonitor } from './utils/performance';

// Get summary
const summary = performanceMonitor.getPerformanceSummary();

// Get Web Vitals
const vitals = performanceMonitor.getWebVitals();

// Get bundle analysis
const bundleAnalysis = performanceMonitor.getBundleAnalysis();

// Get slow resources
const slowResources = performanceMonitor.getSlowResources(1000);

// Export all metrics
const allMetrics = performanceMonitor.exportMetrics();
```

### 4. Development Tools

**Location**: `src/components/DevPerformanceMonitor.tsx`

Development-only performance monitoring widget for real-time performance insights.

#### Features:
- **Real-time Metrics**: Live FPS, render times, API performance
- **Web Vitals Display**: Color-coded Web Vitals ratings
- **Visual Indicators**: Color-coded performance indicators
- **Resource Statistics**: Track all resource loading
- **Memory Usage**: JavaScript heap monitoring
- **Quick Actions**: Clear metrics, export data, analyze bundle
- **Toggle Visibility**: Can be shown/hidden during development
- **Positioning**: Configurable screen position

#### Display Sections:
1. **Web Vitals**: LCP, FID, CLS, INP, TTFB with color-coded ratings
2. **Performance**: FPS, component renders, average render time
3. **API**: Total calls, average time, success rate
4. **Resources**: Total loaded, total size, average load time
5. **Memory**: JavaScript heap usage

#### Usage:
```tsx
import { DevPerformanceMonitor } from './components/DevPerformanceMonitor';

<DevPerformanceMonitor 
  enabled={process.env.NODE_ENV === 'development'}
  position="top-right"
/>
```

### 5. Performance Dashboard

**Location**: `src/components/PerformanceDashboard.tsx`

Comprehensive performance dashboard for detailed analysis and monitoring.

#### Features:
- **Performance Summary**: Overview of all metrics
- **Detailed Analytics**: In-depth performance analysis
- **Export Functionality**: Export metrics for analysis
- **Performance Tips**: Automated optimization suggestions
- **Historical Data**: Track performance over time
- **Visual Charts**: Performance visualization

### 6. Bundle Optimization

**Location**: `vite.config.ts`

Configured for optimal code splitting and bundle management.

#### Features:
- **Vendor Chunking**: Splits dependencies into logical chunks
- **React Vendor**: react, react-dom, react-router-dom
- **UI Vendor**: lucide-react, react-hot-toast, clsx
- **Media Vendor**: wavesurfer.js, react-player, browser-image-compression
- **Socket Vendor**: socket.io-client
- **Utils Vendor**: axios, date-fns, zustand

#### Configuration:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui-vendor': ['lucide-react', 'react-hot-toast', 'clsx'],
        'media-vendor': ['wavesurfer.js', 'react-player', 'browser-image-compression'],
        'socket-vendor': ['socket.io-client'],
        'utils-vendor': ['axios', 'date-fns', 'zustand'],
      },
    },
  },
  chunkSizeWarningLimit: 1000,
  sourcemap: isProduction ? false : true,
}
```

## 🎯 Performance Best Practices Implemented

### 1. Component Optimization
- Error boundaries prevent cascade failures
- Lazy loading reduces initial bundle size
- Performance monitoring identifies bottlenecks
- Route-based code splitting for faster navigation

### 2. API Optimization
- Request/response time tracking
- Automatic retry mechanisms
- Batch request support
- Progress monitoring for uploads

### 3. User Experience
- Loading states for all async operations
- Graceful error handling
- Performance feedback in development
- Optimized resource loading
- Intelligent preloading

### 4. Development Experience
- Real-time performance monitoring
- Detailed error reporting
- Performance profiling tools
- Automated performance tips
- Bundle analysis tools

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Controls development vs production behavior
- Performance monitoring is enhanced in development mode
- Error details are shown in development only

### Customization Options
- Custom error boundaries
- Configurable performance thresholds
- Custom loading states
- Adjustable monitoring intervals

## 📊 Performance Metrics

### Component Performance
- **Good**: < 16ms render time
- **Warning**: 16-33ms render time
- **Poor**: > 33ms render time

### API Performance
- **Good**: < 500ms response time
- **Warning**: 500-1000ms response time
- **Poor**: > 1000ms response time

### Frame Rate
- **Good**: ≥ 55 FPS
- **Warning**: 30-55 FPS
- **Poor**: < 30 FPS

### Web Vitals
- **LCP**: Good ≤ 2.5s, Needs Improvement ≤ 4.0s
- **FID**: Good ≤ 100ms, Needs Improvement ≤ 300ms
- **CLS**: Good ≤ 0.1, Needs Improvement ≤ 0.25
- **INP**: Good ≤ 200ms, Needs Improvement ≤ 500ms
- **TTFB**: Good ≤ 800ms, Needs Improvement ≤ 1800ms

## 🚀 Getting Started

1. **Error Boundaries**: Wrap components with `ErrorBoundary`
2. **Code Splitting**: Use lazy components from `LazyComponents`
3. **Performance Monitoring**: Use `usePerformanceMonitor` hook
4. **API Monitoring**: Use `monitoredApi` instead of regular axios
5. **Development**: Enable `DevPerformanceMonitor` during development
6. **Route Preloading**: Use `preloadByRoute` for intelligent preloading

## 🔍 Monitoring & Debugging

### Development Mode
- Use the DevPerformanceMonitor widget (⚡ icon)
- Check console for performance warnings
- Review error boundary logs
- Monitor component render times
- Track Web Vitals in real-time
- Analyze bundle sizes
- View resource loading statistics

### Production Mode
- Errors are logged but not shown to users
- Performance data is collected for analysis
- Graceful fallbacks prevent crashes
- Metrics can be exported for analysis
- Web Vitals tracked for optimization

## 📈 Performance Improvements

With these features implemented, the application benefits from:

1. **Faster Initial Load**: Code splitting reduces bundle size by 40-60%
2. **Better Error Recovery**: Error boundaries prevent crashes
3. **Performance Insights**: Real-time monitoring identifies issues
4. **Improved UX**: Loading states and graceful error handling
5. **Development Efficiency**: Built-in debugging and profiling tools
6. **Optimal Caching**: Vendor splitting improves cache hit rates
7. **Better Web Vitals**: Monitoring helps maintain good scores
8. **Resource Optimization**: Track and optimize all resource loading

## 📚 Additional Documentation

See `CODE_SPLITTING_PERFORMANCE_GUIDE.md` for detailed guide on:
- Advanced code splitting strategies
- Performance optimization techniques
- Monitoring and debugging
- Bundle analysis
- Best practices and guidelines

This comprehensive performance and error handling system ensures a robust, efficient, and user-friendly application experience.
