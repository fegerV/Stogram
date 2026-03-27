import { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { addHours, addMinutes, format } from 'date-fns';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
}

export const ScheduleMessageModal = ({
  isOpen,
  onClose,
  onSchedule,
}: ScheduleMessageModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(addHours(new Date(), 1));
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  if (!isOpen) return null;

  const quickOptions = [
    { label: 'Через 10 минут', date: addMinutes(new Date(), 10) },
    { label: 'Через 30 минут', date: addMinutes(new Date(), 30) },
    { label: 'Через 1 час', date: addHours(new Date(), 1) },
    { label: 'Через 2 часа', date: addHours(new Date(), 2) },
    { label: 'Завтра в 09:00', date: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(9, 0, 0, 0) },
  ];

  const handleQuickOption = (date: Date | number) => {
    setSelectedDate(typeof date === 'number' ? new Date(date) : date);
  };

  const handleCustomDateTime = (nextDate: string, nextTime: string) => {
    if (!nextDate || !nextTime) return;
    const [hours, minutes] = nextTime.split(':');
    const date = new Date(nextDate);
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    setSelectedDate(date);
  };

  const handleSchedule = () => {
    if (selectedDate > new Date()) {
      onSchedule(selectedDate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Отложенная отправка</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Выберите, когда сообщение должно уйти.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Закрыть"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Быстрые варианты</label>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option) => {
                const optionTime = typeof option.date === 'number' ? option.date : option.date.getTime();
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleQuickOption(option.date)}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      selectedDate.getTime() === optionTime
                        ? 'border-[#3390ec] bg-[#3390ec] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Clock size={16} className="mr-2 inline-block" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Своя дата и время</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  setCustomDate(nextDate);
                  handleCustomDateTime(nextDate, customTime);
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <input
                type="time"
                value={customTime}
                onChange={(event) => {
                  const nextTime = event.target.value;
                  setCustomTime(nextTime);
                  handleCustomDateTime(customDate, nextTime);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200/80 bg-blue-50/90 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Calendar size={18} />
              <span className="text-sm font-medium">Запланировано на {format(selectedDate, 'PPP p')}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSchedule}
              disabled={!selectedDate || selectedDate <= new Date()}
              className="flex-1 rounded-2xl bg-[#3390ec] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2c83d9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Запланировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
