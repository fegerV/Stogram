ALTER TABLE "Message"
ADD COLUMN IF NOT EXISTS "botId" TEXT;

CREATE INDEX IF NOT EXISTS "Message_botId_idx" ON "Message"("botId");

ALTER TABLE "Message"
ADD CONSTRAINT "Message_botId_fkey"
FOREIGN KEY ("botId") REFERENCES "Bot"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "BotChatInstallation" (
  "id" TEXT NOT NULL,
  "botId" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "installedBy" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BotChatInstallation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BotChatInstallation_botId_chatId_key"
ON "BotChatInstallation"("botId", "chatId");

CREATE INDEX IF NOT EXISTS "BotChatInstallation_botId_idx"
ON "BotChatInstallation"("botId");

CREATE INDEX IF NOT EXISTS "BotChatInstallation_chatId_idx"
ON "BotChatInstallation"("chatId");

CREATE INDEX IF NOT EXISTS "BotChatInstallation_installedBy_idx"
ON "BotChatInstallation"("installedBy");

CREATE INDEX IF NOT EXISTS "BotChatInstallation_isActive_idx"
ON "BotChatInstallation"("isActive");

ALTER TABLE "BotChatInstallation"
ADD CONSTRAINT "BotChatInstallation_botId_fkey"
FOREIGN KEY ("botId") REFERENCES "Bot"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "BotChatInstallation"
ADD CONSTRAINT "BotChatInstallation_chatId_fkey"
FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
