import imageCompression from 'browser-image-compression';

export const compressImage = async (
  file: File,
  maxSizeMB = 2,
  maxWidthOrHeight = 1920
): Promise<File> => {
  try {
    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: file.type,
    };

    const compressedFile = await imageCompression(file, options);
    
    // Return original file if compression didn't help much
    if (compressedFile.size >= file.size * 0.9) {
      return file;
    }

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return file;
  }
};

export const generateVideoThumbnail = async (
  file: File,
  seekTo = 0.5
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        resolve(null);
        return;
      }

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        video.currentTime = video.duration * seekTo;
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(video.src);
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };

      video.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error generating video thumbnail:', error);
      resolve(null);
    }
  });
};

export const isGif = (file: File): boolean => {
  return file.type === 'image/gif';
};

export const validateMediaFile = (
  file: File,
  maxSize: number = 10 * 1024 * 1024
): { valid: boolean; error?: string } => {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/webm',
    'audio/wav',
  ];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file type',
    };
  }

  return { valid: true };
};
