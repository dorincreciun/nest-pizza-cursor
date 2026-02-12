-- Rename columns from Romanian to English naming
-- Drop old columns if they exist and add new ones

-- Drop old columns if they exist
ALTER TABLE "users" DROP COLUMN IF EXISTS "nume";
ALTER TABLE "users" DROP COLUMN IF EXISTS "prenume";
ALTER TABLE "users" DROP COLUMN IF EXISTS "imagine_profil";

-- Add new columns with English names
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image" TEXT;
