-- Add JSON prize distribution field to tournaments
ALTER TABLE "Tournament"
ADD COLUMN IF NOT EXISTS "prizeDistribution" JSONB;
