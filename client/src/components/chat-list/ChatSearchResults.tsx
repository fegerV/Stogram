import { Search } from 'lucide-react';
import { getInitials, getMediaUrl } from '../../utils/helpers';
import { User } from '../../types';

interface ChatSearchResultsProps {
  searchQuery: string;
  isSearchingUsers: boolean;
  searchResults: User[];
  onCreateChat: (user: User) => void;
}

export function ChatSearchResults({
  searchQuery,
  isSearchingUsers,
  searchResults,
  onCreateChat,
}: ChatSearchResultsProps) {
  if (searchQuery.trim().length < 2) {
    return null;
  }

  return (
    <div className="border-b border-white/8 bg-white/[0.02]">
      {isSearchingUsers ? (
        <div className="flex items-center justify-center py-8 text-[#7f96ab]">
          <Search className="mr-2 h-5 w-5 animate-pulse" />
          <span className="text-sm">Ищем пользователей…</span>
        </div>
      ) : searchResults.length > 0 ? (
        <div>
          <div className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#7f96ab]">
            Пользователи
          </div>
          {searchResults.map((searchUser) => {
            const userAvatar = getMediaUrl(searchUser.avatar);
            const userName = searchUser.displayName || searchUser.username;

            return (
              <div
                key={searchUser.id}
                role="button"
                tabIndex={0}
                onClick={() => onCreateChat(searchUser)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    onCreateChat(searchUser);
                  }
                }}
                className="mx-2 my-1 flex cursor-pointer items-center gap-3 rounded-[24px] px-4 py-3 transition-colors hover:bg-white/[0.05] active:bg-white/[0.08]"
              >
                <div className="relative flex-shrink-0">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-[54px] w-[54px] rounded-full object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] text-base font-medium text-white shadow-[0_12px_28px_rgba(10,17,28,0.22)]">
                      {getInitials(userName)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 py-1.5">
                  <div className="mb-0.5 flex items-center justify-between">
                    <h3 className="truncate text-[15px] font-semibold text-white">{userName}</h3>
                  </div>
                  {searchUser.bio && <p className="truncate text-[14px] text-[#8fa3b8]">{searchUser.bio}</p>}
                  {searchUser.username && (
                    <p className="truncate text-[13px] text-[#78bcff]">@{searchUser.username}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-[#7f96ab]">
          <div className="panel-soft mb-3 flex h-14 w-14 items-center justify-center rounded-[20px]">
            <Search className="h-7 w-7 opacity-60" />
          </div>
          <p className="text-sm">Пользователи не найдены</p>
        </div>
      )}
    </div>
  );
}
