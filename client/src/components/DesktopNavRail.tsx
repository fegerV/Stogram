import { Folder, MessageSquare } from 'lucide-react';

interface FolderOption {
  id: string;
  name: string;
  color?: string;
}

interface DesktopNavRailProps {
  folders: FolderOption[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

function RailFolderButton({
  icon: Icon,
  label,
  isActive,
  accentColor,
  onClick,
}: {
  icon?: typeof Folder;
  label: string;
  isActive: boolean;
  accentColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full flex-col items-center gap-2 rounded-[24px] px-2 py-2.5 transition ${
        isActive ? 'bg-white/[0.06] text-white shadow-[0_14px_32px_rgba(7,17,27,0.24)]' : 'text-[#7e97ad] hover:bg-white/[0.045] hover:text-white'
      }`}
      title={label}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/8 shadow-[0_10px_24px_rgba(7,17,27,0.18)]"
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${accentColor || '#4ba3ff'}, #2f8cff)`
            : 'rgba(255,255,255,0.04)',
        }}
      >
        {Icon ? (
          <Icon className="h-5 w-5" />
        ) : (
          <span className="text-[13px] font-semibold">{label.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <span className="max-w-[62px] truncate text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

export default function DesktopNavRail({
  folders,
  selectedFolderId,
  onSelectFolder,
}: DesktopNavRailProps) {
  return (
    <aside className="hidden h-full w-[92px] shrink-0 flex-col items-center gap-3 border-r border-white/8 bg-[linear-gradient(180deg,rgba(10,18,28,0.98),rgba(8,15,24,0.94))] px-3 py-4 md:flex">
      <div className="panel-soft flex h-12 w-12 items-center justify-center rounded-[20px] text-white">
        <MessageSquare className="h-5 w-5" />
      </div>

      <div className="flex w-full flex-col gap-2 overflow-y-auto scrollbar-none">
        <RailFolderButton
          icon={MessageSquare}
          label="Все"
          isActive={selectedFolderId === null}
          onClick={() => onSelectFolder(null)}
        />

        {folders.map((folder) => (
          <RailFolderButton
            key={folder.id}
            label={folder.name}
            isActive={selectedFolderId === folder.id}
            accentColor={folder.color}
            onClick={() => onSelectFolder(folder.id)}
          />
        ))}
      </div>
    </aside>
  );
}
