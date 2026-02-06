import React from 'react';

interface TypingIndicatorProps {
  username: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ username }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="font-medium">{username}</span>
      <span>печатает</span>
      <div className="flex gap-1 items-center">
        <span 
          className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" 
          style={{ 
            animationDelay: '0ms',
            animationDuration: '1.4s',
            animationIterationCount: 'infinite'
          }}
        />
        <span 
          className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" 
          style={{ 
            animationDelay: '200ms',
            animationDuration: '1.4s',
            animationIterationCount: 'infinite'
          }}
        />
        <span 
          className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" 
          style={{ 
            animationDelay: '400ms',
            animationDuration: '1.4s',
            animationIterationCount: 'infinite'
          }}
        />
      </div>
    </div>
  );
};
