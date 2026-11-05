-- Old chunks remain intact until rebuilt. Retrieval ignores their empty metadata.
ALTER TABLE "TranscriptChunk" ADD COLUMN "segments" JSONB NOT NULL DEFAULT '[]';
