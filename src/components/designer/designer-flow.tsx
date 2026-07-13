"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { generateDesigns } from "@/lib/ai/actions";
import type { DesignConcept, GenerateError } from "@/lib/ai/types";
import type { StudioCatalog } from "@/lib/studio/types";
import { Button } from "@/components/ui/button";
import { designer, type DesignerStep } from "@/content/designer";
import { ConceptCard } from "./concept-card";

type Answers = {
  occasion?: string;
  forWhom?: string;
  vibe?: string;
  colors: string[];
  values: string[];
};

const STEPS = designer.steps;
const BUDGET_STEP = STEPS.length; // budget is the final screen

type Phase =
  | { kind: "form" }
  | { kind: "loading" }
  | { kind: "results"; concepts: DesignConcept[] }
  | { kind: "error"; error: GenerateError };

export function DesignerFlow({ catalog }: { catalog: StudioCatalog }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ colors: [], values: [] });
  const [budget, setBudget] = useState<number>(designer.budget.default);
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [pending, start] = useTransition();

  const run = () =>
    start(async () => {
      setPhase({ kind: "loading" });
      const res = await generateDesigns({
        occasion: answers.occasion,
        forWhom: answers.forWhom,
        vibe: answers.vibe,
        colors: answers.colors,
        values: answers.values,
        budgetPiastres: budget,
      });
      setPhase(
        res.ok
          ? { kind: "results", concepts: res.concepts }
          : { kind: "error", error: res.error }
      );
    });

  /* --------------------------------------------------------- loading --- */
  if (phase.kind === "loading" || (pending && phase.kind !== "results")) {
    return (
      <Centered>
        <Loader2 className="size-8 animate-spin text-gold" aria-hidden />
        <h2 className="mt-6 font-serif text-2xl text-ink">
          {designer.generating.title}
        </h2>
        <p className="mt-2 max-w-sm text-ink-soft">{designer.generating.sub}</p>
      </Centered>
    );
  }

  /* ----------------------------------------------------------- error --- */
  if (phase.kind === "error") {
    return (
      <Centered>
        <h2 className="text-balance font-serif text-2xl text-ink">
          {designer.errors[phase.error]}
        </h2>
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setStep(0);
              setPhase({ kind: "form" });
            }}
          >
            {designer.results.startOver}
          </Button>
          <Button onClick={run}>{designer.errors.retry}</Button>
        </div>
      </Centered>
    );
  }

  /* --------------------------------------------------------- results --- */
  if (phase.kind === "results") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="text-center">
          <p className="label-caps">{designer.results.eyebrow}</p>
          <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">
            {designer.results.title}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            {designer.results.subhead}
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {phase.concepts.map((c, i) => (
            <ConceptCard key={i} concept={c} catalog={catalog} />
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => { setStep(0); setPhase({ kind: "form" }); }}>
            {designer.results.startOver}
          </Button>
          <Button onClick={run} disabled={pending}>
            <Sparkles aria-hidden /> {designer.results.regenerate}
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ form --- */
  const onBudget = step === BUDGET_STEP;
  const progress = ((step + 1) / (STEPS.length + 1)) * 100;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col px-4 py-8">
      {/* progress */}
      <div className="mb-8 h-1 overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col">
        {onBudget ? (
          <BudgetStep budget={budget} onChange={setBudget} />
        ) : (
          <ChoiceStep
            step={STEPS[step]!}
            answers={answers}
            onSelect={(id, value, multi) => {
              setAnswers((a) => {
                if (!multi) return { ...a, [id]: value };
                const list = a[id as "colors" | "values"];
                const next = list.includes(value)
                  ? list.filter((v) => v !== value)
                  : [...list, value];
                return { ...a, [id]: next };
              });
              // Single-select auto-advances for a fast, one-tap feel.
              if (!multi) setStep((s) => s + 1);
            }}
          />
        )}
      </div>

      {/* nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className={cn(step === 0 && "invisible")}
        >
          <ArrowLeft aria-hidden /> {designer.controls.back}
        </Button>

        {onBudget ? (
          <Button onClick={run} disabled={pending}>
            <Sparkles aria-hidden /> {designer.controls.generate}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s + 1)}>
              {designer.controls.skip}
            </Button>
            {STEPS[step]!.multi && (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                {designer.controls.next}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- steps --- */

function ChoiceStep({
  step,
  answers,
  onSelect,
}: {
  step: DesignerStep;
  answers: Answers;
  onSelect: (id: DesignerStep["id"], value: string, multi: boolean) => void;
}) {
  const selected = (value: string) =>
    step.multi
      ? answers[step.id as "colors" | "values"].includes(value)
      : answers[step.id] === value;

  return (
    <div>
      <h2 className="text-balance font-serif text-2xl text-ink sm:text-3xl">
        {step.question}
      </h2>
      <p className="mt-2 text-sm text-ink-soft">{step.hint}</p>
      <div className="mt-7 flex flex-wrap gap-2.5">
        {step.choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onSelect(step.id, c.value, step.multi)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all",
              selected(c.value)
                ? "border-gold bg-gold-tint text-ink"
                : "border-border bg-card text-ink-soft hover:border-gold/40 hover:text-ink"
            )}
          >
            {c.hex && (
              <span
                className="size-3.5 rounded-full border border-black/10"
                style={{ backgroundColor: c.hex }}
                aria-hidden
              />
            )}
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BudgetStep({
  budget,
  onChange,
}: {
  budget: number;
  onChange: (v: number) => void;
}) {
  const { presets, min, max, step } = designer.budget;
  return (
    <div>
      <h2 className="text-balance font-serif text-2xl text-ink sm:text-3xl">
        {designer.budget.question}
      </h2>
      <p className="mt-2 text-sm text-ink-soft">{designer.budget.hint}</p>

      <p className="mt-8 text-center font-serif text-4xl text-ink">
        {formatPrice(budget)}
      </p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={budget}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={designer.budget.question}
        className="mt-5 w-full accent-gold"
      />
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-all",
              budget === p
                ? "border-gold bg-gold-tint text-ink"
                : "border-border bg-card text-ink-soft hover:border-gold/40 hover:text-ink"
            )}
          >
            {formatPrice(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}
