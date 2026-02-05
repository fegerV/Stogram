import React, { useState, useEffect } from 'react';
import { UserX, Unlock } from 'lucide-react';
import { monitoredApi } from '../utils/monitoredApi';
import { getMediaUrl } from '../utils/helpers';
import toast from 'react-hot-toast';

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
    fetchBlockedUsers();
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
      setBlockedUsers(blockedUsers.filter(b => b.blocked.id !== userId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
      toast.error('Не удалось разблокировать пользователя');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold dark:text-white">Заблокированные пользователи</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Загрузка...
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <UserX className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Нет заблокированных пользователей</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((blockedUser) => (
                <div
                  key={blockedUser.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <img
                    src={getMediaUrl(blockedUser.blocked.avatar) || `https://ui-avatars.com/api/?name=${blockedUser.blocked.username}&background=random`}
                    alt={blockedUser.blocked.displayName || blockedUser.blocked.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium dark:text-white truncate">
                      {blockedUser.blocked.displayName || blockedUser.blocked.username}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      @{blockedUser.blocked.username}
                    </p>
                  </div>
                  <button
                    onClick={() => unblockUser(blockedUser.blocked.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Unlock className="w-4 h-4" />
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
