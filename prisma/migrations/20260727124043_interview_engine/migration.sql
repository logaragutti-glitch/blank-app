-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "aiClarifyAttempted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiClarifyQuestion" TEXT;
