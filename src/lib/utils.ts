import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class lists, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EGP_FORMATTER = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  currencyDisplay: "symbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format an integer amount of piastres as an EGP price string.
 *
 * Money is stored and computed everywhere as integer piastres
 * (1 EGP = 100 piastres). This is the ONLY place money becomes a
 * human-readable string — never format ad-hoc. See CLAUDE.md.
 *
 * Whole-pound amounts render without decimals (e.g. "EGP 450");
 * fractional amounts show two places (e.g. "EGP 450.50").
 */
export function formatPrice(piastres: number): string {
  const pounds = piastres / 100;
  const hasFraction = piastres % 100 !== 0;
  return EGP_FORMATTER.format(hasFraction ? pounds : Math.round(pounds));
}

/** URL/slug-safe: lowercase, non-alphanumerics collapsed to single hyphens. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Convert an EGP amount (may be fractional) to integer piastres. */
export function egpToPiastres(egp: number): number {
  return Math.round(egp * 100);
}

/** Convert integer piastres to an EGP number for editable form inputs. */
export function piastresToEgp(piastres: number): number {
  return piastres / 100;
}
