"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** Labelled field wrapper with optional hint and required marker. */
export function Field({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

/** Renders the error returned by a server action's form state. */
export function FormMessage({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {error}
    </p>
  );
}

export function SubmitButton({
  children = "Save",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? "Saving…" : children}
    </Button>
  );
}

/**
 * Image upload field with live preview. The chosen file posts as part of the
 * form; the server action uploads it to Storage. If nothing is chosen, the
 * existing image (if any) is kept.
 */
export function ImageField({
  name,
  currentUrl,
}: {
  name: string;
  currentUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = preview ?? currentUrl ?? null;

  return (
    <Field label="Image" htmlFor={name} hint="JPEG, PNG, WebP or AVIF · up to 5 MB. Optional.">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-sand">
          {shown ? (
            // Preview may be a blob: URL (new pick) or a Storage URL.
            <Image
              src={shown}
              alt=""
              width={64}
              height={64}
              className="size-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-[10px] text-stone">No image</span>
          )}
        </div>
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="block w-full text-sm text-ink-soft file:mr-4 file:rounded-full file:border-0 file:bg-sand file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-parchment"
        />
      </div>
    </Field>
  );
}
