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
export declare class MediaProcessingService {
    private static readonly MAX_FILE_SIZE;
    private static readonly THUMBNAIL_WIDTH;
    private static readonly THUMBNAIL_HEIGHT;
    static compressImage(inputPath: string, outputPath: string, options?: CompressionOptions): Promise<{
        size: number;
        width: number;
        height: number;
    }>;
    static generateImageThumbnail(inputPath: string, outputPath: string): Promise<void>;
    static generateVideoThumbnail(inputPath: string, outputPath: string, timestamp?: string): Promise<void>;
    static convertVideo(inputPath: string, outputPath: string, format: VideoConversionFormat): Promise<{
        size: number;
        duration: number;
    }>;
    static convertVideoToMultipleFormats(inputPath: string, outputDir: string, baseName: string): Promise<Array<{
        format: string;
        path: string;
        size: number;
    }>>;
    static extractAudio(inputPath: string, outputPath: string): Promise<void>;
    static getVideoMetadata(filePath: string): Promise<any>;
    static compressVideo(inputPath: string, outputPath: string, targetSizeMB?: number): Promise<{
        size: number;
        duration: number;
    }>;
    static needsCompression(filePath: string): boolean;
    static generateDocumentPreview(inputPath: string, outputPath: string): Promise<void>;
    static cleanupTempFiles(filePaths: string[]): Promise<void>;
    static processUploadedFile(filePath: string, fileType: string, outputDir: string): Promise<{
        processedPath: string;
        thumbnailPath?: string;
        formats?: Array<{
            format: string;
            path: string;
        }>;
        metadata: any;
    }>;
}
export {};
//# sourceMappingURL=mediaProcessingService.d.ts.map