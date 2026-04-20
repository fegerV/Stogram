import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import ru from '../i18n/ru';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const t = ru.auth.login;

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingVerificationLogin, setPendingVerificationLogin] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const { login: loginUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!login || !password) {
      toast.error(t.validation.required);
      return;
    }

    if (requiresTwoFactor && !twoFactorCode.trim()) {
      toast.error(t.validation.twoFactorRequired);
      return;
    }

    try {
      await loginUser(login.trim(), password, twoFactorCode.trim() || undefined);
      setPendingVerificationLogin('');
      setRequiresTwoFactor(false);
      setTwoFactorCode('');
      toast.success(t.toast.welcomeBack);
      navigate('/');
    } catch (error: any) {
      const code = error.response?.data?.code;
      const message = error.response?.data?.error;

      if (code === 'EMAIL_NOT_VERIFIED') {
        setPendingVerificationLogin(login.trim());
        toast.error(t.toast.verifyEmailBeforeLogin);
        return;
      }

      if (code === 'TWO_FACTOR_REQUIRED') {
        setRequiresTwoFactor(true);
        toast.error(t.toast.twoFactorRequired);
        return;
      }

      if (code === 'TWO_FACTOR_INVALID') {
        setRequiresTwoFactor(true);
        toast.error(t.toast.twoFactorInvalid);
        return;
      }

      toast.error(message || t.toast.loginFailed);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationLogin || !pendingVerificationLogin.includes('@')) {
      toast.error(t.toast.emailRequiredForResend);
      return;
    }

    setIsResendingVerification(true);

    try {
      const response = await authApi.requestVerificationEmail(pendingVerificationLogin.trim().toLowerCase());
      toast.success(response.data?.message || t.toast.verificationResent);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t.toast.verificationResendFailed);
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-slate-900 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-[32px] border border-white/15 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95">
        <div className="mb-5 flex justify-end">
          <ThemeToggle />
        </div>

        <div className="mb-8 flex items-center justify-center">
          <div className="rounded-[28px] bg-gradient-to-br from-[#3390ec] to-cyan-500 p-4 text-white shadow-lg">
            <MessageCircle className="h-10 w-10" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-4xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
        <p className="mb-8 text-center text-slate-500 dark:text-slate-400">{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.loginLabel}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder={t.loginPlaceholder}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder={t.passwordPlaceholder}
                disabled={isLoading}
              />
            </div>
          </div>

          {requiresTwoFactor ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.twoFactorLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.replace(/\s+/g, ''))}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  placeholder="123456"
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : null}

          {pendingVerificationLogin ? (
            <div className="rounded-2xl border border-amber-300/70 bg-amber-50/90 p-4 text-left dark:border-amber-500/40 dark:bg-amber-500/10">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                <div className="min-w-0">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    {t.emailNotVerifiedTitle}
                  </p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/90">
                    {t.emailNotVerifiedDescription(pendingVerificationLogin)}
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    <Send className="h-4 w-4" />
                    {isResendingVerification ? t.resendInProgress : t.resend}
                  </button>
                  {!pendingVerificationLogin.includes('@') && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-200/80">
                      {t.resendNeedsEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#3390ec] py-3 font-semibold text-white transition hover:bg-[#2c83d9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? t.submitting : t.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500 dark:text-slate-400">
          {t.noAccount}{' '}
          <Link to="/register" className="font-semibold text-[#3390ec] transition hover:text-[#2c83d9]">
            {t.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
