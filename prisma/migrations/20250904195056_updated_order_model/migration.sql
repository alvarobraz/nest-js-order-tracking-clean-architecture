-- AlterTable
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'DELIVERYMAN',
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
