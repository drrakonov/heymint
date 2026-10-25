-- Remove the legacy monetization data. Existing data is disposable for this migration.
DROP TABLE "Payment";
DROP TABLE "MeetingPurchase";
DROP TYPE "PaymentStatus";

ALTER TABLE "Meeting"
DROP COLUMN "isPaid",
DROP COLUMN "price";

-- Persist actual meeting attendance for protected insight authorization.
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstJoinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastJoinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MeetingParticipant_meetingId_userId_key"
ON "MeetingParticipant"("meetingId", "userId");

CREATE INDEX "MeetingParticipant_userId_firstJoinedAt_idx"
ON "MeetingParticipant"("userId", "firstJoinedAt");

ALTER TABLE "MeetingParticipant"
ADD CONSTRAINT "MeetingParticipant_meetingId_fkey"
FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MeetingParticipant"
ADD CONSTRAINT "MeetingParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
