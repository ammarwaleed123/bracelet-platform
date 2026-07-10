"use client";

import { useRouter } from "next/navigation";

import type { GallerySort } from "@/lib/designs/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const SORTS: { value: GallerySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "most_liked", label: "Most liked" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

export function FilterBar({
  current,
}: {
  current: {
    search: string;
    sort: GallerySort;
  };
}) {
  const router = useRouter();

  const navigate = (search: string, sort: string) => {
    const params = new URLSearchParams();
    const q = search.trim();
    if (q) params.set("q", q);
    if (sort && sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    router.push(qs ? `/gallery?${qs}` : "/gallery");
  };

  return (
    <form
      action={(formData) =>
        navigate(
          String(formData.get("q") ?? ""),
          String(formData.get("sort") ?? "newest")
        )
      }
      className="flex items-center gap-2"
    >
      <Input
        name="q"
        type="search"
        defaultValue={current.search}
        placeholder="Search name or stone…"
        aria-label="Search designs"
        className="h-11 min-w-0 flex-1 rounded-full"
      />
      <Select
        name="sort"
        defaultValue={current.sort}
        aria-label="Sort designs"
        className="h-11 w-32 shrink-0 rounded-full sm:w-40"
        onChange={(e) =>
          navigate(
            (
              e.currentTarget.form?.elements.namedItem(
                "q"
              ) as HTMLInputElement | null
            )?.value ?? "",
            e.currentTarget.value
          )
        }
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </form>
  );
}
