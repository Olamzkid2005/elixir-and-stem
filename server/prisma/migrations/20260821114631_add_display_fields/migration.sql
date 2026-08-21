-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "deliveryEtaMax" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "deliveryEtaMin" INTEGER NOT NULL DEFAULT 45;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "effects" JSONB,
ADD COLUMN     "imageColor" TEXT DEFAULT '#d0e9d4';
