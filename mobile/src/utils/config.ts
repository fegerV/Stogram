export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
export const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/quicktime'];
export const SUPPORTED_AUDIO_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

export const COLORS = {
  primary: '#0088cc',
  secondary: '#54a9eb',
  background: '#ffffff',
  backgroundDark: '#0d1117',
  text: '#000000',
  textDark: '#ffffff',
  border: '#e1e8ed',
  borderDark: '#30363d',
  gray: '#8899a6',
  success: '#17bf63',
  error: '#e0245e',
  warning: '#ffad1f',
};

export const THEME = {
  light: {
    background: COLORS.background,
    text: COLORS.text,
    border: COLORS.border,
    card: '#f7f9fa',
  },
  dark: {
    background: COLORS.backgroundDark,
    text: COLORS.textDark,
    border: COLORS.borderDark,
    card: '#161b22',
  },
};
