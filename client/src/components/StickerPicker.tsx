import React, { useEffect, useState } from 'react';
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
    void loadStickerPacks();
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

  const currentPack = packs.find((pack) => pack.slug === selectedPack);

  return (
    <div className="absolute bottom-16 right-4 z-30 flex h-[26rem] w-[25rem] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-[#3390ec]/10 p-2 text-[#3390ec]">
            <Smile className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Стикеры</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Выберите набор и отправьте стикер в чат</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-20 overflow-y-auto border-r border-slate-200/80 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-950/40">
          {packs.map((pack) => (
            <button
              key={pack.slug}
              type="button"
              onClick={() => setSelectedPack(pack.slug)}
              className={`mb-2 flex w-full items-center justify-center rounded-2xl border p-2 transition ${
                selectedPack === pack.slug
                  ? 'border-[#3390ec]/30 bg-[#3390ec]/10'
                  : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={pack.name}
            >
              {pack.thumbnail ? (
                <img src={pack.thumbnail} alt={pack.name} className="h-9 w-9 object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                  {pack.name.charAt(0)}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3390ec]" />
            </div>
          ) : currentPack ? (
            <div className="grid grid-cols-4 gap-2">
              {currentPack.stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => {
                    onSelectSticker(sticker);
                    onClose();
                  }}
                  className="aspect-square rounded-2xl p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <img
                    src={sticker.imageUrl}
                    alt={sticker.emoji || 'Sticker'}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
              Нет доступных стикеров
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
