import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EncryptionService {
  // Generate RSA key pair for user
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
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
  static encryptPrivateKey(privateKey: string, password: string): string {
    const algorithm = 'aes-256-gcm';
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
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
  static decryptPrivateKey(encryptedData: string, password: string): string {
    const algorithm = 'aes-256-gcm';
    const data = JSON.parse(encryptedData);
    
    const salt = Buffer.from(data.salt, 'base64');
    const iv = Buffer.from(data.iv, 'base64');
    const authTag = Buffer.from(data.authTag, 'base64');
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Initialize E2E encryption for user
  static async initializeUserEncryption(userId: string, password: string): Promise<void> {
    const { publicKey, privateKey } = this.generateKeyPair();
    const encryptedPrivateKey = this.encryptPrivateKey(privateKey, password);

    await prisma.user.update({
      where: { id: userId },
      data: {
        publicKey,
        encryptedPrivateKey,
      },
    });
  }

  // Initialize E2E encryption for chat
  static async initializeChatEncryption(chatId: string): Promise<string> {
    const { publicKey } = this.generateKeyPair();
    
    const encryptionKey = await prisma.chatEncryptionKey.create({
      data: {
        chatId,
        publicKey,
        keyVersion: 1,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        encryptionType: 'e2e',
        encryptionKeyId: encryptionKey.id,
      },
    });

    return encryptionKey.id;
  }

  // Encrypt message content
  static encryptMessage(content: string, publicKey: string): string {
    const buffer = Buffer.from(content, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    
    return encrypted.toString('base64');
  }

  // Decrypt message content
  static decryptMessage(encryptedContent: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedContent, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    
    return decrypted.toString('utf8');
  }

  // Generate symmetric key for file encryption
  static generateSymmetricKey(): Buffer {
    return crypto.randomBytes(32);
  }

  // Encrypt file with symmetric key
  static encryptFile(fileBuffer: Buffer, key: Buffer): { encrypted: Buffer; iv: Buffer } {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    
    return { encrypted, iv };
  }

  // Decrypt file with symmetric key
  static decryptFile(encryptedBuffer: Buffer, key: Buffer, iv: Buffer): Buffer {
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  }
}
