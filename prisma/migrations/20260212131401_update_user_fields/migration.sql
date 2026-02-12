-- AlterTable
ALTER TABLE "users" ADD COLUMN     "imagine_profil" TEXT,
ADD COLUMN     "prenume" TEXT,
ALTER COLUMN "nume" DROP NOT NULL;
