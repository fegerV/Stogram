import React, { useState } from 'react';
import { Palette, Save, X } from 'lucide-react';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
}

interface Theme {
  id?: string;
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

const defaultLightTheme: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#ffffff',
  surface: '#f3f4f6',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  accent: '#10b981',
};

const defaultDarkTheme: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#1f2937',
  surface: '#374151',
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  border: '#4b5563',
  accent: '#10b981',
};

const ThemeCustomizer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [themeName, setThemeName] = useState('My Custom Theme');
  const [isDark, setIsDark] = useState(false);
  const [colors, setColors] = useState<ThemeColors>(defaultLightTheme);
  const [savedThemes, setSavedThemes] = useState<Theme[]>([]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleModeToggle = () => {
    setIsDark(!isDark);
    setColors(isDark ? defaultLightTheme : defaultDarkTheme);
  };

  const handleSave = async () => {
    const theme: Theme = {
      name: themeName,
      colors,
      isDark,
    };

    try {
      const themes = JSON.parse(localStorage.getItem('customThemes') || '[]');
      themes.push({ ...theme, id: Date.now().toString() });
      localStorage.setItem('customThemes', JSON.stringify(themes));
      setSavedThemes(themes);
      alert('Theme saved successfully!');
    } catch (error) {
      console.error('Failed to save theme:', error);
      alert('Failed to save theme');
    }
  };

  const applyTheme = (theme: Theme) => {
    setColors(theme.colors);
    setIsDark(theme.isDark);
    setThemeName(theme.name);

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  React.useEffect(() => {
    const themes = JSON.parse(localStorage.getItem('customThemes') || '[]');
    setSavedThemes(themes);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-[#24323d] dark:bg-[#17212b] dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-[#24323d]">
          <div className="flex items-center gap-3">
            <Palette className="h-6 w-6 text-[#3390ec]" />
            <h2 className="text-2xl font-bold">Theme Customizer</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-slate-100 dark:hover:bg-[#202b36]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Theme Name
            </label>
            <input
              type="text"
              value={themeName}
              onChange={(event) => setThemeName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-900 dark:border-[#364450] dark:bg-[#202b36] dark:text-white"
              placeholder="Enter theme name"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-[#111922]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</label>
            <button
              onClick={handleModeToggle}
              className={`relative h-7 w-14 rounded-full transition-colors ${
                isDark ? 'bg-[#3390ec]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-7' : ''
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(event) => handleColorChange(key as keyof ThemeColors, event.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border border-slate-200 bg-transparent dark:border-[#364450]"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(event) => handleColorChange(key as keyof ThemeColors, event.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-[#364450] dark:bg-[#202b36] dark:text-white"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-[#24323d]">
            <h3 className="mb-4 text-lg font-semibold">Preview</h3>
            <div
              className="space-y-3 rounded-2xl p-4"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="rounded-xl p-3" style={{ backgroundColor: colors.surface }}>
                <p style={{ color: colors.text }}>Sample text</p>
                <p style={{ color: colors.textSecondary }}>Secondary text</p>
              </div>
              <button
                className="rounded-xl px-4 py-2 font-medium"
                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
              >
                Primary Button
              </button>
              <button
                className="ml-2 rounded-xl px-4 py-2 font-medium"
                style={{ backgroundColor: colors.secondary, color: '#ffffff' }}
              >
                Secondary Button
              </button>
            </div>
          </div>

          {savedThemes.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold">Saved Themes</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {savedThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => applyTheme(theme)}
                    className="rounded-2xl border border-slate-200 p-3 text-left transition-colors hover:border-[#3390ec] dark:border-[#24323d] dark:bg-[#111922]"
                  >
                    <div className="mb-2 font-medium">{theme.name}</div>
                    <div className="flex gap-1">
                      {Object.values(theme.colors).slice(0, 5).map((color, index) => (
                        <div
                          key={index}
                          className="h-6 w-6 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-6 py-2 transition hover:bg-slate-50 dark:border-[#364450] dark:hover:bg-[#202b36]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-[#3390ec] px-6 py-2 text-white transition hover:bg-[#2b7fd1]"
            >
              <Save className="h-4 w-4" />
              Save Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
