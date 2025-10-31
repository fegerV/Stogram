import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
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

  if (!isOpen) return null;

  const currentItem = items ? items[index] : { url: mediaUrl, type: mediaType };
  const hasMultiple = items && items.length > 1;

  const handlePrevious = () => {
    if (items && index > 0) {
      setIndex(index - 1);
    }
  };

  const handleNext = () => {
    if (items && index < items.length - 1) {
      setIndex(index + 1);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasMultiple) handlePrevious();
    if (e.key === 'ArrowRight' && hasMultiple) handleNext();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [index, hasMultiple]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          {hasMultiple && (
            <span className="text-sm">
              {index + 1} / {items?.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 text-white hover:bg-white/10 rounded-full transition"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Media Content */}
      <div className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center p-16">
        {currentItem.type === 'video' ? (
          <ReactPlayer
            url={currentItem.url}
            controls
            playing
            width="100%"
            height="100%"
            style={{ maxHeight: '80vh' }}
          />
        ) : (
          <img
            src={currentItem.url}
            alt="Media"
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Navigation */}
      {hasMultiple && (
        <>
          {index > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {index < items!.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </>
      )}

      {/* Thumbnails */}
      {hasMultiple && items && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex gap-2 overflow-x-auto justify-center">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition ${
                  i === index ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white text-xs">▶</span>
                  </div>
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
