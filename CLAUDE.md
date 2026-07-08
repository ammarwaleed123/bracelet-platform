# CLAUDE.md — Project Instructions

You are building a premium, made-to-order custom bracelet e-commerce platform for the Egyptian market. Read `docs/PHASE-1-SPEC.md` before implementing anything. Read `docs/ROADMAP.md` to understand what is deliberately OUT of scope for the current phase.

## Non-negotiable decisions (do not revisit these)

- **Stack:** Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL on Supabase, accessed via Drizzle ORM. Supabase Auth for authentication (email/password + Google). Supabase Storage for images.
- **3D:** React Three Fiber + drei. The Bracelet Studio is 3D from day one — never build a 2D canvas editor.
- **State:** Zustand for studio state (with undo/redo via a history stack). Server state via React Server Components + server actions; use TanStack Query only where client-side refetching is genuinely needed.
- **Payments:** Cash on Delivery first (launch blocker), Paymob second (fast follow). No Stripe — it does not operate in Egypt.
- **Market:** Egypt. Currency is EGP everywhere. Prices stored as integers in piastres (1 EGP = 100 piastres). English-only UI (no i18n framework, but do not hardcode copy into components — keep user-facing strings in a `content/` module so translation is possible later).
- **Deployment:** Vercel.

## Engineering conventions

- Server Components by default; `"use client"` only where interactivity requires it.
- All mutations go through server actions with Zod validation at the boundary.
- Money is always integer piastres in the database and logic; format to EGP only at render time via a single `formatPrice()` utility.
- Every catalog entity (bead, charm, base) has a `stockQuantity`; the studio must disable out-of-stock components, never hide them.
- Pricing is always computed server-side from the catalog at add-to-cart and at order creation. Never trust a client-supplied price.
- Saved designs store a versioned JSON structure (`designSchemaVersion`) so old designs survive schema evolution.
- Accessible by default: keyboard navigation in the studio, alt text, focus states, prefers-reduced-motion respected on all animations.
- Mobile is not an afterthought: the studio must be fully usable with touch (drag, pinch-zoom, tap-to-select) — test at 375px width.

## Design language (see spec §2 for full detail)

Luxury through restraint: generous whitespace, refined serif display type over clean sans body, muted warm neutrals with one accent, subtle motion (150–250ms ease-out), rounded-2xl surfaces, no visual clutter. Never use default browser styles, harsh shadows, or saturated rainbow palettes.

## Workflow

- Work in feature branches; merge to `main` only when the milestone builds cleanly (`npm run build` passes, no TypeScript errors).
- Each roadmap milestone ends with a tagged release (`phase-1.1`, `phase-1.2`, ...) pushed to GitHub.
- Write meaningful commit messages: what changed and why, present tense.
- When a decision is ambiguous, choose the simpler implementation and leave a `// DECISION:` comment explaining the tradeoff — do not add configuration options speculatively.
- Never commit secrets. All keys live in `.env.local` (gitignored); keep `.env.example` current.
