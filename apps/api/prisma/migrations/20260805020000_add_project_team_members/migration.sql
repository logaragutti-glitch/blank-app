-- CreateTable: Equipe do Projeto — which of the org's Users is assigned to
-- a given Event, and in what role. Lightweight join with metadata, same
-- style as venue_preferred_suppliers — no soft delete/versioning, a
-- removal just deletes the row.
CREATE TABLE "project_team_members" (
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_team_members_pkey" PRIMARY KEY ("event_id","user_id")
);

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
