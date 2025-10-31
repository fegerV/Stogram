import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { format, addMinutes, addHours, addDays } from 'date-fns';

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
    { label: '10 minutes', date: addMinutes(new Date(), 10) },
    { label: '30 minutes', date: addMinutes(new Date(), 30) },
    { label: '1 hour', date: addHours(new Date(), 1) },
    { label: '2 hours', date: addHours(new Date(), 2) },
    { label: 'Tomorrow 9 AM', date: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(9, 0, 0, 0) },
  ];

  const handleQuickOption = (date: Date | number) => {
    const scheduleDate = typeof date === 'number' ? new Date(date) : date;
    setSelectedDate(scheduleDate);
  };

  const handleCustomDateTime = () => {
    if (customDate && customTime) {
      const [hours, minutes] = customTime.split(':');
      const date = new Date(customDate);
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      setSelectedDate(date);
    }
  };

  const handleSchedule = () => {
    if (selectedDate > new Date()) {
      onSchedule(selectedDate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold dark:text-white">Schedule Message</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Quick Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Schedule
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickOption(option.date)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    selectedDate.getTime() === (typeof option.date === 'number' ? option.date : option.date.getTime())
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <Clock size={16} className="inline mr-1" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Date & Time
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    handleCustomDateTime();
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    handleCustomDateTime();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Selected Time Display */}
          {selectedDate && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Calendar size={18} />
                <span className="text-sm font-medium">
                  Scheduled for: {format(selectedDate, 'PPP p')}
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={!selectedDate || selectedDate <= new Date()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
