-- CreateEnum
CREATE TYPE "TranscriptionJobStatus" AS ENUM ('WAITING', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "TranscriptionJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "sessionId" TEXT,
    "transcriptionUrl" TEXT,
    "filename" TEXT,
    "status" "TranscriptionJobStatus" NOT NULL DEFAULT 'WAITING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranscriptionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "transcriptionJobId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "speakerName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptionJob_sourceId_key" ON "TranscriptionJob"("sourceId");
CREATE INDEX "TranscriptionJob_status_availableAt_idx" ON "TranscriptionJob"("status", "availableAt");
CREATE INDEX "TranscriptionJob_meetingId_idx" ON "TranscriptionJob"("meetingId");
CREATE INDEX "TranscriptSegment_meetingId_startMs_idx" ON "TranscriptSegment"("meetingId", "startMs");
CREATE INDEX "TranscriptSegment_meetingId_sessionId_idx" ON "TranscriptSegment"("meetingId", "sessionId");
CREATE UNIQUE INDEX "TranscriptSegment_transcriptionJobId_sequence_key" ON "TranscriptSegment"("transcriptionJobId", "sequence");

-- AddForeignKey
ALTER TABLE "TranscriptionJob" ADD CONSTRAINT "TranscriptionJob_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_transcriptionJobId_fkey" FOREIGN KEY ("transcriptionJobId") REFERENCES "TranscriptionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
