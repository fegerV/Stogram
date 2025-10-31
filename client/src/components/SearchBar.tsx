import React, { useState } from 'react';
import { Search, Hash, AtSign, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, type: 'all' | 'hashtag' | 'mention') => void;
  onClose?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'hashtag' | 'mention'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, searchType);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700">
      <div className="flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchType === 'hashtag'
                  ? 'Поиск по хэштегу...'
                  : searchType === 'mention'
                  ? 'Поиск упоминаний...'
                  : 'Поиск сообщений...'
              }
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setSearchType('all')}
              className={`p-2 rounded transition-colors ${
                searchType === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Все сообщения"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSearchType('hashtag')}
              className={`p-2 rounded transition-colors ${
                searchType === 'hashtag'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Хэштеги"
            >
              <Hash className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSearchType('mention')}
              className={`p-2 rounded transition-colors ${
                searchType === 'mention'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Упоминания"
            >
              <AtSign className="w-4 h-4" />
            </button>
          </div>
        </form>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
