-- CreateEnum
CREATE TYPE "NotificationLevel" AS ENUM ('ALL', 'MENTIONS', 'MUTED');

-- AlterTable: Add pinnedMessageId to Chat
ALTER TABLE "Chat" ADD COLUMN "pinnedMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_pinnedMessageId_key" ON "Chat"("pinnedMessageId");

-- AddForeignKey: Chat -> Message (pinnedMessage)
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_pinnedMessageId_fkey" FOREIGN KEY ("pinnedMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add notificationLevel to ChatSettings
ALTER TABLE "ChatSettings" ADD COLUMN "notificationLevel" "NotificationLevel" NOT NULL DEFAULT 'ALL';
