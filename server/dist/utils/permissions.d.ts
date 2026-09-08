export type ChatRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type ChatType = 'PRIVATE' | 'GROUP' | 'CHANNEL';
export interface ChatMembership {
    userId: string;
    chatId: string;
    role: ChatRole;
    chat: {
        id: string;
        type: ChatType;
    };
}
export declare const getChatMembership: (chatId: string, userId: string) => Promise<ChatMembership | null>;
export declare const isChatAdminRole: (role: ChatRole) => role is "OWNER" | "ADMIN";
export declare const assertChatMember: (chatId: string, userId: string) => Promise<ChatMembership>;
export declare const assertChatAdmin: (chatId: string, userId: string) => Promise<ChatMembership>;
export declare const assertCanSendMessage: (chatId: string, userId: string) => Promise<ChatMembership>;
export declare const assertCanPinMessage: (chatId: string, userId: string) => Promise<ChatMembership>;
export declare const assertCanManageChatMedia: (chatId: string, userId: string) => Promise<ChatMembership>;
export declare const checkChatMembership: (chatId: string, userId: string) => Promise<boolean>;
export declare const checkChatAdminPermission: (chatId: string, userId: string) => Promise<boolean>;
export declare const checkChatOwnership: (chatId: string, userId: string) => Promise<boolean>;
export declare const checkResourceOwnership: (resourceId: string, userId: string, model: "message" | "bot" | "webhook") => Promise<boolean>;
//# sourceMappingURL=permissions.d.ts.map