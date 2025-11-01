import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface VideoConversionFormat {
  format: string;
  videoBitrate?: string;
  audioBitrate?: string;
  size?: string;
}

export class MediaProcessingService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly THUMBNAIL_WIDTH = 320;
  private static readonly THUMBNAIL_HEIGHT = 240;

  // Compress image
  static async compressImage(
    inputPath: string,
    outputPath: string,
    options: CompressionOptions = {}
  ): Promise<{ size: number; width: number; height: number }> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 80,
    } = options;

    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let resizedImage = image;

    // Resize if needed
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        resizedImage = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    // Compress and save
    await resizedImage
      .jpeg({ quality })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const finalMetadata = await sharp(outputPath).metadata();

    return {
      size: stats.size,
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
    };
  }

  // Generate thumbnail for image
  static async generateImageThumbnail(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    await sharp(inputPath)
      .resize(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, {
        fit: 'cover',
      })
      .jpeg({ quality: 70 })
      .toFile(outputPath);
  }

  // Generate thumbnail for video
  static async generateVideoThumbnail(
    inputPath: string,
    outputPath: string,
    timestamp: string = '00:00:01'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: `${this.THUMBNAIL_WIDTH}x${this.THUMBNAIL_HEIGHT}`,
        })
        .on('end', () => resolve())
        .on('error', reject);
    });
  }

  // Convert video to different formats
  static async convertVideo(
    inputPath: string,
    outputPath: string,
    format: VideoConversionFormat
  ): Promise<{ size: number; duration: number }> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .format(format.format);

      if (format.videoBitrate) {
        command = command.videoBitrate(format.videoBitrate);
      }

      if (format.audioBitrate) {
        command = command.audioBitrate(format.audioBitrate);
      }

      if (format.size) {
        command = command.size(format.size);
      }

      command
        .output(outputPath)
        .on('end', () => {
          const stats = fs.statSync(outputPath);
          // Get video duration
          ffmpeg.ffprobe(outputPath, (err, metadata) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                size: stats.size,
                duration: metadata.format.duration || 0,
              });
            }
          });
        })
        .on('error', reject)
        .run();
    });
  }

  // Convert video to multiple formats
  static async convertVideoToMultipleFormats(
    inputPath: string,
    outputDir: string,
    baseName: string
  ): Promise<Array<{ format: string; path: string; size: number }>> {
    const formats: VideoConversionFormat[] = [
      { format: 'mp4', videoBitrate: '1000k', audioBitrate: '128k' },
      { format: 'webm', videoBitrate: '1000k', audioBitrate: '128k' },
      { format: 'mp4', videoBitrate: '500k', audioBitrate: '96k', size: '640x?' }, // Low quality
    ];

    const results = [];

    for (const [index, format] of formats.entries()) {
      const outputPath = path.join(
        outputDir,
        `${baseName}_${index}.${format.format}`
      );

      try {
        const { size } = await this.convertVideo(inputPath, outputPath, format);
        results.push({
          format: format.format,
          path: outputPath,
          size,
        });
      } catch (error) {
        console.error(`Failed to convert to ${format.format}:`, error);
      }
    }

    return results;
  }

  // Extract audio from video
  static async extractAudio(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  // Get video metadata
  static async getVideoMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  // Compress video
  static async compressVideo(
    inputPath: string,
    outputPath: string,
    targetSizeMB: number = 10
  ): Promise<{ size: number; duration: number }> {
    const metadata = await this.getVideoMetadata(inputPath);
    const duration = metadata.format.duration || 1;
    
    // Calculate target bitrate
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    const targetBitrate = Math.floor((targetSizeBytes * 8) / duration / 1000); // in kbps
    
    return this.convertVideo(inputPath, outputPath, {
      format: 'mp4',
      videoBitrate: `${targetBitrate}k`,
      audioBitrate: '96k',
    });
  }

  // Check if file needs compression
  static needsCompression(filePath: string): boolean {
    const stats = fs.statSync(filePath);
    return stats.size > this.MAX_FILE_SIZE;
  }

  // Generate preview for document (PDF, etc.)
  static async generateDocumentPreview(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    // This would require additional libraries like pdf-thumbnail or ghostscript
    // For now, we'll just create a placeholder
    // In production, implement proper document preview generation
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.pdf') {
      // Would use pdf-thumbnail or similar
      console.log('PDF preview generation not implemented yet');
    }
  }

  // Clean up temporary files
  static async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          await unlinkAsync(filePath);
        }
      } catch (error) {
        console.error(`Failed to delete temp file ${filePath}:`, error);
      }
    }
  }

  // Process uploaded file
  static async processUploadedFile(
    filePath: string,
    fileType: string,
    outputDir: string
  ): Promise<{
    processedPath: string;
    thumbnailPath?: string;
    formats?: Array<{ format: string; path: string }>;
    metadata: any;
  }> {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    if (fileType.startsWith('image/')) {
      const processedPath = path.join(outputDir, `${fileName}_compressed.jpg`);
      const thumbnailPath = path.join(outputDir, `${fileName}_thumb.jpg`);
      
      const metadata = await this.compressImage(filePath, processedPath);
      await this.generateImageThumbnail(filePath, thumbnailPath);
      
      return { processedPath, thumbnailPath, metadata };
    }
    
    if (fileType.startsWith('video/')) {
      const processedPath = path.join(outputDir, `${fileName}_compressed.mp4`);
      const thumbnailPath = path.join(outputDir, `${fileName}_thumb.jpg`);
      
      const metadata = await this.compressVideo(filePath, processedPath);
      await this.generateVideoThumbnail(filePath, thumbnailPath);
      
      const formats = await this.convertVideoToMultipleFormats(
        processedPath,
        outputDir,
        fileName
      );
      
      return { processedPath, thumbnailPath, formats, metadata };
    }
    
    // For other file types, return as is
    return { processedPath: filePath, metadata: {} };
  }
}
