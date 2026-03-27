import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const { login: loginUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!login || !password) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      await loginUser(login, password);
      toast.success('С возвращением!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось войти');
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

        <h1 className="mb-2 text-center text-4xl font-bold text-slate-900 dark:text-white">Добро пожаловать</h1>
        <p className="mb-8 text-center text-slate-500 dark:text-slate-400">
          Войдите в Stogram и продолжите переписку
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email или username</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Введите email или username"
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
                placeholder="Введите пароль"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#3390ec] py-3 font-semibold text-white transition hover:bg-[#2c83d9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500 dark:text-slate-400">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-[#3390ec] transition hover:text-[#2c83d9]">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
