ALTER TABLE "Meeting" ADD COLUMN "startedAt" TIMESTAMP(3);

-- Preserve evidence that existing meetings already took place.
UPDATE "Meeting" AS m SET "startedAt" = COALESCE(
  (SELECT MIN(p."firstJoinedAt") FROM "MeetingParticipant" p WHERE p."meetingId" = m.id),
  (SELECT MIN(j."createdAt") FROM "TranscriptionJob" j WHERE j."meetingId" = m.id),
  CASE WHEN m."isComplete" THEN m."startingTime" END
);
-- The previous end button set both flags; ended meetings are not deleted meetings.
UPDATE "Meeting" SET "isDeleted" = false WHERE "isComplete" = true;
