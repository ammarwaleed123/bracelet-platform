import type { z } from "zod";

/** Shape returned by admin CRUD server actions to their forms. */
export type ActionState = { error?: string } | undefined;

/** Read a trimmed string field, or undefined if empty. */
export function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
}

/** Read a checkbox: present ("on"/"true") => true. */
export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true";
}

/** Read a File field, or null if none was chosen. */
export function file(fd: FormData, key: string): File | null {
  const v = fd.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

/** First human-readable message from a failed Zod parse. */
export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

/** Normalize a thrown error (e.g. a unique-constraint clash) to a message. */
export function errorMessage(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes("duplicate key") || message.includes("unique")) {
    return "That name/slug is already in use.";
  }
  return message || "Something went wrong. Please try again.";
}
