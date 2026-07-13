# Switching your AI provider (a plain-language guide)

This is for the store owner — no coding needed. It explains **why** and **how** to
move the AI Bracelet Designer off the free tier when the time comes.

## Why this matters

The AI designer currently runs on **Google Gemini's free tier**. That's a great way
to launch for free, but it has two downsides you don't want once real customers rely
on you:

1. **No reliability guarantee.** The free tier can slow down, get rate-limited, or
   change its limits without notice. If it's down, customers can't use the designer.
2. **Privacy.** Google may use free-tier inputs to improve its products. That's fine
   for "pick 3 bracelets," but **not** for the upcoming AI Style Match feature, where
   customers upload personal photos.

The admin dashboard shows a **"Time to upgrade your AI provider"** banner once you've
delivered ~10 orders, or a day uses more than ~60% of the free quota. When you see it,
do one of the two options below.

---

## Option A — Stay on Gemini, but turn on billing (easiest)

Keeps everything the same; just removes the free-tier limits and privacy caveat.

1. Go to **[Google AI Studio](https://aistudio.google.com)** → **Get API key** →
   your project → **"Set up billing"** (or open the project in the Google Cloud
   Console and enable billing on it).
2. Add a payment method. Gemini Flash is inexpensive — you pay per use.
3. That's it. **No key change is needed** — your existing `GEMINI_API_KEY` now runs on
   the paid tier automatically.

---

## Option B — Switch to Anthropic (Claude)

Use this if you'd rather run on Claude.

1. Get an API key from **[console.anthropic.com](https://console.anthropic.com)** →
   **API Keys** → **Create Key**. Add billing there.
2. In **Vercel** → your project → **Settings → Environment Variables**, set:
   - `ANTHROPIC_API_KEY` = your new key
   - `AI_PROVIDER` = `anthropic`
   (Set them for **Production**, and Preview if you use it.)
3. Ask your developer to finish the small Anthropic adapter (`src/lib/ai/providers/anthropic.ts`
   is stubbed and ready) — it's a short change, not a rebuild.
4. **Redeploy** (Vercel → Deployments → Redeploy, or push any commit).

---

## After switching — verify (2 minutes)

1. Open **`/designer`** on your live site and generate a set of bracelets. It should
   work exactly as before.
2. Open **`/admin`** — the upgrade banner should be gone (or you can dismiss it).
3. Done. You're now on a provider with an SLA and no training on your customers' data.

## Where the settings live

| Setting | What it does | Where |
| --- | --- | --- |
| `GEMINI_API_KEY` | Your Google key | Vercel env vars (+ `.env.local` locally) |
| `ANTHROPIC_API_KEY` | Your Claude key | Vercel env vars |
| `AI_PROVIDER` | `gemini` or `anthropic` | Vercel env vars |

Never paste these keys into chats, emails, or code — they belong only in Vercel's
environment variables and your local `.env.local` (which is never committed).
