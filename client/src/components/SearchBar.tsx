import React, { useState } from 'react';
import { AtSign, Hash, Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, type: 'all' | 'hashtag' | 'mention') => void;
  onClose?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'hashtag' | 'mention'>('all');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) onSearch(query, searchType);
  };

  const placeholder =
    searchType === 'hashtag'
      ? 'Поиск по хэштегу'
      : searchType === 'mention'
      ? 'Поиск упоминаний'
      : 'Поиск сообщений';

  return (
    <div className="border-b border-slate-200/70 bg-white/95 p-4 dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setSearchType('all')}
              className={`rounded-xl p-2 transition-colors ${
                searchType === 'all'
                  ? 'bg-[#3390ec] text-white'
                  : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
              title="Все сообщения"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSearchType('hashtag')}
              className={`rounded-xl p-2 transition-colors ${
                searchType === 'hashtag'
                  ? 'bg-[#3390ec] text-white'
                  : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
              title="Хэштеги"
            >
              <Hash className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSearchType('mention')}
              className={`rounded-xl p-2 transition-colors ${
                searchType === 'mention'
                  ? 'bg-[#3390ec] text-white'
                  : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
              title="Упоминания"
            >
              <AtSign className="h-4 w-4" />
            </button>
          </div>
        </form>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
