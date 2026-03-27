import React, { useEffect, useState } from 'react';
import { Edit2, Folder, Plus, Trash2, X } from 'lucide-react';
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

const modalShell =
  'w-full max-w-md rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95';

const ChatFolders: React.FC<ChatFoldersProps> = ({ onSelectFolder, selectedFolder }) => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#3390ec');

  useEffect(() => {
    void fetchFolders();
  }, []);

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingFolder(null);
    setFolderName('');
    setFolderColor('#3390ec');
  };

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/folders`, {
        headers: { Authorization: `Bearer ${token}` },
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
      closeModal();
      void fetchFolders();
    } catch (error) {
      console.error(error);
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
      closeModal();
      void fetchFolders();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось обновить папку');
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!window.confirm('Удалить папку?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Папка удалена');
      if (selectedFolder === folderId) {
        onSelectFolder(null);
      }
      void fetchFolders();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось удалить папку');
    }
  };

  const openEditModal = (folder: FolderType) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
  };

  return (
    <div className="border-b border-slate-200/80 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-center gap-2 overflow-x-auto p-3">
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2 transition ${
            selectedFolder === null
              ? 'bg-[#3390ec] text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <Folder className="h-4 w-4" />
          <span>Все чаты</span>
        </button>

        {folders.map((folder) => (
          <div key={folder.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2 transition ${
                selectedFolder === folder.id
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              style={{ backgroundColor: selectedFolder === folder.id ? folder.color : undefined }}
            >
              <Folder className="h-4 w-4" />
              <span>{folder.name}</span>
              {folder.chatSettings.length > 0 && <span className="ml-1 text-xs opacity-75">({folder.chatSettings.length})</span>}
            </button>

            <div className="absolute right-0 top-0 hidden gap-1 group-hover:flex">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openEditModal(folder);
                }}
                className="rounded-full bg-[#3390ec] p-1 text-white shadow"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void deleteFolder(folder.id);
                }}
                className="rounded-full bg-rose-500 p-1 text-white shadow"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 whitespace-nowrap rounded-2xl bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          <span>Новая папка</span>
        </button>
      </div>

      {(showCreateModal || editingFolder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className={modalShell}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingFolder ? 'Редактировать папку' : 'Новая папка'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Название</label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(event) => setFolderName(event.target.value)}
                  placeholder="Введите название"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Цвет</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={folderColor}
                    onChange={(event) => setFolderColor(event.target.value)}
                    className="h-11 w-12 cursor-pointer rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={folderColor}
                    onChange={(event) => setFolderColor(event.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void (editingFolder ? updateFolder() : createFolder())}
                  className="flex-1 rounded-2xl bg-[#3390ec] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2c83d9]"
                >
                  {editingFolder ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
