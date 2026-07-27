-- AlterTable
ALTER TABLE "timeline_items" ADD COLUMN     "timeLabel" TEXT,
ALTER COLUMN "startsAt" DROP NOT NULL;
