import React, { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface FolderType {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  chatSettings: any[];
}

interface ChatFoldersProps {
  onSelectFolder: (folderId: string | null) => void;
  selectedFolder: string | null;
}

const ChatFolders: React.FC<ChatFoldersProps> = ({ onSelectFolder, selectedFolder }) => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#0088cc');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(response.data.folders);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const createFolder = async () => {
    if (!folderName.trim()) {
      toast.error('Введите название папки');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/folders`,
        { name: folderName, color: folderColor, icon: 'Folder' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Папка создана');
      setFolderName('');
      setFolderColor('#0088cc');
      setShowCreateModal(false);
      fetchFolders();
    } catch (error) {
      toast.error('Не удалось создать папку');
    }
  };

  const updateFolder = async () => {
    if (!editingFolder || !folderName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/folders/${editingFolder.id}`,
        { name: folderName, color: folderColor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Папка обновлена');
      setEditingFolder(null);
      setFolderName('');
      setFolderColor('#0088cc');
      fetchFolders();
    } catch (error) {
      toast.error('Не удалось обновить папку');
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Удалить папку?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Папка удалена');
      if (selectedFolder === folderId) {
        onSelectFolder(null);
      }
      fetchFolders();
    } catch (error) {
      toast.error('Не удалось удалить папку');
    }
  };

  const openEditModal = (folder: FolderType) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <div className="flex items-center gap-2 p-3 overflow-x-auto">
        <button
          onClick={() => onSelectFolder(null)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
            selectedFolder === null
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Все чаты</span>
        </button>

        {folders.map((folder) => (
          <div key={folder.id} className="relative group">
            <button
              onClick={() => onSelectFolder(folder.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedFolder === folder.id
                  ? 'text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={{
                backgroundColor: selectedFolder === folder.id ? folder.color : undefined
              }}
            >
              <Folder className="w-4 h-4" />
              <span>{folder.name}</span>
              {folder.chatSettings.length > 0 && (
                <span className="ml-1 text-xs opacity-75">({folder.chatSettings.length})</span>
              )}
            </button>
            <div className="hidden group-hover:flex absolute top-0 right-0 -mt-1 -mr-1 gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(folder);
                }}
                className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFolder(folder.id);
                }}
                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Новая папка</span>
        </button>
      </div>

      {(showCreateModal || editingFolder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {editingFolder ? 'Редактировать папку' : 'Новая папка'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingFolder(null);
                  setFolderName('');
                  setFolderColor('#0088cc');
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Название
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Введите название..."
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Цвет
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={editingFolder ? updateFolder : createFolder}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingFolder ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingFolder(null);
                    setFolderName('');
                    setFolderColor('#0088cc');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatFolders;
