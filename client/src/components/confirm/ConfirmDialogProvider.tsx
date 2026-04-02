import { AlertTriangle } from 'lucide-react';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger';
}

type ConfirmFn = (options: ConfirmDialogOptions | string) => Promise<boolean>;

const fallbackConfirm: ConfirmFn = async (options) => {
  const message = typeof options === 'string' ? options : options.message;
  return window.confirm(message);
};

const ConfirmDialogContext = createContext<ConfirmFn>(fallbackConfirm);

interface DialogState extends ConfirmDialogOptions {
  open: boolean;
}

const initialState: DialogState = {
  open: false,
  title: '',
  message: '',
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  tone: 'primary',
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(initialState);
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const closeDialog = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(initialState);
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      if (typeof options === 'string') {
        setDialog({
          ...initialState,
          open: true,
          message: options,
        });
        return;
      }

      setDialog({
        open: true,
        title: options.title ?? 'Подтверждение',
        message: options.message,
        confirmText: options.confirmText ?? 'Подтвердить',
        cancelText: options.cancelText ?? 'Отмена',
        tone: options.tone ?? 'primary',
      });
    });
  }, []);

  useEffect(() => {
    if (!dialog.open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDialog, dialog.open]);

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
    };
  }, []);

  const value = useMemo(() => confirm, [confirm]);
  const confirmButtonClass =
    dialog.tone === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-600'
      : 'bg-[#3390ec] text-white hover:bg-[#2c83d9]';

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}

      {dialog.open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => closeDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{dialog.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {dialog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => closeDialog(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => closeDialog(true)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${confirmButtonClass}`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmDialogContext);
}
