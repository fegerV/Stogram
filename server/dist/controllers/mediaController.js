"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveUploadedMedia = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const uploadRoot = path_1.default.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
const normalizeUploadPath = (rawPath) => {
    const withoutPrefix = rawPath.replace(/\\/g, '/').replace(/^\/?uploads\//, '');
    const normalized = path_1.default.posix.normalize(withoutPrefix).replace(/^(\.\.(\/|\\|$))+/, '');
    if (!normalized || normalized.startsWith('../') || path_1.default.isAbsolute(normalized)) {
        return null;
    }
    const absolutePath = path_1.default.resolve(uploadRoot, normalized);
    if (!absolutePath.startsWith(uploadRoot + path_1.default.sep) && absolutePath !== uploadRoot) {
        return null;
    }
    return {
        mediaPath: `/uploads/${normalized}`,
        absolutePath,
    };
};
const userCanAccessUploadedPath = async (mediaPath, userId) => {
    const message = await prisma_1.default.message.findFirst({
        where: {
            OR: [
                { fileUrl: mediaPath },
                { thumbnailUrl: mediaPath },
                { originalFileUrl: mediaPath },
            ],
            chat: {
                members: {
                    some: { userId },
                },
            },
        },
        select: { id: true },
    });
    if (message) {
        return true;
    }
    const chatAvatar = await prisma_1.default.chat.findFirst({
        where: {
            avatar: mediaPath,
            members: {
                some: { userId },
            },
        },
        select: { id: true },
    });
    if (chatAvatar) {
        return true;
    }
    const userAvatar = await prisma_1.default.user.findFirst({
        where: {
            avatar: mediaPath,
            OR: [
                { id: userId },
                {
                    chatMembers: {
                        some: {
                            chat: {
                                members: {
                                    some: { userId },
                                },
                            },
                        },
                    },
                },
            ],
        },
        select: { id: true },
    });
    if (userAvatar) {
        return true;
    }
    const publicSticker = await prisma_1.default.sticker.findFirst({
        where: {
            imageUrl: mediaPath,
            pack: {
                OR: [
                    { isPublic: true },
                    { creatorId: userId },
                ],
            },
        },
        select: { id: true },
    });
    if (publicSticker) {
        return true;
    }
    const stickerPack = await prisma_1.default.stickerPack.findFirst({
        where: {
            thumbnail: mediaPath,
            OR: [
                { isPublic: true },
                { creatorId: userId },
            ],
        },
        select: { id: true },
    });
    return Boolean(stickerPack);
};
const serveUploadedMedia = async (req, res) => {
    try {
        const requestedPath = req.params[0];
        const userId = req.userId;
        const resolved = normalizeUploadPath(requestedPath);
        if (!resolved || !fs_1.default.existsSync(resolved.absolutePath)) {
            return res.status(404).json({ error: 'Media not found' });
        }
        if (!(await userCanAccessUploadedPath(resolved.mediaPath, userId))) {
            return res.status(404).json({ error: 'Media not found' });
        }
        const stat = fs_1.default.statSync(resolved.absolutePath);
        const fileSize = stat.size;
        const lastModified = stat.mtime.toUTCString();
        const etag = `W/"${fileSize}-${stat.mtimeMs}"`;
        // Set cache and ETag headers
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.setHeader('ETag', etag);
        res.setHeader('Last-Modified', lastModified);
        res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
        res.setHeader('Vary', 'Accept-Encoding');
        // Check if client has a matching ETag (conditional request)
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) {
            return res.status(304).end();
        }
        // Check Last-Modified (fallback for browsers that don't support ETag)
        const ifModifiedSince = req.headers['if-modified-since'];
        if (ifModifiedSince && new Date(ifModifiedSince) >= stat.mtime) {
            return res.status(304).end();
        }
        if (req.query.download === '1') {
            return res.download(resolved.absolutePath);
        }
        return res.sendFile(resolved.absolutePath);
    }
    catch (error) {
        console.error('Serve media error:', error);
        return res.status(500).json({ error: 'Failed to serve media' });
    }
};
exports.serveUploadedMedia = serveUploadedMedia;
//# sourceMappingURL=mediaController.js.map