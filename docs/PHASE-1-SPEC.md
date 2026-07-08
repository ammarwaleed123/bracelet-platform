# Phase 1 Build Specification — Custom Bracelet Platform

Goal of Phase 1: a launchable, premium e-commerce site for the Egyptian market where a customer can design a bracelet in a 3D studio, browse a gallery of designs, buy via Cash on Delivery (then Paymob), and track their order. Every bracelet is handmade to order — there is no finished-goods inventory, only component-level stock.

Reference experience: myastris.com (designer-first funnel, gallery-as-catalog). We match its core, then exceed it in later phases with AI, passports, AR, and collaboration.

---

## 1. Site map (Phase 1)

| Route | Purpose |
|---|---|
| `/` | Home — brand story, featured collections, best sellers, community designs, CTA into the Studio |
| `/studio` | The 3D Bracelet Studio (core feature) |
| `/studio/[designId]` | Open an existing design (own draft, or a public design as inspiration → forks into a new draft) |
| `/gallery` | Community + brand designs, filterable, every design buyable |
| `/collections` | Curated collections index |
| `/collections/[slug]` | One collection |
| `/product/[slug]` | Product page for a brand-curated design |
| `/design/[publicId]` | Public shareable page of a saved design (precursor of the Phase 2 "Bracelet Passport") |
| `/cart` | Cart |
| `/checkout` | Checkout (guest checkout allowed) |
| `/checkout/confirmation/[orderNumber]` | Order confirmation |
| `/account` | Dashboard: orders, saved designs, addresses, profile |
| `/orders/[orderNumber]/track` | Order status tracker (works for guests via order number + phone) |
| `/about`, `/faq`, `/contact`, `/policies/*` | Trust pages — required for COD conversion |

## 2. Design direction

