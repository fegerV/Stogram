import { Monitor, X } from 'lucide-react';
import { Session } from './types';
import { useSettingsI18n } from './i18n';

interface SessionsSectionProps {
  loadingSessions: boolean;
  sessions: Session[];
  onRevokeAllSessions: () => void;
  onRevokeSession: (sessionId: string) => void;
  renderHeader: (title: string) => JSX.Element;
}

export function SessionsSection({
  loadingSessions,
  sessions,
  onRevokeAllSessions,
  onRevokeSession,
  renderHeader,
}: SessionsSectionProps) {
  const { t } = useSettingsI18n();

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.sessions'))}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
        {loadingSessions ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3390ec]" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-[#8e8e93]">
            <Monitor className="mx-auto mb-2 h-12 w-12 opacity-40" />
            <p>{t('settings.sessions.empty')}</p>
          </div>
        ) : (
          <>
            {sessions.length > 1 && (
              <div className="px-5 py-3">
                <button onClick={onRevokeAllSessions} className="text-[14px] font-medium text-[#ef5350]">
                  {t('settings.sessions.revokeAll')}
                </button>
              </div>
            )}

            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-[#202c33]"
              >
                <Monitor className="h-5 w-5 flex-shrink-0 text-[#3390ec]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] text-[#222] dark:text-[#e1e1e1]">
                      {session.device || t('settings.sessions.device')}
                    </p>
                    {session.isCurrent && (
                      <span className="rounded-full bg-[#4fae4e]/20 px-2 py-0.5 text-[11px] font-medium text-[#4fae4e]">
                        {t('settings.sessions.current')}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[13px] text-[#8e8e93]">{session.ipAddress}</p>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => onRevokeSession(session.id)}
                    className="rounded-full p-1.5 text-[#ef5350] hover:bg-red-50 dark:hover:bg-red-900/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
