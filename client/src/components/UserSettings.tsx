import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bot,
  Database,
  FolderOpen,
  Languages,
  MessageCircle,
  Monitor,
  Palette,
  Shield,
  X,
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { usePerformanceMonitor } from '../utils/performance';
import { getMediaUrl } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { LazyBotManager } from './LazyComponents';
import { SettingsSidebar } from './user-settings/SettingsSidebar';
import { SettingsMainHeader } from './user-settings/SettingsMainHeader';
import { Divider, MenuRow, SectionLabel } from './user-settings/SettingsPrimitives';
import { getSettingsNavItems } from './user-settings/settingsNavigation';
import { Folder, SettingsSection } from './user-settings/types';
import { useUserSettingsData } from './user-settings/useUserSettingsData';
import { SettingsI18nProvider, useSettingsI18n } from './user-settings/i18n';

const LazyPrivacySection = lazy(() => import('./user-settings/PrivacySection').then((module) => ({ default: module.PrivacySection })));
const LazyNotificationsSection = lazy(() => import('./user-settings/NotificationsSection').then((module) => ({ default: module.NotificationsSection })));
const LazyAppearanceSection = lazy(() => import('./user-settings/AppearanceSection').then((module) => ({ default: module.AppearanceSection })));
const LazySecuritySection = lazy(() => import('./user-settings/SecuritySection').then((module) => ({ default: module.SecuritySection })));
const LazySessionsSection = lazy(() => import('./user-settings/SessionsSection').then((module) => ({ default: module.SessionsSection })));
const LazyDataSection = lazy(() => import('./user-settings/DataSection').then((module) => ({ default: module.DataSection })));
const LazyFoldersSection = lazy(() => import('./user-settings/FoldersSection').then((module) => ({ default: module.FoldersSection })));
const LazyChatSettingsSection = lazy(() => import('./user-settings/ChatSettingsSection').then((module) => ({ default: module.ChatSettingsSection })));
const LazyLanguageSection = lazy(() => import('./user-settings/LanguageSection').then((module) => ({ default: module.LanguageSection })));
const LazyTwoFactorAuth = lazy(() => import('./TwoFactorAuth'));
const LazyArchivedChats = lazy(() => import('./ArchivedChats').then((module) => ({ default: module.ArchivedChats })));
const LazyBlockedUsers = lazy(() => import('./BlockedUsers'));
const LazyBotSettings = lazy(() => import('../pages/BotSettings'));
const LazyN8nSettings = lazy(() => import('../pages/N8nSettings'));

interface UserSettingsProps {
  onClose: () => void;
}

