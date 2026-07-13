/**
 * Apply the AI-designer schema additions directly (idempotent). Used instead of
 * `drizzle-kit push`, which currently crashes introspecting an existing CHECK
 * constraint. Run: npx tsx scripts/apply-ai-schema.ts
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const statements = [
  `DO $$ BEGIN CREATE TYPE design_source AS ENUM ('studio', 'ai_designer'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE ai_provider AS ENUM ('gemini', 'anthropic'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `ALTER TABLE designs ADD COLUMN IF NOT EXISTS source design_source NOT NULL DEFAULT 'studio';`,
  `CREATE TABLE IF NOT EXISTS ai_generations (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
     provider ai_provider NOT NULL,
     model text NOT NULL,
     input_json jsonb NOT NULL DEFAULT '{}'::jsonb,
     success boolean NOT NULL,
     design_count integer NOT NULL DEFAULT 0,
     prompt_tokens integer,
     total_tokens integer,
     error_code text,
     created_at timestamptz NOT NULL DEFAULT now()
   );`,
  `CREATE INDEX IF NOT EXISTS ai_generations_created_at_idx ON ai_generations (created_at);`,
  `CREATE INDEX IF NOT EXISTS ai_generations_user_created_idx ON ai_generations (user_id, created_at);`,
];

async function main() {
  const sql = postgres(url!, { prepare: false, max: 1 });
  for (const s of statements) {
    await sql.unsafe(s);
    console.log("  ✓", s.split("\n")[0]!.slice(0, 70));
  }
  await sql.end();
  console.log("AI schema applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
