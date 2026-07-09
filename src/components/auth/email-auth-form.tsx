"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  signInWithPassword,
  signUpWithPassword,
  type AuthFormState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Field({
  id,
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="label-caps block">
        {label}
      </label>
      <Input id={id} name={id} {...props} />
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Please wait…" : label}
    </Button>
  );
}

export function EmailAuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const action = mode === "sign-in" ? signInWithPassword : signUpWithPassword;
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "sign-up" && (
        <Field
          id="name"
          label="Name"
          type="text"
          autoComplete="name"
          required
          placeholder="Your name"
        />
      )}
      <Field
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
      />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
        required
        minLength={8}
        placeholder="••••••••"
      />

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.message && (
        <p
          role="status"
          className="rounded-lg bg-gold-tint px-3 py-2 text-sm text-gold-strong"
        >
          {state.message}
        </p>
      )}

      <SubmitButton label={mode === "sign-in" ? "Sign in" : "Create account"} />
    </form>
  );
}
