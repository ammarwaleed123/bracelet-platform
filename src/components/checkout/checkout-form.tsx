"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import type { CartLine } from "@/lib/cart/cart";
import type { GovernorateOption } from "@/app/checkout/page";
import { placeOrder, previewDiscount } from "@/lib/commerce/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function CheckoutForm({
  lines,
  subtotalInPiastres,
  governorates,
  defaults,
}: {
  lines: CartLine[];
  subtotalInPiastres: number;
  governorates: GovernorateOption[];
  defaults: { name: string; email: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    customerName: defaults.name,
    customerPhone: "",
    customerEmail: defaults.email,
    governorate: "",
    line1: "",
    line2: "",
    area: "",
    landmark: "",
    discountCode: "",
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<{ amount: number; code: string } | null>(
    null
  );
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const selectedGov = useMemo(
    () => governorates.find((g) => g.name === form.governorate) ?? null,
    [governorates, form.governorate]
  );
  const shipping = selectedGov?.feeInPiastres ?? 0;
  const discountAmount = discount?.amount ?? 0;
  const total = subtotalInPiastres + shipping - discountAmount;

  const applyCode = () => {
    if (!form.discountCode.trim()) return;
    setCheckingCode(true);
    setDiscountError(null);
    startTransition(async () => {
      const res = await previewDiscount(form.discountCode);
      if (res.ok) {
        setDiscount({ amount: res.discountInPiastres, code: res.code });
      } else {
        setDiscount(null);
        setDiscountError(res.error);
      }
      setCheckingCode(false);
    });
  };

  const pinLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setGeoStatus("idle");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({
        ...form,
        geoLat: geo?.lat,
        geoLng: geo?.lng,
      });
      if (res.ok) {
        router.push(`/checkout/confirmation/${res.orderNumber}`);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-8"
      >
        <section className="space-y-4">
          <h2 className="font-serif text-lg text-ink">Contact</h2>
          <Field label="Full name" required>
            <Input
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              autoComplete="name"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required hint="We'll call to confirm your order.">
              <Input
                value={form.customerPhone}
                onChange={(e) => set("customerPhone", e.target.value)}
                inputMode="tel"
                placeholder="01012345678"
                autoComplete="tel"
                required
              />
            </Field>
            <Field label="Email" hint="Optional — for your receipt.">
              <Input
                type="email"
                value={form.customerEmail}
                onChange={(e) => set("customerEmail", e.target.value)}
                autoComplete="email"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-lg text-ink">Delivery address</h2>
          <Field label="Governorate" required>
            <Select
              value={form.governorate}
              onChange={(e) => set("governorate", e.target.value)}
              required
            >
              <option value="" disabled>
                Select governorate…
              </option>
              {governorates.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Street address" required>
            <Input
              value={form.line1}
              onChange={(e) => set("line1", e.target.value)}
              placeholder="Building, street"
              autoComplete="address-line1"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Apartment, floor (optional)">
              <Input
                value={form.line2}
                onChange={(e) => set("line2", e.target.value)}
                autoComplete="address-line2"
              />
            </Field>
            <Field label="Area / district (optional)">
              <Input value={form.area} onChange={(e) => set("area", e.target.value)} />
            </Field>
          </div>
          <Field label="Landmark (optional)">
            <Input
              value={form.landmark}
              onChange={(e) => set("landmark", e.target.value)}
              placeholder="Nearby landmark to help the courier"
            />
          </Field>

          {/* Pin location — captures GPS coordinates to help the courier find
              the address, which street addresses in Egypt often can't. */}
          <div className="rounded-2xl border border-border bg-linen/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  Pin your location{" "}
                  <span className="font-normal text-ink-soft">(optional)</span>
                </p>
                <p className="text-xs text-ink-soft">
                  Helps the courier find you faster.
                </p>
              </div>
              <Button
                type="button"
                variant={geo ? "outline" : "secondary"}
                size="sm"
                onClick={pinLocation}
                disabled={geoStatus === "locating"}
              >
                <MapPin aria-hidden />
                {geoStatus === "locating"
                  ? "Locating…"
                  : geo
                    ? "Update pin"
                    : "Pin my location"}
              </Button>
            </div>
            {geo && (
              <p className="mt-2 text-xs text-gold-strong">
                Location pinned.{" "}
                <a
                  href={`https://www.google.com/maps?q=${geo.lat},${geo.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  View on map
                </a>
              </p>
            )}
            {geoStatus === "error" && (
              <p className="mt-2 text-xs text-destructive">
                Couldn&apos;t get your location. Please allow location access, or
                skip this — your address is enough.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg text-ink">Payment</h2>
          <div className="rounded-2xl border border-gold bg-gold-tint/40 px-4 py-3">
            <p className="text-sm font-medium text-ink">Cash on Delivery</p>
            <p className="text-xs text-ink-soft">
              Pay in cash when your bracelet arrives. Card &amp; wallet coming soon.
            </p>
          </div>
        </section>
      </form>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg text-ink">Order summary</h2>

          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li key={l.itemId} className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-linen">
                  {l.thumbnailUrl && (
                    <Image
                      src={l.thumbnailUrl}
                      alt={l.name}
                      fill
                      unoptimized
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm text-ink">{l.name}</p>
                  <p className="text-xs text-ink-soft">Qty {l.quantity}</p>
                </div>
                <span className="text-sm tabular-nums text-ink">
                  {formatPrice(l.lineTotalInPiastres)}
                </span>
              </li>
            ))}
          </ul>

          {/* Discount code */}
          <div className="mt-5 border-t border-border pt-5">
            <label className="label-caps mb-1 block">Discount code</label>
            <div className="flex gap-2">
              <Input
                value={form.discountCode}
                onChange={(e) => set("discountCode", e.target.value.toUpperCase())}
                placeholder="CODE"
                className="h-10"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={checkingCode || !form.discountCode.trim()}
                onClick={applyCode}
              >
                Apply
              </Button>
            </div>
            {discount && (
              <p className="mt-1 text-xs text-gold-strong">
                Code {discount.code} applied — {formatPrice(discount.amount)} off.
              </p>
            )}
            {discountError && (
              <p className="mt-1 text-xs text-destructive">{discountError}</p>
            )}
          </div>

          {/* Totals */}
          <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotalInPiastres)} />
            <Row
              label="Shipping"
              value={
                selectedGov
                  ? formatPrice(shipping)
                  : "Select governorate"
              }
              muted={!selectedGov}
            />
            {selectedGov?.estimatedDays && (
              <p className="text-xs text-ink-soft">
                Estimated delivery: {selectedGov.estimatedDays}
              </p>
            )}
            {discountAmount > 0 && (
              <Row
                label="Discount"
                value={`− ${formatPrice(discountAmount)}`}
              />
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-medium text-ink">Total</dt>
              <dd className="font-serif text-ink tabular-nums">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            disabled={pending}
            onClick={submit}
          >
            {pending ? "Placing order…" : "Place order"}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-soft">
            By placing this order you agree to pay on delivery.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1 block">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={cn("tabular-nums text-ink", muted && "text-ink-soft")}>
        {value}
      </dd>
    </div>
  );
}
