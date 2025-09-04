/*
  Warnings:

  - You are about to drop the column `city` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `recipient_id` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `city` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `neighborhood` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip_code` to the `recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpf` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'DELIVERYMAN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PICKED_UP', 'DELIVERED', 'RETURNED');

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_recipient_id_fkey";

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "city",
DROP COLUMN "neighborhood",
DROP COLUMN "number",
DROP COLUMN "state",
DROP COLUMN "street",
DROP COLUMN "zip_code",
ALTER COLUMN "recipient_id" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."OrderStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."recipients" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "neighborhood" TEXT NOT NULL,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "street" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "zip_code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "cpf" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" "public"."UserRole" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."UserStatus" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "public"."users"("cpf");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
