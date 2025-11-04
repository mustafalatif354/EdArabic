ALTER TABLE progress
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Add level column to user_profiles (default 1 for new users)
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Update existing users to have default values if they don't have them
UPDATE progress 
SET xp = 0 WHERE xp IS NULL;

UPDATE progress 
SET level = 1 WHERE level IS NULL;

-- Add constraints to ensure valid values
ALTER TABLE progress 
ADD CONSTRAINT xp_non_negative CHECK (xp >= 0);

ALTER TABLE progress 
ADD CONSTRAINT level_positive CHECK (level >= 1);

-- Optional: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_progress_xp ON progress(xp DESC);
CREATE INDEX IF NOT EXISTS idx_progress_level ON progress(level DESC);