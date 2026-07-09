"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const full =
      typeof window !== "undefined" ? new URL(url, window.location.origin).href : url;
    try {
      if (navigator.share) {
        await navigator.share({ url: full });
        return;
      }
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // user cancelled share or clipboard blocked — no-op
    }
  };

  return (
    <Button variant="outline" onClick={share}>
      {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
