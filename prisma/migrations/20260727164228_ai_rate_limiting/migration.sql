-- CreateTable
CREATE TABLE "ai_rate_limit_hits" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_rate_limit_hits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_rate_limit_hits_organizationId_route_createdAt_idx" ON "ai_rate_limit_hits"("organizationId", "route", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_rate_limit_hits" ADD CONSTRAINT "ai_rate_limit_hits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
