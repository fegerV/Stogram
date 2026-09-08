/**
 * Enhanced Bot System - Telegram-like bot functionality
 *
 * Features:
 * - Inline keyboard support
 * - Reply keyboard support
 * - Inline query results
 * - Message entities parsing
 * - Chat actions (typing, upload_photo, etc.)
 * - Bot context management
 */
export interface InlineKeyboardButton {
    text: string;
    url?: string;
    callback_data?: string;
    switch_inline_query?: string;
    switch_inline_query_current_chat?: string;
}
export interface InlineKeyboardMarkup {
    inline_keyboard: InlineKeyboardButton[][];
}
export interface ReplyKeyboardButton {
    text: string;
    request_contact?: boolean;
    request_location?: boolean;
}
export interface ReplyKeyboardMarkup {
    keyboard: ReplyKeyboardButton[][];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    selective?: boolean;
}
export interface MessageEntity {
    type: 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' | 'email' | 'phone_number' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'pre' | 'text_link' | 'text_mention';
    offset: number;
    length: number;
    url?: string;
    user?: {
        id: string;
        username?: string;
    };
}
export interface BotContext {
    botId: string;
    chatId: string;
    userId: string;
    messageId?: string;
    callbackQueryId?: string;
    inlineQueryId?: string;
}
export declare const parseMessageEntities: (text: string) => MessageEntity[];
export declare const buildInlineKeyboard: (rows: InlineKeyboardButton[][]) => InlineKeyboardMarkup;
export declare const buildReplyKeyboard: (rows: string[][], options?: {
    resize?: boolean;
    oneTime?: boolean;
}) => ReplyKeyboardMarkup;
export declare const sendChatAction: (botId: string, chatId: string, action: string) => Promise<boolean>;
export declare const answerCallbackQuery: (botId: string, callbackQueryId: string, options?: {
    text?: string;
    show_alert?: boolean;
    url?: string;
    cache_time?: number;
}) => Promise<boolean>;
export declare const answerInlineQuery: (botId: string, inlineQueryId: string, results: Array<{
    type: string;
    id: string;
    title?: string;
    description?: string;
    input_message_content?: any;
    photo_url?: string;
    thumbnail_url?: string;
    document_url?: string;
    audio_url?: string;
    video_url?: string;
    gif_url?: string;
    voice_url?: string;
}>, options?: {
    cache_time?: number;
    is_personal?: boolean;
    next_offset?: string;
    button?: {
        text: string;
        web_app?: {
            url: string;
        };
        start_parameter?: string;
    };
}) => Promise<boolean>;
export declare const editMessageText: (botId: string, messageId: string, newText: string, options?: {
    parse_mode?: "Markdown" | "HTML";
    entities?: MessageEntity[];
    reply_markup?: InlineKeyboardMarkup;
}) => Promise<boolean>;
export declare const editMessageReplyMarkup: (botId: string, messageId: string, replyMarkup: InlineKeyboardMarkup) => Promise<boolean>;
export declare const deleteMessage: (botId: string, messageId: string) => Promise<boolean>;
export declare const getChatAdministrators: (chatId: string) => Promise<Array<{
    userId: string;
    role: string;
}>>;
export declare const getChatMemberCount: (chatId: string) => Promise<number>;
export declare const getChatMember: (chatId: string, userId: string) => Promise<{
    id: string;
    userId: string;
    chatId: string;
    joinedAt: Date;
    role: import(".prisma/client").$Enums.MemberRole;
    mutedUntil: Date | null;
    permissions: import("@prisma/client/runtime/library").JsonValue | null;
    adminPermissions: import("@prisma/client/runtime/library").JsonValue | null;
} | null>;
export declare const setChatPermissions: (chatId: string, permissions: {
    can_send_messages?: boolean;
    can_send_audios?: boolean;
    can_send_documents?: boolean;
    can_send_photos?: boolean;
    can_send_videos?: boolean;
    can_send_video_notes?: boolean;
    can_send_voice_notes?: boolean;
    can_send_polls?: boolean;
    can_send_other_messages?: boolean;
    can_add_web_page_previews?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_pin_messages?: boolean;
}) => Promise<boolean>;
export declare const kickChatMember: (chatId: string, userId: string, untilDate?: Date) => Promise<boolean>;
export declare const unbanChatMember: (chatId: string, userId: string) => Promise<boolean>;
export declare const restrictChatMember: (chatId: string, userId: string, permissions: {
    can_send_messages?: boolean;
    can_send_media?: boolean;
    can_send_polls?: boolean;
    can_send_other_messages?: boolean;
    can_add_web_page_previews?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_pin_messages?: boolean;
}) => Promise<boolean>;
export declare const promoteChatMember: (chatId: string, userId: string, options: {
    is_anonymous?: boolean;
    can_manage_chat?: boolean;
    can_delete_messages?: boolean;
    can_manage_video_chats?: boolean;
    can_restrict_members?: boolean;
    can_promote_members?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_post_messages?: boolean;
    can_edit_messages?: boolean;
    can_pin_messages?: boolean;
}) => Promise<boolean>;
export declare const exportChatInviteLink: (chatId: string) => Promise<string>;
export declare const createChatInviteLink: (chatId: string, options: {
    name?: string;
    expireDate?: Date;
    memberLimit?: number;
    creates_join_request?: boolean;
}) => Promise<{
    inviteLink: string;
    inviteCode: string;
}>;
export declare const revokeChatInviteLink: (chatId: string, inviteCode: string) => Promise<boolean>;
//# sourceMappingURL=enhancedBotService.d.ts.map