import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-blue-600 dark:text-blue-400 mb-2`} />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
};

interface LazyComponentProps {
  fallback?: React.ReactNode;
  error?: React.ReactNode;
}

export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyComponentProps = {}
) => {
  const LazyComponent = React.lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <ErrorBoundary
      fallback={
        options.error || (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to load component</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )
      }
    >
      <Suspense fallback={options.fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

// Preload a component
export const preloadComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  importFunc();
};

// HOC to add loading states to components
export const withLoadingState = <P extends object>(
  Component: React.ComponentType<P>,
  loadingMessage = 'Loading...'
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
      <Component {...(props as any)} {...({ ref } as any)} />
    </Suspense>
  ));
};