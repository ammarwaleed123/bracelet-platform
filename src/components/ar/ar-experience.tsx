"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, SwitchCamera, X } from "lucide-react";

import { arContent } from "@/content/ar";
import { useStudioStore } from "@/lib/studio/store";
import { indexCatalog } from "@/lib/studio/derive";
import { loadDraft } from "@/lib/studio/persistence";
import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";
import { buildDemoDesign } from "@/lib/ar/demo-design";
import { AR_TUNING, computeRawPose } from "@/lib/ar/pose";
import { HandTracker } from "@/lib/ar/hand-tracking";
import { Button } from "@/components/ui/button";
import { ArCanvas } from "./ar-canvas";
import type { PoseTarget } from "./ar-bracelet";
import { DebugPanel } from "./debug-panel";
import { QrCode } from "./qr-fallback";

type Phase = "explainer" | "starting" | "active" | "denied" | "unsupported";
type Facing = "environment" | "user";

export function ArExperience({
  catalog,
  siteUrl,
}: {
  catalog: StudioCatalog;
  siteUrl: string;
}) {
  const [phase, setPhase] = useState<Phase>("explainer");
  const [facing, setFacing] = useState<Facing>("environment");
  const [handPresent, setHandPresent] = useState(false);
  const [debug, setDebug] = useState(false);
  const [design, setDesign] = useState<StudioDesignState | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<PoseTarget>({ raw: null });
  const trackerRef = useRef<HandTracker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const facingRef = useRef<Facing>("environment");
  const lastDetectRef = useRef(0);
  const handPresentRef = useRef(false);

  const arUrl = useMemo(() => `${siteUrl.replace(/\/$/, "")}/studio/ar`, [siteUrl]);

  // Resolve the design (live studio store → autosaved draft → seeded demo) and
  // detect capability. Client-only — the store/draft live in the browser.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDebug = params.get("debug") === "1";
    setDebug(isDebug);

    const store = useStudioStore.getState();
    let resolved: StudioDesignState | null =
      store.baseId || store.components.length > 0
        ? { baseId: store.baseId, sizeCm: store.sizeCm, components: store.components }
        : null;
    if (!resolved) {
      const draft = loadDraft(indexCatalog(catalog));
      if (draft && (draft.components.length > 0 || draft.baseId)) resolved = draft;
    }
    if (!resolved) resolved = buildDemoDesign(catalog);
    setDesign(resolved);

    const hasCamera =
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    // AR is a phone experience: treat non-touch/desktop as unsupported (show a
    // QR to hop to a phone) unless ?debug=1 is set for on-desktop testing.
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (!hasCamera || (!coarse && !isDebug)) setPhase("unsupported");
  }, [catalog]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    const tracker = trackerRef.current;
    if (video && container && tracker && video.readyState >= 2) {
      const now = performance.now();
      const interval = 1000 / AR_TUNING.detectionFps;
      if (now - lastDetectRef.current >= interval) {
        lastDetectRef.current = now;
        const frame = tracker.detect(video, now);
        if (frame) {
          const vp = {
            containerW: container.clientWidth,
            containerH: container.clientHeight,
            videoW: video.videoWidth,
            videoH: video.videoHeight,
            mirrored: facingRef.current === "user",
          };
          poseRef.current.raw = computeRawPose(
            frame.image,
            frame.world,
            vp,
            AR_TUNING
          );
        } else {
          poseRef.current.raw = null;
        }
        const present = !!frame;
        if (present !== handPresentRef.current) {
          handPresentRef.current = present;
          setHandPresent(present);
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const attachStream = useCallback(async (want: Facing) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: want },
      audio: false,
    });
    stopStream();
    streamRef.current = stream;
    facingRef.current = want;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      await video.play().catch(() => {});
    }
  }, [stopStream]);

  const start = useCallback(async () => {
    setPhase("starting");
    try {
      await attachStream(facingRef.current);
      if (!trackerRef.current) {
        const tracker = new HandTracker();
        await tracker.init();
        trackerRef.current = tracker;
      }
      lastDetectRef.current = 0;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
      setPhase("active");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setPhase(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unsupported");
    }
  }, [attachStream, loop]);

  const flip = useCallback(async () => {
    const next: Facing = facingRef.current === "user" ? "environment" : "user";
    try {
      await attachStream(next);
      setFacing(next);
      poseRef.current.raw = null;
    } catch {
      // Keep the current camera if the other one isn't available.
    }
  }, [attachStream]);

  // Teardown on unmount.
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopStream();
      trackerRef.current?.close();
      trackerRef.current = null;
    };
  }, [stopStream]);

  const mirrored = facing === "user";

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 overflow-hidden bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 size-full object-cover"
        style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
      />

      {/* Bracelet overlay (only mount once we have a design + are live) */}
      {design && (phase === "active" || phase === "starting") && (
        <ArCanvas catalog={catalog} design={design} poseRef={poseRef} />
      )}

      {/* Guidance when no wrist is in frame */}
      {phase === "active" && !handPresent && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center px-6">
          <div className="rounded-2xl bg-ink/70 px-5 py-3 text-center text-cream backdrop-blur">
            <p className="font-serif text-lg">{arContent.guidance.heading}</p>
            <p className="mt-1 text-sm text-cream/80">{arContent.guidance.body}</p>
          </div>
        </div>
      )}

      {/* Live controls */}
      {phase === "active" && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Button asChild variant="secondary" size="sm">
            <Link href="/studio">
              <X aria-hidden /> {arContent.controls.exit}
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={flip}
            aria-label={arContent.controls.flipCamera}
          >
            <SwitchCamera aria-hidden /> {arContent.controls.flipCamera}
          </Button>
        </div>
      )}

      {phase === "active" && debug && <DebugPanel onClose={() => setDebug(false)} />}

      {/* Starting / warming up */}
      {phase === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40">
          <div className="size-10 rounded-full border-2 border-cream/30 border-t-cream motion-safe:animate-spin" />
          <p className="font-serif text-lg text-cream">{arContent.loading}</p>
        </div>
      )}

      {/* Overlaid intent screens (explainer / denied / unsupported) */}
      {(phase === "explainer" || phase === "denied" || phase === "unsupported") && (
        <div className="absolute inset-0 flex items-center justify-center bg-linen p-6">
          <div className="w-full max-w-sm text-center">
            {phase === "explainer" && (
              <>
                <span className="label-caps text-gold">{arContent.explainer.eyebrow}</span>
                <div className="mx-auto mt-5 flex size-14 items-center justify-center rounded-full bg-sand text-ink">
                  <Camera className="size-6" aria-hidden />
                </div>
                <h1 className="mt-5 font-serif text-3xl text-ink">
                  {arContent.explainer.heading}
                </h1>
                <p className="mt-3 text-ink-soft">{arContent.explainer.body}</p>
                <Button size="lg" className="mt-8 w-full" onClick={start}>
                  {arContent.explainer.cta}
                </Button>
                <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
                  <Link href="/studio">{arContent.explainer.back}</Link>
                </Button>
              </>
            )}

            {phase === "denied" && (
              <>
                <h1 className="font-serif text-3xl text-ink">{arContent.denied.heading}</h1>
                <p className="mt-3 text-ink-soft">{arContent.denied.body}</p>
                <Button size="lg" className="mt-8 w-full" onClick={start}>
                  {arContent.denied.retry}
                </Button>
                <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
                  <Link href="/studio">{arContent.denied.back}</Link>
                </Button>
              </>
            )}

            {phase === "unsupported" && (
              <>
                <h1 className="font-serif text-3xl text-ink">
                  {arContent.unsupported.heading}
                </h1>
                <p className="mt-3 text-ink-soft">{arContent.unsupported.body}</p>
                <div className="mt-6 flex justify-center">
                  <QrCode url={arUrl} />
                </div>
                <Button asChild variant="ghost" size="sm" className="mt-6 w-full">
                  <Link href="/studio">{arContent.unsupported.back}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
