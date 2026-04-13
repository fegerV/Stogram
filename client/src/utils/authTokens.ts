import axios from 'axios';

const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setAuthTokens = (token: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (apiUrl: string): Promise<string | null> => {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    clearAuthTokens();
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post(`${apiUrl}/api/auth/refresh`, { refreshToken: currentRefreshToken })
    .then((response) => {
      const token = response.data?.token as string | undefined;
      const nextRefreshToken = (response.data?.refreshToken as string | undefined) || currentRefreshToken;

      if (!token) {
        clearAuthTokens();
        return null;
      }

      setAuthTokens(token, nextRefreshToken);
      return token;
    })
    .catch(() => {
      clearAuthTokens();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};
