import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { LinkPreview as LinkPreviewType } from '../types';

interface LinkPreviewProps {
  preview: LinkPreviewType;
}

export default function LinkPreview({ preview }: LinkPreviewProps) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-lg border border-gray-200 dark:border-[#2a3942] overflow-hidden hover:bg-gray-50 dark:hover:bg-[#2a3942] transition"
    >
      {preview.image && (
        <div className="w-full h-48 bg-gray-100 dark:bg-[#2a3942] relative overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title || 'Preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3">
        {preview.siteName && (
          <div className="text-xs text-[#667781] dark:text-[#8696a0] mb-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {preview.siteName}
          </div>
        )}
        {preview.title && (
          <h4 className="font-semibold text-[#111b21] dark:text-[#e9edef] text-sm mb-1 line-clamp-2">
            {preview.title}
          </h4>
        )}
        {preview.description && (
          <p className="text-xs text-[#667781] dark:text-[#8696a0] line-clamp-2">
            {preview.description}
          </p>
        )}
        <div className="text-xs text-[#00a884] dark:text-[#00a884] mt-1 truncate">
          {preview.url}
        </div>
      </div>
    </a>
  );
}
