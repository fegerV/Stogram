import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Gift,
  Link as LinkIcon,
  MessageCircle,
  Phone,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../services/api';
import { Chat, ChatType, Contact, User, UserStatus } from '../types';
import { formatLastSeen, getChatAvatar, getChatName, getInitials, getMediaUrl } from '../utils/helpers';

interface ChatProfileDrawerProps {
  chat: Chat;
  currentUserId: string;
  onClose: () => void;
  onStartCall?: (type: 'AUDIO' | 'VIDEO') => void;
  variant?: 'overlay' | 'docked';
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-soft flex items-center justify-between rounded-[22px] px-4 py-3">
      <span className="text-sm text-[#8fa3b8]">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  label,
  accentClass,
  onClick,
}: {
  icon: typeof MessageCircle;
  label: string;
  accentClass: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="panel-soft rounded-[22px] px-3 py-3 text-sm font-medium text-white transition hover:bg-white/10"
    >
      <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${accentClass}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      {label}
    </button>
  );
}

export default function ChatProfileDrawer({
  chat,
  currentUserId,
  onClose,
  onStartCall,
  variant = 'overlay',
}: ChatProfileDrawerProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(chat.type === ChatType.PRIVATE);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(chat.type === ChatType.PRIVATE);
  const [isMutatingContact, setIsMutatingContact] = useState(false);

  const isDocked = variant === 'docked';
  const otherMember = useMemo(
    () => chat.members.find((member) => member.userId !== currentUserId)?.user || null,
    [chat, currentUserId],
  );

  const profileUserId = otherMember?.id || null;
  const profileAvatar = chat.type === ChatType.PRIVATE ? getChatAvatar(chat, currentUserId) : getMediaUrl(chat.avatar);
  const title = getChatName(chat, currentUserId);
  const photoCount = chat.messages?.filter((message) => message.type === 'IMAGE').length ?? 0;
  const videoCount = chat.messages?.filter((message) => message.type === 'VIDEO').length ?? 0;
  const audioCount = chat.messages?.filter((message) => message.type === 'AUDIO' || message.type === 'VOICE').length ?? 0;
  const fileCount = chat.messages?.filter((message) => Boolean(message.fileUrl)).length ?? 0;

  const subtitle = (() => {
    if (chat.type === ChatType.PRIVATE) {
      const source = profile || otherMember;
      if (!source) return 'Профиль недоступен';
      if (source.status === UserStatus.ONLINE) return 'в сети';
      if (source.lastSeen) return `был(а) ${formatLastSeen(source.lastSeen)}`;
      return source.username ? `@${source.username}` : 'Пользователь';
    }

    if (chat.type === ChatType.GROUP) return `${chat.members.length} участников`;
    return 'Канал';
  })();

  const description =
    chat.type === ChatType.PRIVATE
      ? profile?.bio || otherMember?.bio || 'Пользователь пока ничего не рассказал о себе.'
      : chat.description || 'Описание пока не добавлено.';

  const contactRecord = useMemo(
    () => contacts.find((item) => item.contactId === profileUserId),
    [contacts, profileUserId],
  );

  useEffect(() => {
    if (chat.type !== ChatType.PRIVATE || !profileUserId) {
      setProfile(null);
      setIsLoadingProfile(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await userApi.getById(profileUserId);
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to load interlocutor profile:', error);
        toast.error('Не удалось загрузить профиль пользователя');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [chat.type, profileUserId]);

  useEffect(() => {
    if (chat.type !== ChatType.PRIVATE) {
      setContacts([]);
      setIsLoadingContacts(false);
      return;
    }

    const loadContacts = async () => {
      setIsLoadingContacts(true);
      try {
        const response = await userApi.getContacts();
        setContacts(response.data || []);
      } catch (error) {
        console.error('Failed to load contacts for profile drawer:', error);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    loadContacts();
  }, [chat.type]);

  const handleAddContact = async () => {
    if (!profileUserId) return;

    setIsMutatingContact(true);
    try {
      const response = await userApi.addContact({ contactId: profileUserId });
      setContacts((prev) => [response.data, ...prev]);
      toast.success('Пользователь добавлен в контакты');
    } catch (error: any) {
      console.error('Failed to add contact from profile drawer:', error);
      toast.error(error?.response?.data?.error || 'Не удалось добавить контакт');
    } finally {
      setIsMutatingContact(false);
    }
  };

  const handleRemoveContact = async () => {
    if (!profileUserId) return;

    setIsMutatingContact(true);
    try {
      await userApi.removeContact(profileUserId);
      setContacts((prev) => prev.filter((item) => item.contactId !== profileUserId));
      toast.success('Контакт удален');
    } catch (error: any) {
      console.error('Failed to remove contact from profile drawer:', error);
      toast.error(error?.response?.data?.error || 'Не удалось удалить контакт');
    } finally {
      setIsMutatingContact(false);
    }
  };

  const statusLabel =
    isLoadingProfile
      ? 'Загрузка...'
      : profile?.status === UserStatus.ONLINE || otherMember?.status === UserStatus.ONLINE
        ? 'В сети'
        : profile?.lastSeen
          ? `Был(а) ${formatLastSeen(profile.lastSeen)}`
          : otherMember?.lastSeen
            ? `Был(а) ${formatLastSeen(otherMember.lastSeen)}`
            : 'Не в сети';

  const panel = (
    <div
      className={`flex h-full flex-col text-white ${
        isDocked ? 'w-full border-l border-white/8 bg-[linear-gradient(180deg,rgba(13,23,34,0.96),rgba(10,18,28,0.98))]' : 'animate-sheet-right w-full panel-glass-strong sm:max-w-[400px]'
      }`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3.5">
        <div className="flex items-center gap-2">
          {!isDocked && (
            <button onClick={onClose} className="panel-soft rounded-full p-2 transition hover:bg-white/10 sm:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <p className="text-[17px] font-semibold">Информация</p>
            <p className="text-xs text-[#7f96ab]">Профиль, ссылки и быстрые действия</p>
          </div>
        </div>
        <button onClick={onClose} className="panel-soft rounded-full p-2 transition hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(30,49,69,0.88),rgba(17,29,42,0.92))] px-6 py-8 text-center">
          <div className="mx-auto flex w-full max-w-[240px] flex-col items-center">
            {profileAvatar ? (
              <img src={profileAvatar} alt={title} className="h-28 w-28 rounded-full object-cover ring-4 ring-white/10 shadow-[0_22px_50px_rgba(7,17,27,0.3)]" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] text-4xl font-semibold text-white shadow-[0_22px_50px_rgba(47,140,255,0.3)]">
                {getInitials(title)}
              </div>
            )}
            <h2 className="mt-4 text-[24px] font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-[#90a8bc]">{subtitle}</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <ActionCard icon={Bell} label="Звук" accentClass="bg-[#506074]" />
            <ActionCard icon={MessageCircle} label="Общение" accentClass="bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)]" />
            <ActionCard icon={Gift} label="Подарок" accentClass="bg-[linear-gradient(135deg,#8d6bff,#bb86fc)]" />
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="panel-soft rounded-[28px] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#6bb3ff]">
              <LinkIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {chat.type === ChatType.PRIVATE && profile?.username ? `t.me/${profile.username}` : 'Ссылка и описание'}
              </span>
            </div>
            <p className="text-sm leading-6 text-[#d7e3ec]">{isLoadingProfile ? 'Загрузка...' : description}</p>
          </div>

          {chat.type === ChatType.PRIVATE && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <ActionCard icon={MessageCircle} label="Написать" accentClass="bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)]" />
                <ActionCard icon={Phone} label="Звонок" accentClass="bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)]" onClick={() => onStartCall?.('AUDIO')} />
                <ActionCard icon={Video} label="Видео" accentClass="bg-[linear-gradient(135deg,#33b36b,#1c9b5f)]" onClick={() => onStartCall?.('VIDEO')} />
              </div>

              <div className="panel-soft rounded-[28px] p-4">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#7f96ab]">Профиль</p>
                <div className="space-y-3">
                  <StatRow
                    label="Username"
                    value={isLoadingProfile ? 'Загрузка...' : profile?.username ? `@${profile.username}` : 'Не указан'}
                  />
                  <StatRow label="Статус" value={statusLabel} />
                </div>
              </div>

              <div className="panel-soft rounded-[28px] p-4">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#7f96ab]">Контакты</p>
                {isLoadingContacts ? (
                  <p className="text-sm text-[#8fa3b8]">Проверяем список контактов...</p>
                ) : contactRecord ? (
                  <button
                    onClick={handleRemoveContact}
                    disabled={isMutatingContact}
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-900/25 px-4 py-3 text-sm font-medium text-[#ff8d8d] disabled:opacity-60"
                  >
                    <UserPlus className="h-4 w-4" />
                    Удалить из контактов
                  </button>
                ) : (
                  <button
                    onClick={handleAddContact}
                    disabled={isMutatingContact}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <UserPlus className="h-4 w-4" />
                    Добавить в контакты
                  </button>
                )}
              </div>
            </>
          )}

          {chat.type !== ChatType.PRIVATE && (
            <>
              <div className="panel-soft rounded-[28px] p-4">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#7f96ab]">О чате</p>
                <div className="space-y-3">
                  <StatRow label="Тип" value={chat.type === ChatType.GROUP ? 'Группа' : 'Канал'} />
                  <StatRow label="Участники" value={`${chat.members.length}`} />
                </div>
              </div>

              <div className="panel-soft rounded-[28px] p-4">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#7f96ab]">Участники</p>
                <div className="space-y-3">
                  {chat.members.map((member) => {
                    const memberName = member.user.displayName || member.user.username;
                    const memberAvatar = getMediaUrl(member.user.avatar);

                    return (
                      <div key={member.id} className="panel-soft flex items-center gap-3 rounded-[22px] px-3 py-2.5">
                        {memberAvatar ? (
                          <img src={memberAvatar} alt={memberName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] font-semibold text-white">
                            {getInitials(memberName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[15px] text-[#e6edf3]">{memberName}</p>
                          <p className="text-[13px] text-[#8fa3b8]">@{member.user.username}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="panel-soft rounded-[28px] p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#7f96ab]">Медиа</p>
            <div className="space-y-3">
              <StatRow label="Фотографии" value={photoCount.toString()} />
              <StatRow label="Видео" value={videoCount.toString()} />
              <StatRow label="Аудио" value={audioCount.toString()} />
              <StatRow label="Файлы" value={fileCount.toString()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDocked) {
    return panel;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 animate-fade-in" onClick={onClose}>
      {panel}
    </div>
  );
}