- **Feel:** modern luxury — calm, spacious, tactile. The 3D bracelet is the hero; the UI recedes.
- **Type:** serif display face for headlines (e.g., Fraunces or Playfair Display), humanist sans for UI/body (e.g., Inter). Wide letter-spacing on small-caps labels.
- **Color:** warm off-white base (#FAF8F5 territory), deep charcoal text, one metallic-leaning accent (champagne gold or muted bronze) used sparingly for CTAs and highlights. Full palette to be defined as Tailwind tokens in milestone 1.1 and used exclusively — no ad-hoc colors.
- **Surfaces:** rounded-2xl cards, hairline borders, soft large-radius shadows only on elevation.
- **Motion:** micro-interactions 150–250ms ease-out; page transitions subtle; hover states on gallery cards (gentle lift + image zoom). Respect `prefers-reduced-motion`.
- **Imagery:** large, airy product photography placeholders at launch; 3D renders of designs used as design thumbnails (generated client-side from the studio canvas via `gl.domElement.toDataURL`, uploaded to Supabase Storage on save).

## 3. Data model (Drizzle / Postgres)

Component catalog:

- `bases` — id, name, slug, description, type (`chain` | `cord` | `bangle`), material, colorHex, priceInPiastres, imageUrl, model3dParams (JSON: radius, thickness, material props), stockQuantity, isActive, sortOrder
- `beads` — id, name, slug, description, stoneType, meaning (short text — the "lifestyle" layer: what the stone symbolizes), colorHex, finish (`polished` | `matte` | `faceted` | `metallic`), diameterMm, priceInPiastres, imageUrl, material3dParams (JSON: color, roughness, metalness, transmission), stockQuantity, isActive, isPremium (reserved for Phase 3 unlockables — always false in Phase 1), sortOrder
- `charms` — same shape as beads plus charmShape (`heart` | `star` | `moon` | `letter` | `custom`), letterValue (nullable, for initial charms)
- `categories` — id, name, slug (beads and charms belong to categories via join tables; used by studio filters and gallery filters)

Designs:

- `designs` — id, publicId (short nanoid for share URLs), ownerId (nullable — guests can design), name, status (`draft` | `saved` | `published_private` | `published_public`), baseId, sizeCm (decimal, wrist size), componentsJson (ordered array: `[{slot: 0, kind: "bead" | "charm", refId, }]`), designSchemaVersion (int, start at 1), priceSnapshotInPiastres (computed server-side on save), thumbnailUrl, likesCount, createdAt, updatedAt, forkedFromDesignId (nullable — inspiration lineage; this becomes Passport "design history" in Phase 2)
- `design_likes` — designId, userId, unique pair

Commerce:

- `collections` — id, name, slug, description, heroImageUrl, sortOrder, isActive
- `collection_designs` — collectionId, designId (curated brand designs appear in collections and as products)
- `carts` — id, userId (nullable), sessionToken (for guests), createdAt
- `cart_items` — id, cartId, designId, quantity, note (e.g., gift message)
- `orders` — id, orderNumber (human-friendly, e.g. `BR-2026-000123`), userId (nullable), status (`pending_confirmation` | `confirmed` | `crafting` | `shipped` | `delivered` | `cancelled`), paymentMethod (`cod` | `paymob_card` | `paymob_wallet`), paymentStatus (`unpaid` | `paid` | `refunded`), subtotalInPiastres, shippingInPiastres, discountInPiastres, totalInPiastres, customerName, customerPhone (required — primary contact channel in Egypt), customerEmail (optional), shippingAddressJson, governorate, discountCodeId (nullable), placedAt
- `order_items` — id, orderId, designId (snapshot: also store designJson + unit price at purchase time — orders must be immutable even if the design or catalog changes later)
- `order_events` — id, orderId, status, note, createdAt (powers the tracking timeline)
- `discount_codes` — id, code, type (`percent` | `fixed`), value, minSubtotal, maxUses, usedCount, expiresAt, isActive
- `shipping_zones` — id, name, governorates (text[]), feeInPiastres, estimatedDays

Component stock is decremented when an order is confirmed, restored on cancellation.

## 4. The Bracelet Studio (core feature — highest quality bar)

### Architecture

- React Three Fiber scene: bracelet is a circular arrangement of component meshes along a torus path whose circumference derives from `sizeCm`. Beads are spheres/rondelles with PBR materials from `material3dParams`; charms are simple extruded/primitive shapes in Phase 1 (glTF models can replace them later without API changes).
- Studio state in a single Zustand store: `{ base, sizeCm, components[], selectedSlot, camera mode }` plus a bounded history stack (max 50 entries) for undo/redo.
- Autosave drafts: localStorage for guests, database (debounced) for logged-in users. A guest who logs in gets their local draft migrated.

### Interactions

- **Component palette** (side panel on desktop, bottom sheet on mobile): tabs for Beads / Charms, category filter chips, search, each item shows image, name, price, and stone meaning on hover/long-press. Out-of-stock items rendered disabled with an "out of stock" tag — visible but not addable.
- **Add:** tap a palette item → appends to the bracelet (or inserts at selected slot). The bracelet re-lays-out with a smooth animation.
- **Select:** click/tap a component on the bracelet → highlight ring + contextual actions (replace, duplicate, remove).
- **Reorder:** drag a component along the bracelet path (desktop drag, mobile touch-drag with slight haptic-feel scale-up). Implement as slot swapping along the circle.
- **Camera:** OrbitControls — rotate (drag), zoom (wheel/pinch), pan disabled by default to keep the bracelet centered. "Front view" reset button.
- **Undo/redo:** buttons + Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z.
- **Size:** wrist size selector (14–22 cm, 0.5 steps) with a capacity indicator — the UI shows how many beads fit the chosen size and prevents overflow.
- **Live price:** persistent price chip, updates on every change (client-side estimate; authoritative recomputation server-side on save/add-to-cart).
- **Save / Share / Add to cart:** save requires naming the design (suggest a poetic default from its stones, never "untitled" — this is a deliberate differentiator from the reference site). Share produces `/design/[publicId]`. Add-to-cart snapshots the design.
- **Performance target:** 60fps on mid-range mobile; use drei instancing where possible, cap pixel ratio at 2, lazy-load the studio bundle (`next/dynamic`, no SSR) with a branded loading state.

### Empty/first-run state

First visit shows a beautiful pre-loaded starter bracelet (not an empty circle) and a 3-step coach-mark tour: pick beads → arrange → save.

## 5. Gallery

- Masonry grid of `published_public` designs + brand designs; card shows thumbnail, name, price, likes.
- Filters: category, color family, price range, sort (newest / most liked / price). Search by name/stone.
- Pagination via cursor-based infinite scroll with an accessible "Load more" fallback.
- Card actions: open public page, "Customize this" (forks into the studio, recording `forkedFromDesignId`), add to cart directly.
- Like requires login (heart animates optimistically).

## 6. Product & collection pages

Product pages are curated designs with editorial treatment: large imagery, story/description, stone meanings of every component (auto-assembled from the catalog — the lifestyle layer), price, "Customize this design" CTA into the studio, related designs, reviews (schema: `reviews` — orderItemId-gated so only buyers review; display-only stars + text, moderation flag). Collections are themed sets with a hero and editorial intro.

## 7. Cart & checkout

- Cart: line items with design thumbnails, quantity, per-item gift note, discount code field, shipping estimate by governorate selector, subtotal/total in EGP.
- Checkout (single page, guest-friendly): contact (name, phone required, email optional) → address (governorate select drives shipping fee from `shipping_zones`) → payment method (Phase 1 launch: **Cash on Delivery** only, with Paymob card/wallet added in milestone 1.6) → review → place order.
- On order placement: server action validates stock, recomputes all prices, creates order + order_items snapshots, decrements component stock, sends confirmation (email if provided; the confirmation page prominently shows order number + tracking link since phone is the primary identifier).
- Paymob integration (milestone 1.6): standard iframe/redirect flow, HMAC-verified webhook updates `paymentStatus`, orders remain `pending_confirmation` until webhook confirms.

## 8. Accounts & orders

Supabase Auth (email/password + Google). Account area: order list with status timeline (from `order_events`), saved designs grid (open in studio, rename, delete, publish/unpublish to gallery), address book, profile. Guest order tracking at `/orders/[orderNumber]/track` gated by phone-number match.

## 9. Admin (minimal but required for launch)

`/admin` (role-gated via a `profiles.role` column): manage catalog (CRUD bases/beads/charms with stock), view orders and advance their status (which appends `order_events`), moderate public gallery designs, manage discount codes and shipping zones. Plain shadcn tables/forms — function over beauty here.

## 10. Non-functional requirements

- Lighthouse ≥ 90 performance/accessibility/SEO on home, gallery, product pages (studio exempt from perf score but must hit its own fps target).
- SEO: metadata + OpenGraph on all public pages; design share pages generate OG images from design thumbnails; sitemap; structured data (Product) on product pages.
- Analytics events from day one: studio_opened, component_added, design_saved, design_shared, add_to_cart, checkout_started, order_placed (Vercel Analytics or PostHog).
- Error/empty/loading states designed for every page — no default spinners on white.
- Seed script: ~6 bases, ~40 beads, ~15 charms with real stone names/meanings, 3 collections, ~20 brand designs — the site must look alive on first deploy.

## 11. Milestones (each = branch → merge → tag → push)

1. **1.1 Foundation** — project setup, Tailwind design tokens, fonts, layout shell (header/footer/nav), Supabase + Drizzle wiring, auth, seed script skeleton. Tag `phase-1.1`.
2. **1.2 Catalog & data model** — full schema, migrations, seed data, admin CRUD for catalog. Tag `phase-1.2`.
3. **1.3 Studio core** — 3D scene, palette, add/remove/select/reorder, undo/redo, size & capacity, live price, autosave drafts. Tag `phase-1.3`.
4. **1.4 Save/share/gallery** — design persistence, thumbnails, public design pages, gallery with filters/likes/forking. Tag `phase-1.4`.
5. **1.5 Commerce** — collections, product pages, reviews, cart, COD checkout, orders, tracking, account area, admin order management. Tag `phase-1.5`.
6. **1.6 Payments & polish** — Paymob card + wallet, home page hero experience, SEO/OG, analytics, performance pass, accessibility pass. Tag `phase-1.6` = launch candidate.
