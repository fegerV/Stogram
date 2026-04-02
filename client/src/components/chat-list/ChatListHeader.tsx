import { Menu as MenuIcon, Search } from 'lucide-react';
import type { ChatFilter, FolderOption } from './useChatListData';

interface ChatListHeaderProps {
  isSearchOpen: boolean;
  searchQuery: string;
  activeFilter: ChatFilter;
  filters: Array<{ id: ChatFilter; label: string; count?: number }>;
  folders: FolderOption[];
  selectedFolderId: string | null;
  folderChatCounts: Map<string, number>;
  onOpenMenu: () => void;
  onToggleSearch: () => void;
  onSearchChange: (value: string) => void;
  onSearchBlur: () => void;
  onFilterChange: (filter: ChatFilter) => void;
  onFolderChange: (folderId: string | null) => void;
}

export function ChatListHeader({
  isSearchOpen,
  searchQuery,
  activeFilter,
  filters,
  folders,
  selectedFolderId,
  folderChatCounts,
  onOpenMenu,
  onToggleSearch,
  onSearchChange,
  onSearchBlur,
  onFilterChange,
  onFolderChange,
}: ChatListHeaderProps) {
  return (
    <div className="border-b border-[#1c2b38] bg-[#17232e] text-white">
      <div className="flex h-16 items-center gap-2 px-3">
        <div className="min-w-0 flex-shrink-0 px-2">
          <h1 className="truncate text-[20px] font-semibold tracking-tight">Stogram</h1>
        </div>

        {isSearchOpen ? (
          <div className="flex-1 rounded-2xl bg-white/8 px-4 py-2">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Поиск"
              className="w-full bg-transparent py-1 text-[15px] text-white placeholder-white/45 focus:outline-none"
              onBlur={onSearchBlur}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSearch}
            className="rounded-full p-2.5 transition hover:bg-white/10"
            aria-label="Поиск"
          >
            <Search className="h-[22px] w-[22px]" />
          </button>

          <button
            onClick={onOpenMenu}
            className="rounded-full p-2.5 transition hover:bg-white/10"
            aria-label="Открыть меню"
          >
            <MenuIcon className="h-[22px] w-[22px]" />
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-t border-white/5 px-2 pb-2 scrollbar-none">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-2xl px-4 py-2.5 text-[13px] font-medium transition-colors ${
              activeFilter === filter.id
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <span>{filter.label}</span>
            {filter.count !== undefined && filter.count > 0 && (
              <span
                className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                  activeFilter === filter.id
                    ? 'bg-white text-[#517da2] dark:text-[#17212b]'
                    : 'bg-white/30 text-white'
                }`}
              >
                {filter.count}
              </span>
            )}
            {activeFilter === filter.id && (
              <div className="absolute bottom-1 left-4 right-4 h-[2px] rounded-full bg-[#5fb3ff]" />
            )}
          </button>
        ))}
      </div>

      {folders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-white/5 px-3 pb-3 pt-2 scrollbar-none md:hidden">
          <button
            onClick={() => onFolderChange(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
              selectedFolderId === null
                ? 'bg-white text-[#517da2] dark:text-[#17212b]'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            Все папки
          </button>
          {folders.map((folder) => {
            const count = folderChatCounts.get(folder.id) ?? 0;

            return (
              <button
                key={folder.id}
                onClick={() => onFolderChange(folder.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                  selectedFolderId === folder.id
                    ? 'text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
                style={selectedFolderId === folder.id ? { backgroundColor: folder.color || '#3390ec' } : undefined}
              >
                {folder.name}
                {count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
