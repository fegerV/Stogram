-- AlterTable
ALTER TABLE "Bot" ADD COLUMN     "apiAllowedUpdates" JSONB,
ADD COLUMN     "apiWebhookSecret" TEXT,
ADD COLUMN     "lastUpdateId" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "menuButton" JSONB;

-- AlterTable
ALTER TABLE "BotInlineQuery" ADD COLUMN     "results" JSONB;

-- CreateTable
CREATE TABLE "BotApiUpdate" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "updateId" INTEGER NOT NULL,
    "updateType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotApiUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BotApiUpdate_botId_consumedAt_idx" ON "BotApiUpdate"("botId", "consumedAt");

-- CreateIndex
CREATE INDEX "BotApiUpdate_createdAt_idx" ON "BotApiUpdate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BotApiUpdate_botId_updateId_key" ON "BotApiUpdate"("botId", "updateId");

-- AddForeignKey
ALTER TABLE "BotApiUpdate" ADD CONSTRAINT "BotApiUpdate_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

