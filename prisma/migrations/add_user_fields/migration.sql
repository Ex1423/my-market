-- AlterTable: Add missing User fields
-- Add avatar field
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;

-- Add phone field  
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Add notificationSound field
ALTER TABLE "User" ADD COLUMN "notificationSound" TEXT DEFAULT 'default';
