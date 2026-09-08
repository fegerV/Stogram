export declare const generateVerificationToken: () => string;
export declare const sendVerificationEmail: (email: string, token: string, username: string) => Promise<void>;
export declare const sendPasswordResetEmail: (email: string, token: string, username: string) => Promise<void>;
//# sourceMappingURL=emailService.d.ts.map