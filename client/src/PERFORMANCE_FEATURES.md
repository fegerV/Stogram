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

**Location**: `src/components/LazyComponents.tsx`, `src/utils/lazyLoading.tsx`

Code splitting is implemented using React.lazy() and Suspense to load components on-demand, reducing initial bundle size.

#### Features:
- **Dynamic Imports**: Components are loaded only when needed
- **Loading States**: Clean loading UIs during component loading
- **Error Handling**: Automatic error boundaries for lazy-loaded components
- **Preloading**: Strategic preloading of critical components
- **Smart Loading**: Hover-based preloading for better UX

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

// With custom loading state
<LazyUserSettings 
  onClose={handleClose}
  fallback={<div>Loading settings...</div>}
/>
```

#### Preloading Strategy:
```tsx
import { preloadCriticalComponents } from './components/LazyComponents';

// Preload components that are likely to be used soon
useEffect(() => {
  const timer = setTimeout(() => {
    preloadCriticalComponents();
  }, 1000);
  return () => clearTimeout(timer);
}, []);
```

### 3. Performance Monitoring

**Location**: `src/utils/performance.ts`

Comprehensive performance monitoring system that tracks component render times, API performance, and user interactions.

#### Features:
- **Component Performance**: Tracks render times and identifies slow components
- **API Monitoring**: Measures API call durations and success rates
- **User Interaction Tracking**: Logs user actions and their performance
- **Memory Usage**: Monitors JavaScript heap usage
- **FPS Monitoring**: Real-time frame rate tracking
- **Long Task Detection**: Identifies blocking operations

#### Metrics Tracked:
- Component render times
- API call durations
- Success/error rates
- User interaction latency
- Memory consumption
- Frame rate (FPS)
- Navigation timing
- Long tasks (>50ms)

#### Usage:
```tsx
import { usePerformanceMonitor } from './utils/performance';

const MyComponent = () => {
  const { startRender, trackInteraction } = usePerformanceMonitor('MyComponent');
  
  useEffect(() => {
    startRender();
    trackInteraction('component_mount', 'MyComponent');
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

// With custom configuration
const response = await monitoredApi.get('/api/data', {
  enableMonitoring: true
});
```

### 4. Development Tools

**Location**: `src/components/DevPerformanceMonitor.tsx`

Development-only performance monitoring widget for real-time performance insights.

#### Features:
- **Real-time Metrics**: Live FPS, render times, API performance
- **Visual Indicators**: Color-coded performance indicators
- **Memory Usage**: JavaScript heap monitoring
- **Quick Actions**: Clear metrics, export data
- **Toggle Visibility**: Can be shown/hidden during development
- **Positioning**: Configurable screen position

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

## 🎯 Performance Best Practices Implemented

### 1. Component Optimization
- Error boundaries prevent cascade failures
- Lazy loading reduces initial bundle size
- Performance monitoring identifies bottlenecks

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

### 4. Development Experience
- Real-time performance monitoring
- Detailed error reporting
- Performance profiling tools
- Automated performance tips

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

## 🚀 Getting Started

1. **Error Boundaries**: Wrap components with `ErrorBoundary`
2. **Code Splitting**: Use lazy components from `LazyComponents`
3. **Performance Monitoring**: Use `usePerformanceMonitor` hook
4. **API Monitoring**: Use `monitoredApi` instead of regular axios
5. **Development**: Enable `DevPerformanceMonitor` during development

## 🔍 Monitoring & Debugging

### Development Mode
- Use the DevPerformanceMonitor widget
- Check console for performance warnings
- Review error boundary logs
- Monitor component render times

### Production Mode
- Errors are logged but not shown to users
- Performance data is collected for analysis
- Graceful fallbacks prevent crashes
- Metrics can be exported for analysis

## 📈 Performance Improvements

With these features implemented, the application benefits from:

1. **Faster Initial Load**: Code splitting reduces bundle size
2. **Better Error Recovery**: Error boundaries prevent crashes
3. **Performance Insights**: Real-time monitoring identifies issues
4. **Improved UX**: Loading states and graceful error handling
5. **Development Efficiency**: Built-in debugging and profiling tools

This comprehensive performance and error handling system ensures a robust, efficient, and user-friendly application experience.