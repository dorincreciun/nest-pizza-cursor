-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "default_extra_price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "size_price_modifiers" JSONB;
