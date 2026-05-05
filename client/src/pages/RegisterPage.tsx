import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, MessageCircle, Sparkles, User, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import { useAuthStore } from '../store/authStore';

function AuthHint({ label }: { label: string }) {
  return (
    <div className="panel-soft rounded-full px-3 py-2 text-xs font-medium text-[#d7ebff]">
      {label}
    </div>
  );
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !username || !password || !confirmPassword) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      toast.error('Имя пользователя должно содержать от 3 до 30 символов: буквы, цифры или _');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (password.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }

    try {
      const response = await register(email, username, password, displayName || undefined);
      toast.success(response?.message || 'Аккаунт создан. Проверьте почту для подтверждения.');
      navigate(`/verify-email?pending=1&email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось зарегистрироваться');
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="floating-orb left-[-90px] top-[-80px] h-72 w-72 bg-[#4ba3ff]/20" />
      <div className="floating-orb bottom-[-120px] right-[-80px] h-80 w-80 bg-[#61d394]/10" />

      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel-glass-strong relative w-full rounded-[36px] p-6 shadow-[0_28px_80px_rgba(3,9,17,0.42)] md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] text-white shadow-[0_16px_38px_rgba(47,140,255,0.35)]">
                <MessageCircle className="h-6 w-6" />
              </div>
            </div>
            <ThemeToggle />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white">Создать аккаунт</h1>
          <p className="mt-2 text-sm leading-6 text-[#9cb4ca]">
            Подключайтесь к Stogram и открывайте переписку в красивом PWA-интерфейсе с мобильным ритмом и быстрым доступом к чатам.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8ebff]">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f9bb5]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-4 text-white transition placeholder:text-[#7f9bb5] focus:border-[#4ba3ff]/40 focus:outline-none focus:ring-2 focus:ring-[#4ba3ff]/30"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8ebff]">Имя пользователя</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f9bb5]" />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-4 text-white transition placeholder:text-[#7f9bb5] focus:border-[#4ba3ff]/40 focus:outline-none focus:ring-2 focus:ring-[#4ba3ff]/30"
                  placeholder="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8ebff]">Отображаемое имя</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f9bb5]" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-4 text-white transition placeholder:text-[#7f9bb5] focus:border-[#4ba3ff]/40 focus:outline-none focus:ring-2 focus:ring-[#4ba3ff]/30"
                  placeholder="Как вас показывать в Stogram"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8ebff]">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f9bb5]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-[24px] border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-4 text-white transition placeholder:text-[#7f9bb5] focus:border-[#4ba3ff]/40 focus:outline-none focus:ring-2 focus:ring-[#4ba3ff]/30"
                    placeholder="Минимум 8 символов"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8ebff]">Подтвердите пароль</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f9bb5]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-[24px] border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-4 text-white transition placeholder:text-[#7f9bb5] focus:border-[#4ba3ff]/40 focus:outline-none focus:ring-2 focus:ring-[#4ba3ff]/30"
                    placeholder="Повторите пароль"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-[24px] bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] py-3.5 font-semibold text-white shadow-[0_18px_45px_rgba(47,140,255,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Создаем аккаунт...' : 'Создать аккаунт'}
            </button>
          </form>

          <p className="mt-6 text-center text-[#9cb4ca]">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-semibold text-[#84c2ff] transition hover:text-white">
              Войти
            </Link>
          </p>
        </div>

        <div className="panel-glass-strong hidden min-h-[720px] flex-col justify-between rounded-[36px] p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] shadow-[0_16px_38px_rgba(47,140,255,0.35)]">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#8da4bb]">New account</p>
                <h2 className="text-3xl font-semibold tracking-tight">Вход в приложение должен ощущаться легко и ясно</h2>
              </div>
            </div>

            <p className="mt-8 max-w-xl text-base leading-7 text-[#a5bfd5]">
              После регистрации пользователь сразу попадает в современный интерфейс с папками, быстрым поиском и установкой как PWA.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <AuthHint label="Telegram-like layout" />
              <AuthHint label="Чистый мобильный ритм" />
              <AuthHint label="Готово к установке как приложение" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel-soft rounded-[28px] p-5">
              <p className="text-sm font-semibold text-white">Быстрый старт</p>
              <p className="mt-2 text-sm leading-6 text-[#9cb4ca]">
                Регистрация укладывается в один экран и не перегружает пользователя лишними шагами.
              </p>
            </div>
            <div className="panel-soft rounded-[28px] p-5">
              <p className="text-sm font-semibold text-white">Готово к росту</p>
              <p className="mt-2 text-sm leading-6 text-[#9cb4ca]">
                После входа уже доступны чаты, папки, закрепы, уведомления и дальнейшая PWA-полировка.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
