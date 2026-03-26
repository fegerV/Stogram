import { Folder, MessageSquare, PanelLeftOpen } from 'lucide-react';

interface FolderOption {
  id: string;
  name: string;
  color?: string;
}

interface DesktopNavRailProps {
  folders: FolderOption[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onOpenMenu: () => void;
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
      className={`group flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${
        isActive ? 'bg-[#162330] text-white' : 'text-[#7e97ad] hover:bg-[#162330] hover:text-white'
      }`}
      title={label}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-2xl"
        style={{ backgroundColor: isActive ? accentColor || '#3390ec' : '#162330' }}
      >
        {Icon ? <Icon className="h-5 w-5" /> : <span className="text-[13px] font-semibold">{label.slice(0, 2).toUpperCase()}</span>}
      </div>
      <span className="max-w-[62px] truncate text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

export default function DesktopNavRail({
  folders,
  selectedFolderId,
  onSelectFolder,
  onOpenMenu,
}: DesktopNavRailProps) {
  return (
    <aside className="hidden h-full md:flex w-[88px] shrink-0 flex-col items-center gap-2 border-r border-[#17232d] bg-[#0d1720] px-3 py-4">
      <button
        onClick={onOpenMenu}
        className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#162330] text-white transition hover:bg-[#203140]"
        title="Меню"
      >
        <PanelLeftOpen className="h-5 w-5" />
      </button>

      <div className="flex w-full flex-col gap-1 overflow-y-auto">
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