function UserSettingsContent({ onClose }: UserSettingsProps) {
  const { startRender, trackInteraction } = usePerformanceMonitor('UserSettings');
  const { setUser: setAuthUser } = useAuthStore();
  const { setTheme } = useThemeStore();
  const { t, locale } = useSettingsI18n();

  const [section, setSection] = useState<SettingsSection>('main');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showArchivedChats, setShowArchivedChats] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#3390ec');
  const [integrationTab, setIntegrationTab] = useState<'internal' | 'telegram' | 'n8n'>('internal');
  const [settingsSearch, setSettingsSearch] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    user,
    privacy,
    notifications,
    sessions,
    storageInfo,
    folders,
    loadingSessions,
    loadingStorage,
    loadingFolders,
    securityStatus,
    changePasswordData,
    profileFormData,
    avatarFile,
    avatarPreview,
    savingProfile,
    setChangePasswordData,
    setProfileFormData,
    loadSecurityStatus,
    handlePrivacyChange,
    handleNotificationChange,
    handleAvatarChange,
    handleProfileSave,
    handleChangePassword,
    handleDisable2FA,
    handleRevokeSession,
    handleRevokeAllSessions,
    handleClearCache,
    handleExportData,
    handleImportData,
    resetFolderForm,
    handleSaveFolder,
    handleDeleteFolder,
  } = useUserSettingsData({ section, setAuthUser });

  useEffect(() => {
    startRender();
    trackInteraction('settings_open', 'UserSettings');
  }, [startRender, trackInteraction]);

  const avatarSrc = avatarPreview || getMediaUrl(user?.avatar) || '';
  const displayName = user?.displayName || user?.username || '';
  const isRootSettingsView = section === 'main';

  const settingsNavItems = useMemo(() => getSettingsNavItems(t), [t]);
  const filteredSettingsNavItems = settingsNavItems.filter((item) => {
    if (!settingsSearch.trim()) {
      return true;
    }
    const query = settingsSearch.trim().toLowerCase();
    return item.label.toLowerCase().includes(query) || item.subtitle?.toLowerCase().includes(query);
  });

  const applyFolderFormReset = () => {
    const defaults = resetFolderForm();
    setEditingFolder(defaults.editingFolder);
    setFolderName(defaults.folderName);
    setFolderColor(defaults.folderColor);
  };

  const handleOpenCreateFolder = () => {
    applyFolderFormReset();
    setShowFolderModal(true);
  };

  const handleOpenEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color || '#3390ec');
    setShowFolderModal(true);
  };

  const handlePersistFolder = async () => {
    await handleSaveFolder(editingFolder, folderName, folderColor, () => {
      setShowFolderModal(false);
      applyFolderFormReset();
    });
  };

  const goBack = () => {
    if (section === 'main') {
      onClose();
      return;
    }
    setSection('main');
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="sticky top-0 z-10 flex h-14 items-center bg-[#17212b] px-2 text-white">
      <button onClick={goBack} className="rounded-full p-2.5 transition hover:bg-white/10">
        <ArrowLeft className="h-[22px] w-[22px]" />
      </button>
      <h2 className="ml-3 text-[19px] font-semibold">{title}</h2>
    </div>
  );

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        trackInteraction('settings_error', 'UserSettings');
        console.error('UserSettings error:', error, errorInfo);
      }}
    >
      <div
        className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/55 animate-fade-in sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          className={`animate-panel-up flex h-full w-full flex-col overflow-hidden panel-glass-strong sm:h-[min(92vh,860px)] sm:rounded-[32px] sm:shadow-[0_32px_80px_rgba(3,9,17,0.44)] ${
            isRootSettingsView ? 'sm:max-w-[420px]' : 'sm:max-w-[1120px] lg:flex-row'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          {!isRootSettingsView && (
            <SettingsSidebar
              avatarSrc={avatarSrc}
              displayName={displayName}
              username={user?.username}
              section={section}
              settingsSearch={settingsSearch}
              filteredSettingsNavItems={filteredSettingsNavItems}
              onClose={onClose}
              onSearchChange={setSettingsSearch}
              onSectionChange={setSection}
            />
          )}

          <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-[#17212b]">
            {section === 'main' && (
              <div className="flex h-full flex-col overflow-y-auto">
                <SettingsMainHeader
                  avatarSrc={avatarSrc}
                  displayName={displayName}
                  settingsSearch={settingsSearch}
                  avatarInputRef={avatarInputRef}
                  onClose={onClose}
                  onSearchChange={setSettingsSearch}
                  onAvatarChange={handleAvatarChange}
                />

                <Divider />

                <div className="bg-white dark:bg-[#17212b]">
                  <SectionLabel text={t('settings.account')} />

                  <div className="px-5 py-3.5">
                    <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{user?.email || '—'}</p>
                    <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">{t('settings.email')}</p>
                  </div>

                  <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />

                  <div className="px-5 py-3.5">
                    <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">@{user?.username || ''}</p>
                    <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">{t('settings.username')}</p>
                  </div>

                  <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />

                  <div className="px-5 py-3.5">
                    <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">
                      {user?.bio || t('settings.aboutPlaceholder')}
                    </p>
                    <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">{t('settings.about')}</p>
                  </div>

                  {(avatarFile ||
                    profileFormData.displayName !== (user?.displayName || '') ||
                    profileFormData.bio !== (user?.bio || '')) && (
                    <div className="px-5 py-3">
                      <button
                        onClick={handleProfileSave}
                        disabled={savingProfile}
                        className="w-full rounded-lg bg-[#3390ec] py-2.5 text-[15px] font-medium text-white transition hover:bg-[#2b7fd4] disabled:opacity-50"
                      >
                        {savingProfile ? t('settings.saving') : t('settings.save')}
                      </button>
                    </div>
                  )}
                </div>

                <Divider />

                <div className="bg-white dark:bg-[#17212b]">
                  <SectionLabel text={t('settings.general')} />
                  <MenuRow icon={MessageCircle} label={t('settings.section.chatSettings')} onClick={() => setSection('chat-settings')} color="text-[#3390ec]" />
                  <MenuRow icon={Shield} label={t('settings.section.privacy')} onClick={() => setSection('privacy')} color="text-[#8e8e93]" />
                  <MenuRow icon={Bell} label={t('settings.section.notifications')} onClick={() => setSection('notifications')} color="text-[#ef5350]" />
                  <MenuRow icon={Database} label={t('settings.section.data')} onClick={() => setSection('data')} color="text-[#4fae4e]" />
                  <MenuRow icon={Palette} label={t('settings.section.appearance')} onClick={() => setSection('appearance')} color="text-[#e67e22]" />
                  <MenuRow icon={Languages} label={t('settings.section.language')} subtitle={locale === 'ru' ? t('settings.languageValueRu') : t('settings.languageValueEn')} onClick={() => setSection('language')} color="text-[#4fae4e]" />
                  <MenuRow icon={FolderOpen} label={t('settings.section.folders')} onClick={() => setSection('folders')} color="text-[#3390ec]" />
                </div>

                <Divider />

                <div className="bg-white dark:bg-[#17212b]">
                  <MenuRow icon={Shield} label={t('settings.section.security')} subtitle={t('settings.securitySubtitle')} onClick={() => setSection('security')} color="text-[#8e8e93]" />
                  <MenuRow icon={Monitor} label={t('settings.section.sessions')} onClick={() => setSection('sessions')} color="text-[#3390ec]" />
                  <MenuRow icon={Bot} label={t('settings.section.bots')} onClick={() => setSection('bots')} color="text-[#9c27b0]" />
                </div>

                <Divider />
                <div className="h-8" />
              </div>
            )}

            {section === 'privacy' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazyPrivacySection privacy={privacy} onPrivacyChange={handlePrivacyChange} renderHeader={(title) => <SectionHeader title={title} />} />
              </Suspense>
            )}
            {section === 'notifications' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazyNotificationsSection notifications={notifications} onNotificationChange={handleNotificationChange} renderHeader={(title) => <SectionHeader title={title} />} />
              </Suspense>
            )}
            {section === 'appearance' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazyAppearanceSection currentTheme={user?.theme} onThemeChange={setTheme} renderHeader={(title) => <SectionHeader title={title} />} />
              </Suspense>
            )}
            {section === 'language' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazyLanguageSection renderHeader={(title) => <SectionHeader title={title} />} />
              </Suspense>
            )}
            {section === 'security' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazySecuritySection
                  securityStatus={securityStatus}
                  changePasswordData={changePasswordData}
                  onDisable2FA={handleDisable2FA}
                  onOpen2FA={() => setShow2FAModal(true)}
                  onChangePassword={handleChangePassword}
                  onPasswordDataChange={setChangePasswordData}
                  renderHeader={(title) => <SectionHeader title={title} />}
                />
              </Suspense>
            )}
            {section === 'sessions' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazySessionsSection
                  loadingSessions={loadingSessions}
                  sessions={sessions}
                  onRevokeAllSessions={handleRevokeAllSessions}
                  onRevokeSession={handleRevokeSession}
                  renderHeader={(title) => <SectionHeader title={title} />}
                />
              </Suspense>
            )}
            {section === 'data' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazyDataSection
                  loadingStorage={loadingStorage}
                  storageInfo={storageInfo}
                  onClearCache={handleClearCache}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                  renderHeader={(title) => <SectionHeader title={title} />}
                />
              </Suspense>
            )}
            {section === 'chat-settings' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazyChatSettingsSection
                  notifications={notifications}
                  onOpenFolders={() => setSection('folders')}
                  onOpenArchivedChats={() => setShowArchivedChats(true)}
                  onOpenBlockedUsers={() => setShowBlockedUsers(true)}
                  onNotificationChange={handleNotificationChange}
                  renderHeader={(title) => <SectionHeader title={title} />}
                />
              </Suspense>
            )}
            {section === 'folders' && (
              <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                <LazyFoldersSection
                  folders={folders}
                  loadingFolders={loadingFolders}
                  onCreateFolder={handleOpenCreateFolder}
                  onEditFolder={handleOpenEditFolder}
                  onDeleteFolder={handleDeleteFolder}
                  renderHeader={(title) => <SectionHeader title={title} />}
                />
              </Suspense>
            )}
            {section === 'bots' && (
              <div className="flex h-full flex-col">
                <SectionHeader title={t('settings.section.bots')} />
                <div className="flex-1 overflow-y-auto bg-white p-5 dark:bg-[#17212b]">
                  <div className="mb-5 grid grid-cols-3 gap-2">
                    {[
                      { id: 'internal' as const, label: t('settings.internalBots') },
                      { id: 'telegram' as const, label: 'Telegram' },
                      { id: 'n8n' as const, label: 'n8n' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setIntegrationTab(tab.id)}
                        className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                          integrationTab === tab.id
                            ? 'bg-[#3390ec] text-white'
                            : 'bg-[#efeff4] text-[#5b6470] dark:bg-[#202b36] dark:text-[#c3d0db]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <Suspense fallback={<div className="py-8 text-center text-[#8e8e93]">{t('settings.loading')}</div>}>
                    {integrationTab === 'internal' && <LazyBotManager />}
                    {integrationTab === 'telegram' && <LazyBotSettings embedded />}
                    {integrationTab === 'n8n' && <LazyN8nSettings embedded />}
                  </Suspense>
                </div>
              </div>
            )}
          </div>

          {show2FAModal && (
            <Suspense fallback={<div>{t('settings.loading')}</div>}>
              <LazyTwoFactorAuth
                onClose={() => {
                  setShow2FAModal(false);
                  loadSecurityStatus();
                }}
              />
            </Suspense>
          )}
          {showArchivedChats && (
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/30" />}>
              <LazyArchivedChats onClose={() => setShowArchivedChats(false)} onSelectChat={() => setShowArchivedChats(false)} />
            </Suspense>
          )}
          {showBlockedUsers && (
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/30" />}>
              <LazyBlockedUsers onClose={() => setShowBlockedUsers(false)} />
            </Suspense>
          )}
          {showFolderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-fade-in">
              <div className="animate-panel-up panel-glass-strong w-full max-w-md rounded-[28px]">
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                  <h3 className="text-[17px] font-semibold text-white">
                    {editingFolder ? t('settings.folderEdit') : t('settings.folderNew')}
                  </h3>
                  <button
                    onClick={() => {
                      setShowFolderModal(false);
                      applyFolderFormReset();
                    }}
                    className="panel-soft rounded-full p-2 hover:bg-white/10"
                  >
                    <X className="h-4 w-4 text-[#9cb4ca]" />
                  </button>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-[#8fa8bf]">{t('settings.folderName')}</label>
                    <input
                      value={folderName}
                      onChange={(event) => setFolderName(event.target.value)}
                      placeholder={t('settings.folderNamePlaceholder')}
                      className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-[#8fa8bf]">{t('settings.folderColor')}</label>
                    <input
                      type="color"
                      value={folderColor}
                      onChange={(event) => setFolderColor(event.target.value)}
                      className="h-12 w-full cursor-pointer rounded-[20px] border border-white/10 bg-white/[0.04] p-1"
                    />
                  </div>
                  <button
                    onClick={handlePersistFolder}
                    className="w-full rounded-[20px] bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] py-3 font-medium text-white transition hover:brightness-110"
                  >
                    {t('settings.folderSave')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

const UserSettings: React.FC<UserSettingsProps> = (props) => (
  <SettingsI18nProvider>
    <UserSettingsContent {...props} />
  </SettingsI18nProvider>
);

export default UserSettings;
