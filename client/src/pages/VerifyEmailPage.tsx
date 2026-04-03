import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, Mail, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const pendingEmail = searchParams.get('email') || '';

  useEffect(() => {
    const token = searchParams.get('token');
    const pending = searchParams.get('pending');

    if (pending === '1') {
      setStatus('pending');
      setMessage('Мы отправили письмо с подтверждением на вашу почту. Откройте письмо и перейдите по ссылке внутри.');
      return;
    }

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
      setMessage('Email подтверждён. Теперь вы можете войти в Stogram.');

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Не удалось подтвердить email. Возможно, ссылка устарела.');
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) {
      return;
    }

    setResending(true);
    try {
      const response = await authApi.requestVerificationEmail(pendingEmail.trim().toLowerCase());
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось отправить письмо повторно');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-[30px] border border-slate-200/80 bg-white/95 p-8 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
        {status === 'loading' && (
          <>
            <Loader className="mx-auto mb-4 h-16 w-16 animate-spin text-[#3390ec]" />
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Проверяем email</h1>
            <p className="text-slate-500 dark:text-slate-400">Подождите немного, мы проверяем ссылку.</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <Mail className="mx-auto mb-4 h-16 w-16 text-[#3390ec]" />
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Проверьте почту</h1>
            <p className="mb-2 text-slate-500 dark:text-slate-400">{message}</p>
            {pendingEmail ? (
              <p className="mb-6 text-sm text-slate-400 dark:text-slate-500">{pendingEmail}</p>
            ) : null}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || !pendingEmail}
                className="rounded-2xl bg-[#3390ec] px-6 py-3 text-white transition hover:bg-[#2c83d9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resending ? 'Отправляем...' : 'Отправить письмо повторно'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Перейти ко входу
              </button>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Email подтверждён</h1>
            <p className="mb-4 text-slate-500 dark:text-slate-400">{message}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Сейчас перенаправим вас ко входу.</p>
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
