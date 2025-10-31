import React, { useState, useEffect } from 'react';
import { Smile, X } from 'lucide-react';
import axios from 'axios';

interface Sticker {
  id: string;
  emoji?: string;
  imageUrl: string;
  width: number;
  height: number;
}

interface StickerPack {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string;
  stickers: Sticker[];
}

interface StickerPickerProps {
  onSelectSticker: (sticker: Sticker) => void;
  onClose: () => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ onSelectSticker, onClose }) => {
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStickerPacks();
  }, []);

  const loadStickerPacks = async () => {
    try {
      const response = await axios.get('/api/stickers');
      setPacks(response.data);
      if (response.data.length > 0) {
        setSelectedPack(response.data[0].slug);
      }
    } catch (error) {
      console.error('Failed to load sticker packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPack = packs.find(p => p.slug === selectedPack);

  return (
    <div className="absolute bottom-16 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-96 h-96 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">Стикеры</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Pack selector */}
        <div className="w-16 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {packs.map(pack => (
            <button
              key={pack.slug}
              onClick={() => setSelectedPack(pack.slug)}
              className={`w-full p-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedPack === pack.slug ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              title={pack.name}
            >
              {pack.thumbnail ? (
                <img src={pack.thumbnail} alt={pack.name} className="w-8 h-8 object-contain mx-auto" />
              ) : (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs">
                  {pack.name.charAt(0)}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Stickers grid */}
        <div className="flex-1 p-3 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : currentPack ? (
            <div className="grid grid-cols-4 gap-2">
              {currentPack.stickers.map(sticker => (
                <button
                  key={sticker.id}
                  onClick={() => {
                    onSelectSticker(sticker);
                    onClose();
                  }}
                  className="aspect-square hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors"
                >
                  <img
                    src={sticker.imageUrl}
                    alt={sticker.emoji || 'Sticker'}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Нет доступных стикеров
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
