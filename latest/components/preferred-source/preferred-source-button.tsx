"use client";

import { preferredSource } from "@/content/site-content";
import { balanceText } from "@/lib/prevent-orphans";
import { openPreferredSourceInline } from "@/lib/preferred-source";
import { type } from "@/lib/typography";
import { GoogleMark } from "@/components/preferred-source/google-mark";

export function PreferredSourceButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={preferredSource.deeplink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }
        if (openPreferredSourceInline()) {
          event.preventDefault();
        }
      }}
      className={`inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-full border border-white/10 bg-[#2a2a2a] px-4 text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${type.bodySmall} ${className}`}
    >
      <GoogleMark className="size-4 shrink-0" />
      <span className="text-balance">{balanceText(preferredSource.buttonLabel)}</span>
    </a>
  );
}
