-- Rename columns from Romanian to English
ALTER TABLE "users" RENAME COLUMN "nume" TO "first_name";
ALTER TABLE "users" RENAME COLUMN "prenume" TO "last_name";
ALTER TABLE "users" RENAME COLUMN "imagine_profil" TO "profile_image";
