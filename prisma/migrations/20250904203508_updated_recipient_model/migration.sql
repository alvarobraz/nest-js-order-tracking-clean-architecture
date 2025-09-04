/*
  Warnings:

  - Changed the type of `number` on the `recipients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `phone` on the `recipients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `zip_code` on the `recipients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."recipients" DROP COLUMN "number",
ADD COLUMN     "number" INTEGER NOT NULL,
DROP COLUMN "phone",
ADD COLUMN     "phone" INTEGER NOT NULL,
DROP COLUMN "zip_code",
ADD COLUMN     "zip_code" INTEGER NOT NULL;
