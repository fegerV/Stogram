import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.props.onError?.(error, errorInfo);

    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      console.error('Error logged:', errorData);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
          <div className="w-full max-w-md rounded-[30px] border border-slate-200/80 bg-white/95 p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-rose-100 p-3 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>

            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Что-то пошло не так</h2>
            <p className="mb-6 text-slate-500 dark:text-slate-400">
              Произошла непредвиденная ошибка. Мы сохранили детали, чтобы быстрее разобраться в проблеме.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                  Детали ошибки
                </summary>
                <div className="mt-3 max-h-40 overflow-auto rounded-2xl bg-slate-100 p-3 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  <div className="mb-2 font-bold">Error:</div>
                  <div className="mb-3">{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <>
                      <div className="mb-2 font-bold">Stack Trace:</div>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex items-center gap-2 rounded-2xl bg-[#3390ec] px-4 py-2 text-white transition hover:bg-[#2c83d9]"
              >
                <RefreshCw className="h-4 w-4" />
                Попробовать снова
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);

    if (import.meta.env.PROD) {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      console.error('Error logged:', errorData);
    }
  };
};
