import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type SettingsLocale = 'ru' | 'en';

type TranslationValue = string | ((params?: Record<string, string | number>) => string);

type SettingsI18nContextValue = {
  locale: SettingsLocale;
  setLocale: (locale: SettingsLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const STORAGE_KEY = 'stogram-settings-locale';

const translations: Record<SettingsLocale, Record<string, TranslationValue>> = {
  ru: {
    'settings.title': 'Настройки',
    'settings.close': 'Закрыть',
    'settings.closeFull': 'Закрыть настройки',
    'settings.search': 'Поиск',
    'settings.account': 'Аккаунт',
    'settings.general': 'Настройки',
    'settings.email': 'Email',
    'settings.username': 'Имя пользователя',
    'settings.about': 'О себе',
    'settings.aboutPlaceholder': 'Напишите немного о себе',
    'settings.save': 'Сохранить',
    'settings.saving': 'Сохранение...',
    'settings.language': 'Язык',
    'settings.languageDescription': 'Интерфейс раздела настроек',
    'settings.languageValueRu': 'Русский',
    'settings.languageValueEn': 'English',
    'settings.securitySubtitle': '2FA, пароль',
    'settings.loading': 'Загрузка...',
    'settings.internalBots': 'Встроенные',
    'settings.folderNew': 'Новая папка',
    'settings.folderEdit': 'Изменить папку',
    'settings.folderName': 'Название',
    'settings.folderNamePlaceholder': 'Например, Работа',
    'settings.folderColor': 'Цвет',
    'settings.folderSave': 'Сохранить',
    'settings.section.myAccount': 'Мой аккаунт',
    'settings.section.myAccountSubtitle': 'Профиль и основная информация',
    'settings.section.notifications': 'Уведомления и звуки',
    'settings.section.privacy': 'Конфиденциальность',
    'settings.section.chatSettings': 'Настройки чатов',
    'settings.section.folders': 'Папки с чатами',
    'settings.section.appearance': 'Внешний вид',
    'settings.section.security': 'Безопасность',
    'settings.section.sessions': 'Активные сеансы',
    'settings.section.data': 'Данные и память',
    'settings.section.bots': 'Боты и интеграции',
    'settings.section.language': 'Язык',
    'settings.privacy.group': 'Приватность',
    'settings.privacy.online': 'Показывать статус онлайн',
    'settings.privacy.onlineDesc': 'Другие видят, когда вы в сети',
    'settings.privacy.lastSeen': 'Время последнего посещения',
    'settings.privacy.lastSeenDesc': 'Когда вы были онлайн',
    'settings.privacy.photo': 'Фото профиля',
    'settings.privacy.photoDesc': 'Видимость для других',
    'settings.notifications.group': 'Уведомления',
    'settings.notifications.push': 'Push-уведомления',
    'settings.notifications.pushDesc': 'Получать уведомления о сообщениях',
    'settings.notifications.email': 'Email-уведомления',
    'settings.notifications.sound': 'Звук',
    'settings.notifications.soundDesc': 'Звук при новом сообщении',
    'settings.notifications.vibration': 'Вибрация',
    'settings.appearance.theme': 'Тема',
    'settings.appearance.light': 'Светлая',
    'settings.appearance.dark': 'Тёмная',
    'settings.appearance.system': 'Авто',
    'settings.appearance.changed': 'Тема изменена',
    'settings.appearance.error': 'Ошибка',
    'settings.security.2fa': 'Двухфакторная аутентификация',
    'settings.security.status': 'Статус',
    'settings.security.enabled': 'Включена',
    'settings.security.disabled': 'Отключена',
    'settings.security.enable': 'Включить',
    'settings.security.disable': 'Отключить',
    'settings.security.changePassword': 'Изменить пароль',
    'settings.security.currentPassword': 'Текущий пароль',
    'settings.security.newPassword': 'Новый пароль',
    'settings.security.confirmPassword': 'Подтвердите пароль',
    'settings.security.submit': 'Изменить пароль',
    'settings.sessions.empty': 'Нет активных сеансов',
    'settings.sessions.revokeAll': 'Завершить все другие сеансы',
    'settings.sessions.device': 'Устройство',
    'settings.sessions.current': 'Текущий',
    'settings.data.totalUsage': 'Общее использование',
    'settings.data.messages': 'Сообщения',
    'settings.data.media': 'Медиа',
    'settings.data.contacts': 'Контакты',
    'settings.data.chats': 'Чаты',
    'settings.data.clearCache': 'Очистить кэш',
    'settings.data.export': 'Экспорт данных',
    'settings.data.import': 'Импорт данных',
    'settings.folders.create': 'Создать папку',
    'settings.folders.empty': 'Папок пока нет',
    'settings.folders.emptyDesc': 'Создайте первую папку, чтобы группировать чаты.',
    'settings.folders.chatCount': (params) => `${params?.count ?? 0} чатов`,
    'settings.folders.edit': 'Редактировать папку',
    'settings.folders.delete': 'Удалить папку',
    'settings.folders.unnamed': 'Без названия',
    'settings.chat.organization': 'Организация',
    'settings.chat.folders': 'Папки с чатами',
    'settings.chat.foldersDesc': 'Создание, изменение и удаление папок',
    'settings.chat.archived': 'Архивированные чаты',
    'settings.chat.archivedDesc': 'Открыть архив и вернуть чаты обратно',
    'settings.chat.blocked': 'Заблокированные пользователи',
    'settings.chat.blockedDesc': 'Просмотр и разблокировка',
    'settings.chat.quick': 'Быстрые параметры',
    'settings.chat.sound': 'Звук уведомлений',
    'settings.chat.soundDesc': 'Проигрывать звук для новых сообщений',
    'settings.chat.vibration': 'Вибрация',
    'settings.chat.vibrationDesc': 'Использовать вибрацию для уведомлений',
    'settings.chat.push': 'Push-уведомления',
    'settings.chat.pushDesc': 'Получать уведомления о новых сообщениях',
  },
  en: {
    'settings.title': 'Settings',
    'settings.close': 'Close',
    'settings.closeFull': 'Close settings',
    'settings.search': 'Search',
    'settings.account': 'Account',
    'settings.general': 'Settings',
    'settings.email': 'Email',
    'settings.username': 'Username',
    'settings.about': 'About',
    'settings.aboutPlaceholder': 'Write something about yourself',
    'settings.save': 'Save',
    'settings.saving': 'Saving...',
    'settings.language': 'Language',
    'settings.languageDescription': 'Settings panel interface language',
    'settings.languageValueRu': 'Russian',
    'settings.languageValueEn': 'English',
    'settings.securitySubtitle': '2FA, password',
    'settings.loading': 'Loading...',
    'settings.internalBots': 'Internal',
    'settings.folderNew': 'New Folder',
    'settings.folderEdit': 'Edit Folder',
    'settings.folderName': 'Name',
    'settings.folderNamePlaceholder': 'For example, Work',
    'settings.folderColor': 'Color',
    'settings.folderSave': 'Save',
    'settings.section.myAccount': 'My Account',
    'settings.section.myAccountSubtitle': 'Profile and basic info',
    'settings.section.notifications': 'Notifications and Sounds',
    'settings.section.privacy': 'Privacy',
    'settings.section.chatSettings': 'Chat Settings',
    'settings.section.folders': 'Chat Folders',
    'settings.section.appearance': 'Appearance',
    'settings.section.security': 'Security',
    'settings.section.sessions': 'Active Sessions',
    'settings.section.data': 'Data and Storage',
    'settings.section.bots': 'Bots and Integrations',
    'settings.section.language': 'Language',
    'settings.privacy.group': 'Privacy',
    'settings.privacy.online': 'Show online status',
    'settings.privacy.onlineDesc': 'Let others see when you are online',
    'settings.privacy.lastSeen': 'Last seen time',
    'settings.privacy.lastSeenDesc': 'Show when you were last online',
    'settings.privacy.photo': 'Profile photo',
    'settings.privacy.photoDesc': 'Visibility for other users',
    'settings.notifications.group': 'Notifications',
    'settings.notifications.push': 'Push notifications',
    'settings.notifications.pushDesc': 'Receive message notifications',
    'settings.notifications.email': 'Email notifications',
    'settings.notifications.sound': 'Sound',
    'settings.notifications.soundDesc': 'Play a sound for new messages',
    'settings.notifications.vibration': 'Vibration',
    'settings.appearance.theme': 'Theme',
    'settings.appearance.light': 'Light',
    'settings.appearance.dark': 'Dark',
    'settings.appearance.system': 'System',
    'settings.appearance.changed': 'Theme updated',
    'settings.appearance.error': 'Error',
    'settings.security.2fa': 'Two-factor authentication',
    'settings.security.status': 'Status',
    'settings.security.enabled': 'Enabled',
    'settings.security.disabled': 'Disabled',
    'settings.security.enable': 'Enable',
    'settings.security.disable': 'Disable',
    'settings.security.changePassword': 'Change password',
    'settings.security.currentPassword': 'Current password',
    'settings.security.newPassword': 'New password',
    'settings.security.confirmPassword': 'Confirm password',
    'settings.security.submit': 'Change password',
    'settings.sessions.empty': 'No active sessions',
    'settings.sessions.revokeAll': 'Terminate all other sessions',
    'settings.sessions.device': 'Device',
    'settings.sessions.current': 'Current',
    'settings.data.totalUsage': 'Total usage',
    'settings.data.messages': 'Messages',
    'settings.data.media': 'Media',
    'settings.data.contacts': 'Contacts',
    'settings.data.chats': 'Chats',
    'settings.data.clearCache': 'Clear cache',
    'settings.data.export': 'Export data',
    'settings.data.import': 'Import data',
    'settings.folders.create': 'Create folder',
    'settings.folders.empty': 'No folders yet',
    'settings.folders.emptyDesc': 'Create your first folder to organize chats.',
    'settings.folders.chatCount': (params) => `${params?.count ?? 0} chats`,
    'settings.folders.edit': 'Edit folder',
    'settings.folders.delete': 'Delete folder',
    'settings.folders.unnamed': 'Untitled',
    'settings.chat.organization': 'Organization',
    'settings.chat.folders': 'Chat folders',
    'settings.chat.foldersDesc': 'Create, edit and delete folders',
    'settings.chat.archived': 'Archived chats',
    'settings.chat.archivedDesc': 'Open archive and restore chats',
    'settings.chat.blocked': 'Blocked users',
    'settings.chat.blockedDesc': 'Review and unblock users',
    'settings.chat.quick': 'Quick settings',
    'settings.chat.sound': 'Notification sound',
    'settings.chat.soundDesc': 'Play sound for new messages',
    'settings.chat.vibration': 'Vibration',
    'settings.chat.vibrationDesc': 'Use vibration for notifications',
    'settings.chat.push': 'Push notifications',
    'settings.chat.pushDesc': 'Receive notifications for new messages',
  },
};

const SettingsI18nContext = createContext<SettingsI18nContextValue | null>(null);

function resolveInitialLocale(): SettingsLocale {
  if (typeof window === 'undefined') {
    return 'ru';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'ru' || stored === 'en') {
    return stored;
  }
  return 'ru';
}

export function SettingsI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<SettingsLocale>(resolveInitialLocale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<SettingsI18nContextValue>(() => {
    const t = (key: string, params?: Record<string, string | number>) => {
      const entry = translations[locale][key] ?? translations.ru[key] ?? key;
      if (typeof entry === 'function') {
        return entry(params);
      }
      return entry;
    };

    return { locale, setLocale, t };
  }, [locale]);

  return <SettingsI18nContext.Provider value={value}>{children}</SettingsI18nContext.Provider>;
}

export function useSettingsI18n() {
  const context = useContext(SettingsI18nContext);
  if (!context) {
    throw new Error('useSettingsI18n must be used within SettingsI18nProvider');
  }
  return context;
}
