import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, MessageCircle, User, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import { useAuthStore } from '../store/authStore';

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-slate-900 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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

        <h1 className="mb-2 text-center text-4xl font-bold text-slate-900 dark:text-white">Создать аккаунт</h1>
        <p className="mb-8 text-center text-slate-500 dark:text-slate-400">
          Присоединяйтесь к Stogram и начните общаться
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Имя пользователя
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder="username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Отображаемое имя
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Как вас показывать в Stogram"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Минимум 8 символов"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Подтвердите пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Повторите пароль"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#3390ec] py-3 font-semibold text-white transition hover:bg-[#2c83d9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500 dark:text-slate-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-[#3390ec] transition hover:text-[#2c83d9]">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
