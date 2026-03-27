import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

interface MenuRowProps {
  icon: React.ElementType;
  label: string;
  subtitle?: string;
  onClick: () => void;
  color?: string;
}

export function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="mr-4 flex-1">
        <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{label}</p>
        {description && (
          <p className="mt-0.5 text-[13px] text-[#8e8e93] dark:text-[#6c7883]">{description}</p>
        )}
      </div>
      <label className="relative inline-flex flex-shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <div className="h-[24px] w-[42px] rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-[20px] after:w-[20px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:bg-[#3390ec] peer-checked:after:translate-x-[18px] dark:bg-gray-600" />
      </label>
    </div>
  );
}

export function MenuRow({ icon: Icon, label, subtitle, onClick, color }: MenuRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-5 px-5 py-3.5 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-[#202b36] dark:active:bg-[#2b3a47]"
    >
      <Icon className={`h-[22px] w-[22px] ${color || 'text-[#8e8e93] dark:text-[#6c7883]'}`} />
      <div className="flex-1 text-left">
        <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{label}</p>
        {subtitle && <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">{subtitle}</p>}
      </div>
      <ChevronRight className="h-4 w-4 text-[#c7c7cc] dark:text-[#4e5b65]" />
    </button>
  );
}

export function Divider() {
  return <div className="h-2 bg-[#efeff4] dark:bg-[#0e1621]" />;
}

export function SectionLabel({ text }: { text: string }) {
  return (
    <p className="px-5 pb-2 pt-5 text-[13px] font-semibold uppercase tracking-wide text-[#3390ec]">
      {text}
    </p>
  );
}
