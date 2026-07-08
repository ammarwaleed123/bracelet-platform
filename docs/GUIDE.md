# Step-by-Step Guide: From Zero to Launch

Follow this in order. Each part ends with a checkpoint — don't move on until it passes.

---

## Part 1 — Accounts (one-time, ~30 minutes)

1. **GitHub** — create an account at github.com if you don't have one.
2. **Anthropic / Claude** — Claude Code requires a paid plan (Pro at minimum; Max if you'll run it heavily every day). Sign in at claude.ai and confirm your plan.
3. **Supabase** — create a free account at supabase.com. Create a new project (choose a region close to Egypt, e.g. Frankfurt `eu-central-1`). Save the database password somewhere safe. From Project Settings → API, copy the `Project URL`, `anon` key, and `service_role` key — you'll need them in Part 4.
4. **Vercel** — create a free account at vercel.com and connect it to your GitHub account (Sign up with GitHub is easiest).
5. **Paymob** — register a merchant account at paymob.com (Egypt). This involves business verification and takes days-to-weeks, so START THE APPLICATION NOW even though the integration is milestone 1.6. You'll eventually need: API key, integration IDs (card + wallet), and an HMAC secret.

✅ Checkpoint: you can log into all five services.

---

## Part 2 — Install the tools (one-time, ~20 minutes)

1. **Node.js** — install the LTS version from nodejs.org (v20+). Verify in a terminal: `node -v`.
2. **Git** — install from git-scm.com. Verify: `git --version`. Set your identity:
   ```
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```
3. **VS Code** — install from code.visualstudio.com.
4. **Claude Code extension** — in VS Code press `Ctrl+Shift+X`, search "Claude Code", install the one published by **Anthropic** (verified publisher — beware similarly named community extensions). The extension bundles the CLI. Open any file, click the Spark (✱) icon in the top-right of the editor, and sign in with your Anthropic account when prompted. If the icon doesn't appear: open a file (not just a folder) or run "Developer: Reload Window" from the Command Palette.

✅ Checkpoint: the Claude Code panel opens in VS Code and responds to a test prompt.

---

## Part 3 — Create the repo (one-time, ~10 minutes)

1. Unzip `bracelet-platform-starter.zip`. You get a folder with `CLAUDE.md`, `README.md`, `.gitignore`, and `docs/`.
2. On github.com click **New repository** → name it (e.g. `bracelet-platform`) → **Private** → do NOT add a README/.gitignore (we have them) → Create.
3. In a terminal, inside the unzipped folder:
   ```
   git init
   git add .
   git commit -m "Project foundation: spec, roadmap, and agent instructions"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bracelet-platform.git
   git push -u origin main
   ```

✅ Checkpoint: refresh GitHub — you see the files online.

---

## Part 4 — Working with Opus: the milestone loop

You will repeat this exact loop six times (milestones 1.1 → 1.6). This loop IS the project.

### 4.1 Start the milestone
1. Open the project folder in VS Code (**File → Open Folder** — Claude Code works on the whole workspace).
2. Open the Claude Code panel. Make sure the model is Opus (use `/model` in the prompt box to check/switch).
3. Create the milestone branch first. In the VS Code terminal:
   ```
   git checkout -b feat/foundation        # 1.1 (use a fitting name each time)
   ```
4. **Use Plan Mode for the first prompt of every milestone.** Select Plan mode at the bottom of the Claude Code prompt box, then send:
   > Read CLAUDE.md, docs/PHASE-1-SPEC.md and docs/ROADMAP.md. Then produce a detailed implementation plan for milestone 1.1 (Foundation) only. Do not implement anything outside milestone 1.1.
5. Read the plan carefully. This is where YOU are the CEO: remove anything that isn't in the milestone, question anything that contradicts the spec. Approve only when it matches.

### 4.2 Let it build
1. Approve the plan and let Claude implement. In Normal mode you review every diff; once you trust the flow within a milestone, auto-accept speeds things up — but always review changes to: the database schema, checkout/pricing logic, and anything touching money.
2. When Claude needs secrets (Supabase URL/keys), it will create `.env.example`. YOU create `.env.local` yourself and paste real values — never paste secrets into the chat, and `.env.local` is gitignored so it never reaches GitHub.
3. Run the app constantly while it works: `npm run dev` → http://localhost:3000. Look at everything with your own eyes, on your phone too (same Wi-Fi: `http://YOUR_PC_IP:3000`).

### 4.3 Review before merging (your quality gate)
Ask Claude:
> Run npm run build and npm run lint, fix all errors, then summarize everything implemented in this milestone against the spec, listing anything intentionally deferred.

Then verify yourself:
- [ ] `npm run build` passes with zero errors
- [ ] Every feature listed for the milestone in `PHASE-1-SPEC.md` §11 works when YOU click through it
- [ ] It looks right on mobile width (375px — use browser dev tools device mode)
- [ ] Nothing outside the milestone scope was half-built

### 4.4 Merge, tag, push (this is your "push every phase")
```
git add .
git commit -m "Milestone 1.1: foundation, design tokens, auth, layout shell"
git checkout main
git merge feat/foundation
git tag phase-1.1
git push origin main --tags
```

✅ Checkpoint: the tag appears on GitHub under Releases/Tags. Repeat the loop for the next milestone.

### Milestone order and branch names
| Milestone | Branch | Tag |
|---|---|---|
| 1.1 Foundation | `feat/foundation` | `phase-1.1` |
| 1.2 Catalog & admin | `feat/catalog` | `phase-1.2` |
| 1.3 Studio core | `feat/studio` | `phase-1.3` |
| 1.4 Gallery & sharing | `feat/gallery` | `phase-1.4` |
| 1.5 Commerce (COD) | `feat/commerce` | `phase-1.5` |
| 1.6 Paymob & polish | `feat/launch-polish` | `phase-1.6` |

---

## Part 5 — Deploy early (after milestone 1.1, not at the end)

1. On vercel.com: **Add New → Project** → import your GitHub repo.
2. In the project's Environment Variables, add the same keys as `.env.local`.
3. Deploy. From now on every push to `main` auto-deploys production, and every branch gets a preview URL — perfect for checking milestones on your real phone.

Deploying from milestone 1.1 means you catch environment problems when the app is tiny, not at launch week.

---

## Part 6 — Real content (do this in parallel, it's on YOU not Opus)

While Claude builds milestones 1.2–1.5, prepare the things only you can provide:
1. **Brand name + logo** (needed before 1.6 — it goes into the domain, order numbers, OG images).
2. **Your actual component list**: every stone/bead/charm you physically have, with cost and selling price. Send it to me and I'll write the seed catalog with proper meaning/symbolism copy.
3. **Photography**: even phone photos on a clean background of your stones/finished bracelets — real photos beat placeholders for trust, which COD depends on.
4. **Policies**: shipping zones + fees per governorate, return/exchange policy, crafting lead time promise.
5. **Domain**: buy it (e.g. via Namecheap), connect it in Vercel → Domains.

---

## Part 7 — Launch checklist (end of 1.6)

- [ ] Place a real test order (COD) end-to-end on your phone, then advance it through every status in admin
- [ ] Paymob test-mode payment succeeds and the webhook marks the order paid
- [ ] All policy pages filled with real content
- [ ] Lighthouse ≥ 90 on home/gallery/product
- [ ] Studio smooth on a mid-range Android phone (test on a real device)
- [ ] Custom domain live with HTTPS
- [ ] Analytics events firing (place a test order and see it in the dashboard)
- [ ] Seed gallery has ~20 beautiful brand designs so day-one visitors see life

Then switch Paymob to live keys, and launch. Phase 2 (AI Designer, Passport) starts the following week — see `ROADMAP.md`.

---

## When something goes wrong

- **Claude went off-track / broke things**: use the extension's checkpoints — hover over an earlier message and rewind code to that point, then re-prompt more specifically.
- **Build errors it can't fix in 2–3 attempts**: start a fresh session (fresh context), paste only the exact error, and ask it to fix that one thing.
- **You don't understand a decision it made**: ask it to explain in plain language before accepting. You're the owner; never merge what you can't explain.
- **Stuck on architecture/product questions**: bring it back to me — that's my job as your partner.
