"use client";

import { useActionState } from "react";

import { piastresToEgp } from "@/lib/utils";
import type { ActionState } from "@/lib/admin/parse";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, ImageField, SubmitButton } from "@/components/admin/form";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export type ComponentInitial = {
  id: string;
  name: string;
  description: string | null;
  stoneType: string | null;
  meaning: string | null;
  colorHex: string;
  finish: "polished" | "matte" | "faceted" | "metallic";
  diameterMm: string;
  priceInPiastres: number;
  stockQuantity: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  charmShape?: "heart" | "star" | "moon" | "letter" | "custom";
  letterValue?: string | null;
};

export function ComponentForm({
  action,
  kind,
  item,
  categories,
  selectedCategoryIds = [],
  submitLabel,
}: {
  action: Action;
  kind: "bead" | "charm";
  item?: ComponentInitial;
  categories: { id: string; name: string }[];
  selectedCategoryIds?: string[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );
  const selected = new Set(selectedCategoryIds);
  const isCharm = kind === "charm";

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {item && <input type="hidden" name="id" value={item.id} />}

      <Field label="Name" htmlFor="name" required>
        <Input id="name" name="name" defaultValue={item?.name} required />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Stone type" htmlFor="stoneType">
          <Input
            id="stoneType"
            name="stoneType"
            defaultValue={item?.stoneType ?? ""}
            placeholder="e.g. Amethyst"
          />
        </Field>

        <Field label="Color" htmlFor="colorHex">
          <Input
            id="colorHex"
            name="colorHex"
            type="color"
            defaultValue={item?.colorHex ?? (isCharm ? "#C7A15A" : "#FFFFFF")}
            className="h-11 w-full p-1"
          />
        </Field>
      </div>

      <Field
        label="Meaning"
        htmlFor="meaning"
        hint="The lifestyle layer — what this stone symbolizes."
      >
        <Textarea id="meaning" name="meaning" defaultValue={item?.meaning ?? ""} />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={item?.description ?? ""}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Finish" htmlFor="finish" required>
          <Select
            id="finish"
            name="finish"
            defaultValue={item?.finish ?? (isCharm ? "metallic" : "polished")}
          >
            <option value="polished">Polished</option>
            <option value="matte">Matte</option>
            <option value="faceted">Faceted</option>
            <option value="metallic">Metallic</option>
          </Select>
        </Field>

        <Field label="Diameter (mm)" htmlFor="diameterMm" required>
          <Input
            id="diameterMm"
            name="diameterMm"
            type="number"
            min={0}
            step="0.1"
            defaultValue={item?.diameterMm ?? (isCharm ? "10" : "8")}
            required
          />
        </Field>

        {isCharm && (
          <>
            <Field label="Charm shape" htmlFor="charmShape" required>
              <Select
                id="charmShape"
                name="charmShape"
                defaultValue={item?.charmShape ?? "custom"}
              >
                <option value="heart">Heart</option>
                <option value="star">Star</option>
                <option value="moon">Moon</option>
                <option value="letter">Letter</option>
                <option value="custom">Custom</option>
              </Select>
            </Field>

            <Field
              label="Letter"
              htmlFor="letterValue"
              hint="Only for letter charms."
            >
              <Input
                id="letterValue"
                name="letterValue"
                maxLength={2}
                defaultValue={item?.letterValue ?? ""}
              />
            </Field>
          </>
        )}

        <Field label="Price (EGP)" htmlFor="priceEgp" required>
          <Input
            id="priceEgp"
            name="priceEgp"
            type="number"
            min={0}
            step="0.01"
            defaultValue={item ? piastresToEgp(item.priceInPiastres) : ""}
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
            defaultValue={item?.stockQuantity ?? 0}
            required
          />
        </Field>

        <Field label="Sort order" htmlFor="sortOrder" hint="Lower shows first.">
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            step={1}
            defaultValue={item?.sortOrder ?? 0}
          />
        </Field>
      </div>

      {categories.length > 0 && (
        <Field label="Categories" hint="Used by studio and gallery filters.">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label
                key={c.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-ink has-[:checked]:border-gold has-[:checked]:bg-gold-tint"
              >
                <input
                  type="checkbox"
                  name="categories"
                  value={c.id}
                  defaultChecked={selected.has(c.id)}
                  className="size-3.5 accent-gold"
                />
                {c.name}
              </label>
            ))}
          </div>
        </Field>
      )}

      <ImageField name="image" currentUrl={item?.imageUrl} />

      <label className="flex items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={item?.isActive ?? true}
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
