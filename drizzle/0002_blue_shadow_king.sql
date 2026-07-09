CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "designs" ADD COLUMN "moderation_status" "moderation_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "store_credit_in_piastres" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Custom SQL: design-thumbnail bucket + tighten designs read policy so only
-- APPROVED public designs are readable by non-owners (defense in depth).
INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', true)
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

DROP POLICY IF EXISTS "designs_read_public_or_own" ON public.designs;--> statement-breakpoint
CREATE POLICY "designs_read_public_or_own" ON public.designs FOR SELECT USING (
  (status = 'published_public' AND moderation_status = 'approved')
  OR (SELECT auth.uid()) = owner_id
);
