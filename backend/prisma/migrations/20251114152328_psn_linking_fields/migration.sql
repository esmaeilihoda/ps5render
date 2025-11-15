-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPsnVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "psnRefreshToken" TEXT;
