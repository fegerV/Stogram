export declare class EncryptionService {
    static generateKeyPair(): {
        publicKey: string;
        privateKey: string;
    };
    static encryptPrivateKey(privateKey: string, password: string): string;
    static decryptPrivateKey(encryptedData: string, password: string): string;
    static initializeUserEncryption(userId: string, password: string): Promise<void>;
    static initializeChatEncryption(chatId: string): Promise<string>;
    static encryptMessage(content: string, publicKey: string): string;
    static decryptMessage(encryptedContent: string, privateKey: string): string;
    static generateSymmetricKey(): Buffer;
    static encryptFile(fileBuffer: Buffer, key: Buffer): {
        encrypted: Buffer;
        iv: Buffer;
    };
    static decryptFile(encryptedBuffer: Buffer, key: Buffer, iv: Buffer): Buffer;
}
//# sourceMappingURL=encryptionService.d.ts.map