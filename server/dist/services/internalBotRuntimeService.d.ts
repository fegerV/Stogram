type JsonRecord = Record<string, unknown>;
declare class InternalBotRuntimeService {
    private deliverToDirectWebhook;
    private sendDefaultCommandReply;
    private sendUnavailableCommandReply;
    private hasExternalRuntime;
    dispatchToBot(botId: string, event: string, data: JsonRecord): Promise<void>;
    dispatchChatMessageEvent(messageId: string, event: 'message.created' | 'message.updated' | 'message.deleted'): Promise<void>;
}
declare const _default: InternalBotRuntimeService;
export default _default;
//# sourceMappingURL=internalBotRuntimeService.d.ts.map