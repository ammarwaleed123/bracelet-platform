"use client";

import { useRouter } from "next/navigation";

import type { GallerySort } from "@/lib/designs/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const SORTS: { value: GallerySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "most_liked", label: "Most liked" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function FilterBar({
  current,
}: {
  current: {
    search: string;
    sort: GallerySort;
    minEgp: string;
    maxEgp: string;
  };
}) {
  const router = useRouter();

  const apply = (formData: FormData) => {
    const params = new URLSearchParams();
    const q = String(formData.get("q") ?? "").trim();
    const sort = String(formData.get("sort") ?? "newest");
    const min = String(formData.get("min") ?? "").trim();
    const max = String(formData.get("max") ?? "").trim();
    if (q) params.set("q", q);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    const qs = params.toString();
    router.push(qs ? `/gallery?${qs}` : "/gallery");
  };

  return (
    <form
      action={apply}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <div className="min-w-[10rem] flex-1">
        <label htmlFor="q" className="label-caps mb-1 block">
          Search
        </label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={current.search}
          placeholder="Name or stone…"
          className="h-10"
        />
      </div>
      <div>
        <label htmlFor="sort" className="label-caps mb-1 block">
          Sort
        </label>
        <Select
          id="sort"
          name="sort"
          defaultValue={current.sort}
          className="h-10 w-44"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="min" className="label-caps mb-1 block">
          Min EGP
        </label>
        <Input
          id="min"
          name="min"
          type="number"
          min={0}
          defaultValue={current.minEgp}
          className="h-10 w-24"
        />
      </div>
      <div>
        <label htmlFor="max" className="label-caps mb-1 block">
          Max EGP
        </label>
        <Input
          id="max"
          name="max"
          type="number"
          min={0}
          defaultValue={current.maxEgp}
          className="h-10 w-24"
        />
      </div>
      <Button type="submit" className="h-10">
        Apply
      </Button>
    </form>
  );
}
