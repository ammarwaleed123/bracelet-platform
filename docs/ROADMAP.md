# Roadmap

## Phase 1 — Launchable core (current)
See `PHASE-1-SPEC.md`. Outcome: a premium 3D bracelet studio + gallery + COD/Paymob commerce, live in Egypt.

## Phase 2 — Differentiators (fast follows after launch)
- **AI Bracelet Designer** — guided flow (occasion, recipient, colors, interests, budget) → Claude API returns 3 complete designs as JSON referencing real catalog items in stock → each opens in the studio fully editable. Server-side endpoint; catalog passed as structured context; strict JSON schema output; budget respected in piastres.
- **AI Style Match** — user uploads outfit/accessory photos → Claude vision extracts palette + style descriptors → same design-generation pipeline as above.
- **Bracelet Passport (Bracelet DNA)** — upgrade `/design/[publicId]` into a full passport: unique ID, name, birth date, materials & meanings, design lineage (`forkedFromDesignId` chain), owner (opt-in), beautiful shareable page + OG image. Physical QR card in every box linking to it.
- **Full 3D inspect mode** — richer materials/lighting (HDRI environment), charm glTF models, optional turntable video export for sharing.

## Phase 3 — The moat
- **Build Together** — real-time collaborative studio sessions via Yjs (CRDT) with invite links, presence cursors, per-user selection colors. Supabase Realtime or a small WebSocket service as transport.
- **Charm Unlock System** — engagement/loyalty progression: purchase milestones, seasonal events unlock `isPremium` components; unlocked items visually distinct in the palette; `user_unlocks` table.
- **AR "See It On My Wrist"** — browser-based wrist tracking (MediaPipe Hands) + Three.js overlay on the camera feed; mobile Safari/Chrome. Ship only when it feels magical, not merely functional.
- Courier API integration (Bosta/Mylerz), email/SMS notification flows, Arabic + RTL localization.

## Git workflow (applies to every phase)
- `main` is always deployable; feature branches per milestone (`feat/studio-core`, `feat/checkout`, ...).
- Merge to `main` only when the build passes with zero TypeScript errors.
- Tag every completed milestone (`phase-1.1` ... `phase-3.x`) and push tags: `git push origin main --tags`.
- Vercel deploys `main` to production; preview deployments on every branch.
