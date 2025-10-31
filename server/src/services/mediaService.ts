import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';

// Configure ffmpeg path
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface MediaProcessingResult {
  originalPath: string;
  thumbnailPath?: string;
  compressedPath?: string;
  duration?: number;
  waveform?: string;
}

/**
 * Compress image file
 */
export const compressImage = async (
  inputPath: string,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 80
): Promise<string> => {
  try {
    const outputPath = inputPath.replace(/(\.[^.]+)$/, '_compressed$1');
    
    await sharp(inputPath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

/**
 * Generate video thumbnail
 */
export const generateVideoThumbnail = async (
  videoPath: string,
  timestamp = '00:00:01'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const thumbnailPath = videoPath.replace(/\.[^.]+$/, '_thumb.jpg');

    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '320x240',
      })
      .on('end', () => {
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        console.error('Error generating video thumbnail:', err);
        reject(err);
      });
  });
};

/**
 * Get video duration
 */
export const getVideoDuration = async (videoPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration || 0;
        resolve(Math.floor(duration));
      }
    });
  });
};

/**
 * Get audio duration
 */
export const getAudioDuration = async (audioPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration || 0;
        resolve(Math.floor(duration));
      }
    });
  });
};

/**
 * Generate audio waveform data
 */
export const generateAudioWaveform = async (
  audioPath: string,
  samples = 100
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const tempWavPath = audioPath.replace(/\.[^.]+$/, '_temp.wav');

    ffmpeg(audioPath)
      .audioChannels(1)
      .audioFrequency(8000)
      .format('wav')
      .on('end', async () => {
        try {
          // Read the WAV file and extract amplitude data
          const buffer = await fs.readFile(tempWavPath);
          const samples = extractWaveformSamples(buffer, 100);
          
          // Clean up temp file
          await fs.unlink(tempWavPath);
          
          resolve(JSON.stringify(samples));
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error('Error generating waveform:', err);
        reject(err);
      })
      .save(tempWavPath);
  });
};

/**
 * Extract waveform samples from WAV buffer
 */
function extractWaveformSamples(buffer: Buffer, sampleCount: number): number[] {
  const samples: number[] = [];
  const dataStart = 44; // WAV header is 44 bytes
  const dataLength = buffer.length - dataStart;
  const step = Math.floor(dataLength / sampleCount / 2); // 2 bytes per sample (16-bit)

  for (let i = 0; i < sampleCount; i++) {
    const offset = dataStart + i * step * 2;
    if (offset + 1 < buffer.length) {
      const sample = buffer.readInt16LE(offset);
      const normalized = Math.abs(sample) / 32768; // Normalize to 0-1
      samples.push(Math.round(normalized * 100) / 100);
    } else {
      samples.push(0);
    }
  }

  return samples;
}

/**
 * Process GIF (validate and optimize)
 */
export const processGif = async (
  inputPath: string,
  maxSize = 5 * 1024 * 1024 // 5MB
): Promise<string> => {
  try {
    const stats = await fs.stat(inputPath);
    
    if (stats.size > maxSize) {
      throw new Error('GIF file too large');
    }

    // For now, just return the original path
    // In production, you might want to optimize the GIF
    return inputPath;
  } catch (error) {
    console.error('Error processing GIF:', error);
    throw error;
  }
};

/**
 * Process uploaded media file
 */
export const processMedia = async (
  filePath: string,
  mimeType: string
): Promise<MediaProcessingResult> => {
  const result: MediaProcessingResult = {
    originalPath: filePath,
  };

  try {
    if (mimeType.startsWith('image/')) {
      if (mimeType === 'image/gif') {
        result.compressedPath = await processGif(filePath);
      } else {
        result.compressedPath = await compressImage(filePath);
      }
    } else if (mimeType.startsWith('video/')) {
      result.thumbnailPath = await generateVideoThumbnail(filePath);
      result.duration = await getVideoDuration(filePath);
    } else if (mimeType.startsWith('audio/')) {
      result.duration = await getAudioDuration(filePath);
      result.waveform = await generateAudioWaveform(filePath);
    }

    return result;
  } catch (error) {
    console.error('Error processing media:', error);
    return result;
  }
};
