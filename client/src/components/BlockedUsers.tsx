import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Unlock, UserX, X } from 'lucide-react';
import { monitoredApi } from '../utils/monitoredApi';
import { getMediaUrl } from '../utils/helpers';

interface BlockedUser {
  id: string;
  blocked: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    bio: string;
  };
  createdAt: string;
}

interface BlockedUsersProps {
  onClose: () => void;
}

const BlockedUsers: React.FC<BlockedUsersProps> = ({ onClose }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await monitoredApi.get('/block');
      setBlockedUsers(response.data.blockedUsers || response.data);
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
      toast.error('Не удалось загрузить заблокированных пользователей');
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      await monitoredApi.delete(`/block/${userId}`);
      toast.success('Пользователь разблокирован');
      setBlockedUsers((current) => current.filter((item) => item.blocked.id !== userId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
      toast.error('Не удалось разблокировать пользователя');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#24323d] dark:bg-[#17212b]">
        <div className="sticky top-0 border-b border-slate-200 bg-white p-4 dark:border-[#24323d] dark:bg-[#17212b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Заблокированные пользователи
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#202b36] dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">Загрузка...</div>
          ) : blockedUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              <UserX className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>Нет заблокированных пользователей</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((blockedUser) => (
                <div
                  key={blockedUser.id}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-[#202b36]"
                >
                  <img
                    src={
                      getMediaUrl(blockedUser.blocked.avatar) ||
                      `https://ui-avatars.com/api/?name=${blockedUser.blocked.username}&background=random`
                    }
                    alt={blockedUser.blocked.displayName || blockedUser.blocked.username}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-slate-900 dark:text-white">
                      {blockedUser.blocked.displayName || blockedUser.blocked.username}
                    </h3>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      @{blockedUser.blocked.username}
                    </p>
                  </div>
                  <button
                    onClick={() => void unblockUser(blockedUser.blocked.id)}
                    className="flex items-center gap-1 rounded-xl bg-[#3390ec] px-3 py-2 text-white transition hover:bg-[#2b7fd1]"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Разблокировать</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockedUsers;
