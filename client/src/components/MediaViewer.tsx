import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import ReactPlayer from 'react-player';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'gif';
  fileName?: string;
  items?: Array<{ url: string; type: 'image' | 'video' | 'gif' }>;
  currentIndex?: number;
}

export const MediaViewer = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  fileName,
  items,
  currentIndex = 0,
}: MediaViewerProps) => {
  const [index, setIndex] = useState(currentIndex);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  const currentItem = items ? items[index] : { url: mediaUrl, type: mediaType };
  const hasMultiple = Boolean(items && items.length > 1);

  const handlePrevious = () => {
    if (items && index > 0) setIndex(index - 1);
  };

  const handleNext = () => {
    if (items && index < items.length - 1) setIndex(index + 1);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasMultiple) handlePrevious();
      if (event.key === 'ArrowRight' && hasMultiple) handleNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [index, hasMultiple, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="text-sm text-white/80">{hasMultiple ? `${index + 1} / ${items?.length}` : ''}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDownload} className="rounded-full p-2 text-white transition hover:bg-white/10">
            <Download size={20} />
          </button>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white transition hover:bg-white/10">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="relative flex h-full w-full max-w-7xl items-center justify-center p-16">
        {currentItem.type === 'video' ? (
          <ReactPlayer url={currentItem.url} controls playing width="100%" height="100%" style={{ maxHeight: '80vh' }} />
        ) : (
          <img src={currentItem.url} alt="Media" className="max-h-full max-w-full object-contain" />
        )}
      </div>

      {hasMultiple && (
        <>
          {index > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/70"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {items && index < items.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/70"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </>
      )}

      {hasMultiple && items && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex justify-center gap-2 overflow-x-auto">
            {items.map((item, itemIndex) => (
              <button
                key={itemIndex}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  itemIndex === index ? 'border-[#3390ec]' : 'border-transparent'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white">▶</div>
                ) : (
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaViewer;
