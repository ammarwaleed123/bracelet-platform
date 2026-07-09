"use client";

import { useActionState } from "react";

import type { Base } from "@/lib/db/schema";
import { piastresToEgp } from "@/lib/utils";
import type { ActionState } from "@/lib/admin/parse";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, ImageField, SubmitButton } from "@/components/admin/form";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function BaseForm({
  action,
  base,
  submitLabel,
}: {
  action: Action;
  base?: Base;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {base && <input type="hidden" name="id" value={base.id} />}

      <Field label="Name" htmlFor="name" required>
        <Input id="name" name="name" defaultValue={base?.name} required />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={base?.description ?? ""}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Type" htmlFor="type" required>
          <Select id="type" name="type" defaultValue={base?.type ?? "chain"}>
            <option value="chain">Chain</option>
            <option value="cord">Cord</option>
            <option value="bangle">Bangle</option>
          </Select>
        </Field>

        <Field label="Material" htmlFor="material">
          <Input
            id="material"
            name="material"
            defaultValue={base?.material ?? ""}
            placeholder="e.g. 14k gold-filled"
          />
        </Field>

        <Field label="Color" htmlFor="colorHex" hint="Shown in the studio and as a swatch.">
          <Input
            id="colorHex"
            name="colorHex"
            type="color"
            defaultValue={base?.colorHex ?? "#C7A15A"}
            className="h-11 w-full p-1"
          />
        </Field>

        <Field label="Price (EGP)" htmlFor="priceEgp" required>
          <Input
            id="priceEgp"
            name="priceEgp"
            type="number"
            min={0}
            step="0.01"
            defaultValue={base ? piastresToEgp(base.priceInPiastres) : ""}
            required
          />
        </Field>

        <Field label="Stock quantity" htmlFor="stockQuantity" required>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min={0}
            step={1}
            defaultValue={base?.stockQuantity ?? 0}
            required
          />
        </Field>

        <Field label="Sort order" htmlFor="sortOrder" hint="Lower shows first.">
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            step={1}
            defaultValue={base?.sortOrder ?? 0}
          />
        </Field>
      </div>

      <ImageField name="image" currentUrl={base?.imageUrl} />

      <label className="flex items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={base?.isActive ?? true}
          className="size-4 rounded border-input accent-gold"
        />
        Active (visible in the studio)
      </label>

      <FormMessage error={state?.error} />

      <div className="flex gap-3 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
