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
export declare const compressImage: (inputPath: string, maxWidth?: number, maxHeight?: number, quality?: number) => Promise<string>;
/**
 * Generate video thumbnail
 */
export declare const generateVideoThumbnail: (videoPath: string, timestamp?: string) => Promise<string>;
/**
 * Get video duration
 */
export declare const getVideoDuration: (videoPath: string) => Promise<number>;
/**
 * Get audio duration
 */
export declare const getAudioDuration: (audioPath: string) => Promise<number>;
/**
 * Generate audio waveform data
 */
export declare const generateAudioWaveform: (audioPath: string, samples?: number) => Promise<string>;
/**
 * Process GIF (validate and optimize)
 */
export declare const processGif: (inputPath: string, maxSize?: number) => Promise<string>;
/**
 * Process uploaded media file
 */
export declare const processMedia: (filePath: string, mimeType: string) => Promise<MediaProcessingResult>;
//# sourceMappingURL=mediaService.d.ts.map