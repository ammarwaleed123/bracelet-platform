"use client";

import { useState, useTransition } from "react";

import { updateCommissionPercent } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommissionSetting({ percent }: { percent: number }) {
  const [value, setValue] = useState(String(percent));
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        startTransition(async () => {
          await updateCommissionPercent(Number(value));
          setSaved(true);
        });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="block">
        <span className="label-caps mb-1 block">Commission rate</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            className="h-10 w-24"
          />
          <span className="text-ink-soft">% of item price</span>
        </div>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {saved && <span className="text-sm text-gold-strong">Saved.</span>}
    </form>
  );
}
