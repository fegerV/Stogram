"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMedia = exports.processGif = exports.generateAudioWaveform = exports.getAudioDuration = exports.getVideoDuration = exports.generateVideoThumbnail = exports.compressImage = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
// Configure ffmpeg path
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
fluent_ffmpeg_1.default.setFfmpegPath(ffmpegInstaller.path);
/**
 * Compress image file
 */
const compressImage = async (inputPath, maxWidth = 1920, maxHeight = 1080, quality = 80) => {
    try {
        const ext = path_1.default.extname(inputPath).toLowerCase();
        const outputPath = inputPath.replace(/(\.[^.]+)$/, '_compressed$1');
        const sharpInstance = (0, sharp_1.default)(inputPath)
            .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
        });
        // Preserve original format
        if (ext === '.png') {
            await sharpInstance.png({ quality }).toFile(outputPath);
        }
        else if (ext === '.webp') {
            await sharpInstance.webp({ quality }).toFile(outputPath);
        }
        else if (ext === '.gif') {
            // GIFs are handled separately
            return inputPath;
        }
        else {
            // Default to JPEG for jpg, jpeg, and other formats
            await sharpInstance.jpeg({ quality }).toFile(outputPath);
        }
        return outputPath;
    }
    catch (error) {
        console.error('Error compressing image:', error);
        // Return original path if compression fails
        return inputPath;
    }
};
exports.compressImage = compressImage;
/**
 * Generate video thumbnail
 */
const generateVideoThumbnail = async (videoPath, timestamp = '00:00:01') => {
    return new Promise((resolve, reject) => {
        const thumbnailPath = videoPath.replace(/\.[^.]+$/, '_thumb.jpg');
        (0, fluent_ffmpeg_1.default)(videoPath)
            .screenshots({
            timestamps: [timestamp],
            filename: path_1.default.basename(thumbnailPath),
            folder: path_1.default.dirname(thumbnailPath),
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
exports.generateVideoThumbnail = generateVideoThumbnail;
/**
 * Get video duration
 */
const getVideoDuration = async (videoPath) => {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                reject(err);
            }
            else {
                const duration = metadata.format.duration || 0;
                resolve(Math.floor(duration));
            }
        });
    });
};
exports.getVideoDuration = getVideoDuration;
/**
 * Get audio duration
 */
const getAudioDuration = async (audioPath) => {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(audioPath, (err, metadata) => {
            if (err) {
                reject(err);
            }
            else {
                const duration = metadata.format.duration || 0;
                resolve(Math.floor(duration));
            }
        });
    });
};
exports.getAudioDuration = getAudioDuration;
/**
 * Generate audio waveform data
 */
const generateAudioWaveform = async (audioPath, samples = 100) => {
    return new Promise((resolve, reject) => {
        const tempWavPath = audioPath.replace(/\.[^.]+$/, '_temp.wav');
        (0, fluent_ffmpeg_1.default)(audioPath)
            .audioChannels(1)
            .audioFrequency(8000)
            .format('wav')
            .on('end', async () => {
            try {
                // Read the WAV file and extract amplitude data
                const buffer = await promises_1.default.readFile(tempWavPath);
                const samples = extractWaveformSamples(buffer, 100);
                // Clean up temp file
                await promises_1.default.unlink(tempWavPath);
                resolve(JSON.stringify(samples));
            }
            catch (error) {
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
exports.generateAudioWaveform = generateAudioWaveform;
/**
 * Extract waveform samples from WAV buffer
 */
function extractWaveformSamples(buffer, sampleCount) {
    const samples = [];
    const dataStart = 44; // WAV header is 44 bytes
    const dataLength = buffer.length - dataStart;
    const step = Math.floor(dataLength / sampleCount / 2); // 2 bytes per sample (16-bit)
    for (let i = 0; i < sampleCount; i++) {
        const offset = dataStart + i * step * 2;
        if (offset + 1 < buffer.length) {
            const sample = buffer.readInt16LE(offset);
            const normalized = Math.abs(sample) / 32768; // Normalize to 0-1
            samples.push(Math.round(normalized * 100) / 100);
        }
        else {
            samples.push(0);
        }
    }
    return samples;
}
/**
 * Process GIF (validate and optimize)
 */
const processGif = async (inputPath, maxSize = 5 * 1024 * 1024 // 5MB
) => {
    try {
        const stats = await promises_1.default.stat(inputPath);
        if (stats.size > maxSize) {
            throw new Error('GIF file too large');
        }
        // For now, just return the original path
        // In production, you might want to optimize the GIF
        return inputPath;
    }
    catch (error) {
        console.error('Error processing GIF:', error);
        throw error;
    }
};
exports.processGif = processGif;
/**
 * Process uploaded media file
 */
const processMedia = async (filePath, mimeType) => {
    const result = {
        originalPath: filePath,
    };
    try {
        if (mimeType.startsWith('image/')) {
            if (mimeType === 'image/gif') {
                result.compressedPath = await (0, exports.processGif)(filePath);
            }
            else {
                // Try to compress, but keep original if compression fails
                const compressed = await (0, exports.compressImage)(filePath);
                // Only use compressed if it's different from original (compression succeeded)
                if (compressed !== filePath) {
                    result.compressedPath = compressed;
                }
                // Always keep original path available
            }
        }
        else if (mimeType.startsWith('video/')) {
            result.thumbnailPath = await (0, exports.generateVideoThumbnail)(filePath);
            result.duration = await (0, exports.getVideoDuration)(filePath);
        }
        else if (mimeType.startsWith('audio/')) {
            result.duration = await (0, exports.getAudioDuration)(filePath);
            result.waveform = await (0, exports.generateAudioWaveform)(filePath);
        }
        return result;
    }
    catch (error) {
        console.error('Error processing media:', error);
        // Return original path if processing fails
        return result;
    }
};
exports.processMedia = processMedia;
//# sourceMappingURL=mediaService.js.map