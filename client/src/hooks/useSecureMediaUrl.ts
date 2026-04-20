import { useEffect, useState } from 'react';
import api from '../services/api';
import { getProtectedMediaPath } from '../utils/helpers';

const isAbsoluteMediaUrl = (path: string) =>
  path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:');

export function useSecureMediaUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      setIsLoading(false);
      return;
    }

    if (isAbsoluteMediaUrl(path)) {
      setUrl(path);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let objectUrl: string | null = null;

    setIsLoading(true);
    api
      .get(getProtectedMediaPath(path), { responseType: 'blob' })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        if (isMounted) {
          setUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUrl(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [path]);

  return { url, isLoading };
}

export async function downloadSecureMedia(path: string, fileName?: string | null) {
  const response = await api.get(getProtectedMediaPath(path), {
    params: { download: '1' },
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = fileName || 'download';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
