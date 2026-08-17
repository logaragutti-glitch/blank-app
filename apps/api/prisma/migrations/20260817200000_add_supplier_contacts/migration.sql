ALTER TABLE "suppliers"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "instagram_url" TEXT,
  ADD COLUMN "service_area" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "source_url" TEXT,
  ADD COLUMN "validation_level" TEXT,
  ADD COLUMN "contact_status" TEXT NOT NULL DEFAULT 'UNCONFIRMED',
  ADD COLUMN "last_validated_at" TIMESTAMPTZ(6);
