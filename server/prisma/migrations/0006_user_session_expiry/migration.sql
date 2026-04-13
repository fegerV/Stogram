ALTER TABLE "UserSession"
ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '30 days');

CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");
