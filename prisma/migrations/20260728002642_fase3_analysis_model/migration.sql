-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeText" TEXT NOT NULL,
    "jobDescriptionText" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "keywordsMatched" TEXT[],
    "keywordsMissing" TEXT[],
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "improvementTips" TEXT[],
    "interviewTips" TEXT[],
    "studySuggestions" TEXT[],
    "interviewQuestions" JSONB NOT NULL,
    "recommendationVerdict" TEXT NOT NULL,
    "recommendationReasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
