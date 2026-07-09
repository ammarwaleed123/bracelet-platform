CREATE TYPE "public"."base_type" AS ENUM('chain', 'cord', 'bangle');--> statement-breakpoint
CREATE TYPE "public"."bead_finish" AS ENUM('polished', 'matte', 'faceted', 'metallic');--> statement-breakpoint
CREATE TYPE "public"."charm_shape" AS ENUM('heart', 'star', 'moon', 'letter', 'custom');--> statement-breakpoint
CREATE TYPE "public"."design_status" AS ENUM('draft', 'saved', 'published_private', 'published_public');--> statement-breakpoint
CREATE TABLE "bases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"type" "base_type" NOT NULL,
	"material" text,
	"color_hex" text DEFAULT '#C7A15A' NOT NULL,
	"price_in_piastres" integer NOT NULL,
	"image_url" text,
	"model_3d_params" jsonb,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "bead_categories" (
	"bead_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "bead_categories_bead_id_category_id_pk" PRIMARY KEY("bead_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "beads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"stone_type" text,
	"meaning" text,
	"color_hex" text DEFAULT '#FFFFFF' NOT NULL,
	"finish" "bead_finish" DEFAULT 'polished' NOT NULL,
	"diameter_mm" numeric(4, 1) DEFAULT '8.0' NOT NULL,
	"price_in_piastres" integer NOT NULL,
	"image_url" text,
	"material_3d_params" jsonb,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "beads_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "charm_categories" (
	"charm_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "charm_categories_charm_id_category_id_pk" PRIMARY KEY("charm_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "charms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"stone_type" text,
	"meaning" text,
	"color_hex" text DEFAULT '#C7A15A' NOT NULL,
	"finish" "bead_finish" DEFAULT 'metallic' NOT NULL,
	"diameter_mm" numeric(4, 1) DEFAULT '10.0' NOT NULL,
	"price_in_piastres" integer NOT NULL,
	"image_url" text,
	"material_3d_params" jsonb,
	"charm_shape" charm_shape DEFAULT 'custom' NOT NULL,
	"letter_value" text,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collection_designs" (
	"collection_id" uuid NOT NULL,
	"design_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "collection_designs_collection_id_design_id_pk" PRIMARY KEY("collection_id","design_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"hero_image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "design_likes" (
	"design_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "design_likes_design_id_user_id_pk" PRIMARY KEY("design_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"status" "design_status" DEFAULT 'draft' NOT NULL,
	"base_id" uuid,
	"size_cm" numeric(4, 1) DEFAULT '18.0' NOT NULL,
	"components_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"design_schema_version" integer DEFAULT 1 NOT NULL,
	"price_snapshot_in_piastres" integer DEFAULT 0 NOT NULL,
	"thumbnail_url" text,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"forked_from_design_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "designs_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "bead_categories" ADD CONSTRAINT "bead_categories_bead_id_beads_id_fk" FOREIGN KEY ("bead_id") REFERENCES "public"."beads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bead_categories" ADD CONSTRAINT "bead_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charm_categories" ADD CONSTRAINT "charm_categories_charm_id_charms_id_fk" FOREIGN KEY ("charm_id") REFERENCES "public"."charms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charm_categories" ADD CONSTRAINT "charm_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_designs" ADD CONSTRAINT "collection_designs_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_designs" ADD CONSTRAINT "collection_designs_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_likes" ADD CONSTRAINT "design_likes_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_likes" ADD CONSTRAINT "design_likes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_base_id_bases_id_fk" FOREIGN KEY ("base_id") REFERENCES "public"."bases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- ===================================================================
-- Custom SQL (not emitted by Drizzle): profile trigger, RLS, storage.
-- Kept in this migration so it applies via `npm run db:migrate`.
-- Drizzle's snapshot does not track these, so future generates leave them be.
-- ===================================================================

-- 1) Auto-create a profile row on signup; backfill any existing users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$func$;--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();--> statement-breakpoint

INSERT INTO public.profiles (id, full_name)
SELECT id, raw_user_meta_data->>'full_name' FROM auth.users
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

-- 2) Row-Level Security (defense in depth). The app reads/writes via Drizzle
--    on the Postgres role, which bypasses RLS; these policies protect against
--    direct access using a leaked anon/authenticated key. Enabling RLS with
--    no write policy denies writes by default.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.beads ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.charms ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.bead_categories ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.charm_categories ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.collection_designs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "catalog_read_categories" ON public.categories FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "catalog_read_bases" ON public.bases FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "catalog_read_beads" ON public.beads FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "catalog_read_charms" ON public.charms FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "catalog_read_bead_categories" ON public.bead_categories FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "catalog_read_charm_categories" ON public.charm_categories FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "catalog_read_collections" ON public.collections FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "catalog_read_collection_designs" ON public.collection_designs FOR SELECT USING (true);--> statement-breakpoint

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT USING ((SELECT auth.uid()) = id);--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);--> statement-breakpoint

ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "designs_read_public_or_own" ON public.designs FOR SELECT USING (status = 'published_public' OR (SELECT auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "designs_insert_own" ON public.designs FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "designs_update_own" ON public.designs FOR UPDATE USING ((SELECT auth.uid()) = owner_id) WITH CHECK ((SELECT auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "designs_delete_own" ON public.designs FOR DELETE USING ((SELECT auth.uid()) = owner_id);--> statement-breakpoint

ALTER TABLE public.design_likes ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "design_likes_read" ON public.design_likes FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "design_likes_insert_own" ON public.design_likes FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);--> statement-breakpoint
CREATE POLICY "design_likes_delete_own" ON public.design_likes FOR DELETE USING ((SELECT auth.uid()) = user_id);--> statement-breakpoint

-- 3) Storage bucket for catalog + design imagery (public read; uploads are
--    done server-side with the service-role key, which bypasses storage RLS).
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog', 'catalog', true)
ON CONFLICT (id) DO NOTHING;
