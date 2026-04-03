ALTER TABLE "User"
ADD COLUMN "verificationTokenExpiresAt" TIMESTAMP(3);

CREATE INDEX "User_verificationTokenExpiresAt_idx" ON "User"("verificationTokenExpiresAt");
