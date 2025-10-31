import { useState } from 'react';
import { X, Search, Users } from 'lucide-react';
import { userApi } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { User } from '../types';
import { getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

interface NewChatModalProps {
  onClose: () => void;
}

export default function NewChatModal({ onClose }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [chatType, setChatType] = useState<'PRIVATE' | 'GROUP'>('PRIVATE');
  const [groupName, setGroupName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { createChat } = useChatStore();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await userApi.search(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (chatType === 'GROUP' && !groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const memberIds = selectedUsers.map((u) => u.id);
      await createChat(
        chatType,
        memberIds,
        chatType === 'GROUP' ? groupName : undefined
      );
      toast.success('Chat created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to create chat');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setChatType('PRIVATE')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                chatType === 'PRIVATE'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Private
            </button>
            <button
              onClick={() => setChatType('GROUP')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                chatType === 'GROUP'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Group
            </button>
          </div>

          {chatType === 'GROUP' && (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search users..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{user.displayName || user.username}</span>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="hover:bg-primary-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
          {searchResults.map((user) => {
            const isSelected = selectedUsers.find((u) => u.id === user.id);
            
            return (
              <div
                key={user.id}
                onClick={() => toggleUserSelection(user)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                  isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(user.displayName || user.username)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {user.displayName || user.username}
                  </h3>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleCreateChat}
            disabled={selectedUsers.length === 0}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Chat
          </button>
        </div>
      </div>
    </div>
  );
}
