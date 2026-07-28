-- CreateTable
CREATE TABLE "PendingAnalysis" (
    "id" TEXT NOT NULL,
    "resumeText" TEXT NOT NULL,
    "jobDescriptionText" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingAnalysis_createdAt_idx" ON "PendingAnalysis"("createdAt");
