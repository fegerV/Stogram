"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../utils/prisma"));
class EncryptionService {
    // Generate RSA key pair for user
    static generateKeyPair() {
        const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });
        return { publicKey, privateKey };
    }
    // Encrypt private key with user password
    static encryptPrivateKey(privateKey, password) {
        const algorithm = 'aes-256-gcm';
        const salt = crypto_1.default.randomBytes(32);
        const key = crypto_1.default.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(privateKey, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag();
        return JSON.stringify({
            encrypted,
            salt: salt.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
        });
    }
    // Decrypt private key with user password
    static decryptPrivateKey(encryptedData, password) {
        const algorithm = 'aes-256-gcm';
        const data = JSON.parse(encryptedData);
        const salt = Buffer.from(data.salt, 'base64');
        const iv = Buffer.from(data.iv, 'base64');
        const authTag = Buffer.from(data.authTag, 'base64');
        const key = crypto_1.default.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    // Initialize E2E encryption for user
    static async initializeUserEncryption(userId, password) {
        const { publicKey, privateKey } = this.generateKeyPair();
        const encryptedPrivateKey = this.encryptPrivateKey(privateKey, password);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                publicKey,
                encryptedPrivateKey,
            },
        });
    }
    // Initialize E2E encryption for chat
    static async initializeChatEncryption(chatId) {
        const { publicKey } = this.generateKeyPair();
        const encryptionKey = await prisma_1.default.chatEncryptionKey.create({
            data: {
                chatId,
                publicKey,
                keyVersion: 1,
            },
        });
        await prisma_1.default.chat.update({
            where: { id: chatId },
            data: {
                encryptionType: 'e2e',
                encryptionKeyId: encryptionKey.id,
            },
        });
        return encryptionKey.id;
    }
    // Encrypt message content
    static encryptMessage(content, publicKey) {
        const buffer = Buffer.from(content, 'utf8');
        const encrypted = crypto_1.default.publicEncrypt({
            key: publicKey,
            padding: crypto_1.default.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        }, buffer);
        return encrypted.toString('base64');
    }
    // Decrypt message content
    static decryptMessage(encryptedContent, privateKey) {
        const buffer = Buffer.from(encryptedContent, 'base64');
        const decrypted = crypto_1.default.privateDecrypt({
            key: privateKey,
            padding: crypto_1.default.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        }, buffer);
        return decrypted.toString('utf8');
    }
    // Generate symmetric key for file encryption
    static generateSymmetricKey() {
        return crypto_1.default.randomBytes(32);
    }
    // Encrypt file with symmetric key
    static encryptFile(fileBuffer, key) {
        const algorithm = 'aes-256-cbc';
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
        return { encrypted, iv };
    }
    // Decrypt file with symmetric key
    static decryptFile(encryptedBuffer, key, iv) {
        const algorithm = 'aes-256-cbc';
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
        return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    }
}
exports.EncryptionService = EncryptionService;
//# sourceMappingURL=encryptionService.js.map