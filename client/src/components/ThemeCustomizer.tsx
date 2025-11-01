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
    setColors(prev => ({ ...prev, [key]: value }));
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
      // Save theme to backend
      // const response = await fetch('/api/themes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(theme),
      // });
      
      // For now, save to localStorage
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
    
    // Apply to document
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  const loadSavedThemes = () => {
    const themes = JSON.parse(localStorage.getItem('customThemes') || '[]');
    setSavedThemes(themes);
  };

  React.useEffect(() => {
    loadSavedThemes();
  }, []);

  const previewStyle = {
    '--preview-primary': colors.primary,
    '--preview-background': colors.background,
    '--preview-surface': colors.surface,
    '--preview-text': colors.text,
    '--preview-border': colors.border,
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Theme Customizer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Theme Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Theme Name</label>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter theme name"
            />
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Dark Mode</label>
            <button
              onClick={handleModeToggle}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isDark ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  isDark ? 'transform translate-x-7' : ''
                }`}
              />
            </button>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4" style={previewStyle}>
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            <div 
              className="p-4 rounded-lg space-y-3"
              style={{ 
                backgroundColor: colors.background,
                color: colors.text,
                border: `1px solid ${colors.border}`
              }}
            >
              <div 
                className="p-3 rounded"
                style={{ backgroundColor: colors.surface }}
              >
                <p style={{ color: colors.text }}>Sample text</p>
                <p style={{ color: colors.textSecondary }}>Secondary text</p>
              </div>
              <button
                className="px-4 py-2 rounded font-medium"
                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded font-medium ml-2"
                style={{ backgroundColor: colors.secondary, color: '#ffffff' }}
              >
                Secondary Button
              </button>
            </div>
          </div>

          {/* Saved Themes */}
          {savedThemes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Saved Themes</h3>
              <div className="grid grid-cols-3 gap-3">
                {savedThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => applyTheme(theme)}
                    className="p-3 border rounded-lg hover:border-blue-500 transition-colors text-left"
                  >
                    <div className="font-medium mb-2">{theme.name}</div>
                    <div className="flex gap-1">
                      {Object.values(theme.colors).slice(0, 5).map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
