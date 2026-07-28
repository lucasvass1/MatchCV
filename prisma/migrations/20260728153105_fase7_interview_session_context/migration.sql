/*
  Warnings:

  - Added the required column `jobDescriptionText` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resumeText` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "jobDescriptionText" TEXT NOT NULL,
ADD COLUMN     "resumeText" TEXT NOT NULL,
ADD COLUMN     "strengths" TEXT[],
ADD COLUMN     "weaknesses" TEXT[];
