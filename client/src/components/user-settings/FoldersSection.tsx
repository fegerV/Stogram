import { Edit2, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Folder } from './types';
import { useSettingsI18n } from './i18n';

interface FoldersSectionProps {
  folders: Folder[];
  loadingFolders: boolean;
  onCreateFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  renderHeader: (title: string) => JSX.Element;
}

export function FoldersSection({
  folders,
  loadingFolders,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  renderHeader,
}: FoldersSectionProps) {
  const { t } = useSettingsI18n();

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.folders'))}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
        <div className="px-5 py-4">
          <button
            onClick={onCreateFolder}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3390ec] py-3 font-medium text-white transition hover:bg-[#2b7fd4]"
          >
            <Plus className="h-4 w-4" />
            {t('settings.folders.create')}
          </button>
        </div>

        {loadingFolders ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3390ec]" />
          </div>
        ) : folders.length === 0 ? (
          <div className="px-5 py-12 text-center text-[#8e8e93]">
            <FolderOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="text-[15px]">{t('settings.folders.empty')}</p>
            <p className="mt-1 text-[13px]">{t('settings.folders.emptyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3 px-5 pb-5">
            {folders.map((folder) => (
              <div key={folder.id} className="rounded-2xl bg-[#efeff4] p-4 dark:bg-[#202b36]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: folder.color || '#3390ec' }}
                    >
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-[#222] dark:text-[#e1e1e1]">
                        {folder.name}
                      </p>
                      <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">
                        {t('settings.folders.chatCount', { count: (folder.chatSettings || []).length })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditFolder(folder)}
                      className="rounded-full p-2 text-[#3390ec] transition hover:bg-white/60 dark:hover:bg-[#17212b]"
                      aria-label={t('settings.folders.edit')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteFolder(folder.id)}
                      className="rounded-full p-2 text-[#ef5350] transition hover:bg-white/60 dark:hover:bg-[#17212b]"
                      aria-label={t('settings.folders.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {(folder.chatSettings || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(folder.chatSettings || []).slice(0, 6).map((item, index) => (
                      <span
                        key={`${folder.id}-${item.chat?.id || index}`}
                        className="rounded-full bg-white px-2.5 py-1 text-[12px] text-[#5b6470] dark:bg-[#17212b] dark:text-[#c3d0db]"
                      >
                        {item.chat?.name || t('settings.folders.unnamed')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
