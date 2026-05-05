import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, MessageCircle, Send, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import ru from '../i18n/ru';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const t = ru.auth.login;

function AuthFeature({ label }: { label: string }) {
  return (
    <div className="panel-soft rounded-full px-3 py-2 text-xs font-medium text-[#d7ebff]">
      {label}
    </div>
  );
}

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
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="floating-orb left-[-90px] top-[-80px] h-72 w-72 bg-[#4ba3ff]/20" />
      <div className="floating-orb bottom-[-120px] right-[-80px] h-80 w-80 bg-[#61d394]/10" />

      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel-glass-strong hidden min-h-[720px] flex-col justify-between rounded-[36px] p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] shadow-[0_16px_38px_rgba(47,140,255,0.35)]">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#8da4bb]">Stogram</p>
                <h1 className="text-3xl font-semibold tracking-tight">PWA messenger with a Telegram feel</h1>
              </div>
            </div>

            <p className="mt-8 max-w-xl text-base leading-7 text-[#a5bfd5]">
              Быстрые диалоги, стеклянный интерфейс, офлайн-готовность и нативное ощущение на мобильных экранах.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <AuthFeature label="Установка как приложение" />
              <AuthFeature label="Онлайн и офлайн-статусы" />
              <AuthFeature label="Звонки и быстрые чаты" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel-soft rounded-[28px] p-5">
              <p className="text-sm font-semibold text-white">Мгновенный вход</p>
              <p className="mt-2 text-sm leading-6 text-[#9cb4ca]">
                Продолжайте переписку с того же места, даже если установили PWA на другое устройство.
              </p>
            </div>
            <div className="panel-soft rounded-[28px] p-5">
              <div className="flex items-center gap-2 text-[#84c2ff]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-semibold text-white">Безопасность по умолчанию</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#9cb4ca]">
                Подтверждение почты и двухфакторная авторизация уже встроены в поток входа.
              </p>
            </div>
          </div>
        </div>

        <div className="panel-glass-strong relative w-full rounded-[36px] p-6 shadow-[0_28px_80px_rgba(3,9,17,0.42)] md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] text-white shadow-[0_16px_38px_rgba(47,140,255,0.35)]">
                <MessageCircle className="h-6 w-6" />
              </div>
            </div>
            <ThemeToggle />
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white">{t.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#9cb4ca]">{t.subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8ebff]">{t.loginLabel}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f9bb5]" />
                <input
                  type="text"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-4 text-white transition placeholder:text-[#7f9bb5] focus:border-[#4ba3ff]/40 focus:outline-none focus:ring-2 focus:ring-[#4ba3ff]/30"
                  placeholder={t.loginPlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8ebff]">{t.passwordLabel}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f9bb5]" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-4 text-white transition placeholder:text-[#7f9bb5] focus:border-[#4ba3ff]/40 focus:outline-none focus:ring-2 focus:ring-[#4ba3ff]/30"
                  placeholder={t.passwordPlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>

            {requiresTwoFactor ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8ebff]">{t.twoFactorLabel}</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f9bb5]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value.replace(/\s+/g, ''))}
                    className="w-full rounded-[24px] border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-4 text-white transition placeholder:text-[#7f9bb5] focus:border-[#4ba3ff]/40 focus:outline-none focus:ring-2 focus:ring-[#4ba3ff]/30"
                    placeholder="123456"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ) : null}

            {pendingVerificationLogin ? (
              <div className="rounded-[24px] border border-amber-300/20 bg-amber-400/10 p-4 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-100">{t.emailNotVerifiedTitle}</p>
                    <p className="mt-1 text-sm text-amber-50/80">
                      {t.emailNotVerifiedDescription(pendingVerificationLogin)}
                    </p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {isResendingVerification ? t.resendInProgress : t.resend}
                    </button>
                    {!pendingVerificationLogin.includes('@') && (
                      <p className="mt-2 text-xs text-amber-100/80">{t.resendNeedsEmail}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-[24px] bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] py-3.5 font-semibold text-white shadow-[0_18px_45px_rgba(47,140,255,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? t.submitting : t.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-[#9cb4ca]">
            {t.noAccount}{' '}
            <Link to="/register" className="font-semibold text-[#84c2ff] transition hover:text-white">
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
