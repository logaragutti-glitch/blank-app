-- AddColumn: real photos for the Knowledge Graph catalog (venue spaces,
-- supplier pieces, materials — flowers/furniture/lighting/etc.). Only S3
-- storage keys are persisted; signed URLs are computed fresh on every
-- read by KnowledgeGraphController, same pattern as InspirationImage.
ALTER TABLE "venues" ADD COLUMN "photo_keys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "suppliers" ADD COLUMN "photo_keys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "materials" ADD COLUMN "photo_keys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
