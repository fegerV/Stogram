import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, X, MessageCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from './confirm/ConfirmDialogProvider';
import { userApi } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { Contact, ChatType, User } from '../types';
import { getInitials, getMediaUrl } from '../utils/helpers';

interface ContactsModalProps {
  onClose: () => void;
  onOpenChat: (chatId: string) => void;
}

export default function ContactsModal({ onClose, onOpenChat }: ContactsModalProps) {
  const confirm = useConfirm();
  const { chats, createChat } = useChatStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getContacts();
      setContacts(response.data || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast.error('Не удалось загрузить контакты');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await userApi.search(searchQuery.trim());
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Contact search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const contactIds = useMemo(() => new Set(contacts.map((item) => item.contactId)), [contacts]);

  const handleOpenChat = async (userId: string) => {
    const existingChat = chats.find((chat) => {
      if (chat.type !== ChatType.PRIVATE) return false;
      return chat.members?.some((member) => member.userId === userId);
    });

    if (existingChat) {
      onOpenChat(existingChat.id);
      onClose();
      return;
    }

    try {
      const newChat = await createChat(ChatType.PRIVATE, [userId]);
      onOpenChat(newChat.id);
      onClose();
    } catch (error) {
      console.error('Failed to open chat for contact:', error);
      toast.error('Не удалось открыть чат');
    }
  };

  const handleAddContact = async (user: User) => {
    setIsSaving(true);
    try {
      const response = await userApi.addContact({ contactId: user.id });
      setContacts((prev) => [response.data, ...prev]);
      toast.success('Контакт добавлен');
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Failed to add contact:', error);
      toast.error(error?.response?.data?.error || 'Не удалось добавить контакт');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    const shouldRemove = await confirm({
      title: 'Удалить контакт',
      message: 'Контакт будет удалён из списка, но история сообщений сохранится.',
      confirmText: 'Удалить',
      tone: 'danger',
    });

    if (!shouldRemove) return;

    try {
      await userApi.removeContact(contactId);
      setContacts((prev) => prev.filter((item) => item.contactId !== contactId));
      toast.success('Контакт удалён');
    } catch (error) {
      console.error('Failed to remove contact:', error);
      toast.error('Не удалось удалить контакт');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-[28px] bg-white dark:bg-[#17212b] shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#202c33]">
          <div>
            <h2 className="text-[19px] font-semibold text-[#222] dark:text-white">Контакты</h2>
            <p className="text-sm text-[#8e8e93] dark:text-[#6c7883]">Быстрый доступ к людям, с которыми вы общаетесь</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#202b36]">
            <X className="w-5 h-5 text-[#8e8e93]" />
          </button>
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-[#202c33]">
          <div className="flex items-center gap-3 rounded-2xl bg-[#efeff4] dark:bg-[#202b36] px-4 py-3">
            <Search className="w-5 h-5 text-[#8e8e93]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Найти пользователя и добавить в контакты"
              className="flex-1 bg-transparent text-[15px] text-[#222] dark:text-white placeholder:text-[#8e8e93] focus:outline-none"
            />
          </div>

          {searchQuery.trim().length >= 2 && (
            <div className="mt-4 space-y-2">
              {isSearching ? (
                <p className="text-sm text-[#8e8e93]">Ищем пользователей...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-[#8e8e93]">Совпадений не найдено</p>
              ) : (
                searchResults.map((result) => {
                  const isContact = contactIds.has(result.id);

                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 rounded-2xl bg-[#f7f8fa] dark:bg-[#202b36] px-4 py-3"
                    >
                      {result.avatar ? (
                        <img src={getMediaUrl(result.avatar || undefined) ?? undefined} alt={result.displayName || result.username} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#3390ec] flex items-center justify-center text-white font-semibold">
                          {getInitials(result.displayName || result.username)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-[#222] dark:text-[#e1e1e1] truncate">
                          {result.displayName || result.username}
                        </p>
                        <p className="text-[13px] text-[#8e8e93] truncate">@{result.username}</p>
                      </div>
                      <button
                        onClick={() => handleAddContact(result)}
                        disabled={isContact || isSaving}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#3390ec] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <UserPlus className="w-4 h-4" />
                        {isContact ? 'Уже в контактах' : 'Добавить'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3390ec]" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-12 text-center text-[#8e8e93]">
              <p className="text-[15px]">Контактов пока нет</p>
              <p className="mt-1 text-[13px]">Добавьте пользователей через поиск выше.</p>
            </div>
          ) : (
            contacts.map((item) => {
              const profile = item.contact;
              const title = item.nickname || profile.displayName || profile.username;

              return (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-[#f7f8fa] dark:bg-[#202b36] px-4 py-3">
                  {profile.avatar ? (
                    <img src={getMediaUrl(profile.avatar || undefined) ?? undefined} alt={title} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#3390ec] flex items-center justify-center text-white font-semibold">
                      {getInitials(title)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-[#222] dark:text-[#e1e1e1] truncate">{title}</p>
                    <p className="text-[13px] text-[#8e8e93] truncate">@{profile.username}</p>
                  </div>
                  <button
                    onClick={() => handleOpenChat(profile.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#3390ec] px-3 py-2 text-sm font-medium text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Написать
                  </button>
                  <button
                    onClick={() => handleRemoveContact(item.contactId)}
                    className="rounded-xl p-2 text-[#ef5350] hover:bg-red-50 dark:hover:bg-red-900/10"
                    aria-label="Удалить контакт"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
