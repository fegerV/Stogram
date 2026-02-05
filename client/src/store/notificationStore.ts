import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  desktopEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setDesktopEnabled: (enabled: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      desktopEnabled: true,
      setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
      setVibrationEnabled: (enabled: boolean) => set({ vibrationEnabled: enabled }),
      setDesktopEnabled: (enabled: boolean) => set({ desktopEnabled: enabled }),
    }),
    {
      name: 'notification-settings',
    }
  )
);
