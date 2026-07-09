"use client";

import { useActionState } from "react";

import type { Category } from "@/lib/db/schema";
import type { ActionState } from "@/lib/admin/parse";
import { Input } from "@/components/ui/input";
import { Field, FormMessage, SubmitButton } from "@/components/admin/form";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function CategoryForm({
  action,
  category,
  submitLabel,
}: {
  action: Action;
  category?: Category;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="max-w-md space-y-5">
      {category && <input type="hidden" name="id" value={category.id} />}

      <Field label="Name" htmlFor="name" required>
        <Input id="name" name="name" defaultValue={category?.name} required />
      </Field>

      <Field label="Sort order" htmlFor="sortOrder" hint="Lower shows first.">
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          step={1}
          defaultValue={category?.sortOrder ?? 0}
        />
      </Field>

      <FormMessage error={state?.error} />

      <div className="pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
