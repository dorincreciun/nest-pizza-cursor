-- AlterTable
ALTER TABLE "products" ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];
