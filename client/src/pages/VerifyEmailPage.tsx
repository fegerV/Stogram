import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, XCircle } from 'lucide-react';
import { authApi } from '../services/api';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Ссылка подтверждения недействительна.');
      return;
    }

    void verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      await authApi.verifyEmail(token);
      setStatus('success');
      setMessage('Email подтверждён. Теперь можно пользоваться всеми возможностями Stogram.');

      setTimeout(() => {
        navigate('/chat');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Не удалось подтвердить email. Ссылка могла устареть.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-[30px] border border-slate-200/80 bg-white/95 p-8 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
        {status === 'loading' && (
          <>
            <Loader className="mx-auto mb-4 h-16 w-16 animate-spin text-[#3390ec]" />
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Подтверждаем email</h1>
            <p className="text-slate-500 dark:text-slate-400">Подождите немного, мы проверяем ссылку.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Email подтверждён</h1>
            <p className="mb-4 text-slate-500 dark:text-slate-400">{message}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Сейчас перенаправим вас в чат.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-500" />
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Подтверждение не удалось</h1>
            <p className="mb-6 text-slate-500 dark:text-slate-400">{message}</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-2xl bg-[#3390ec] px-6 py-3 text-white transition hover:bg-[#2c83d9]"
            >
              Перейти ко входу
            </button>
          </>
        )}
      </div>
    </div>
  );
};
