"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/** Shape returned to the client forms via useActionState. */
export type AuthFormState = { error?: string; message?: string } | undefined;

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signUpSchema = credentialsSchema.extend({
  name: z.string().trim().min(1, "Enter your name."),
});

async function siteOrigin() {
  const host = (await headers()).get("origin");
  return host ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Distinguish an unconfirmed email from bad credentials so users aren't
    // told the wrong thing after signing up.
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Please confirm your email first — check your inbox for the confirmation link.",
      };
    }
    return { error: "Incorrect email or password." };
  }

  redirect("/account");
}

export async function signUpWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  // If the project requires email confirmation, no session is returned yet.
  // Tell the user to confirm instead of redirecting to a gated page.
  if (!data.session) {
    return {
      message:
        "Account created. Check your email for a confirmation link, then sign in.",
    };
  }

  redirect("/account");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback`,
      // Always show Google's account picker instead of silently reusing the
      // one Google session already active in the browser.
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    redirect("/sign-in?error=oauth");
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
