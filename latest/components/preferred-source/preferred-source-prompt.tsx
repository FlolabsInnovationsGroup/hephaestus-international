"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { preferredSource } from "@/content/site-content";
import { balanceText } from "@/lib/prevent-orphans";
import { openPreferredSourceInline } from "@/lib/preferred-source";
import { type } from "@/lib/typography";
import { cardRadiusClass, chippedSurfaceClass } from "@/lib/ui-styles";
import { Button } from "@/components/ui/button";
import { GoogleMark } from "@/components/preferred-source/google-mark";

const STORAGE_KEY = "hephaestus-preferred-source-prompt";

function readDismissed() {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "accepted") return true;
    if (sessionStorage.getItem(STORAGE_KEY) === "dismissed") return true;
  } catch {
    return true;
  }
  return false;
}

function remember(choice: "accepted" | "dismissed") {
  try {
    if (choice === "accepted") {
      localStorage.setItem(STORAGE_KEY, "accepted");
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, "dismissed");
  } catch {
    // Private browsing can block storage. The prompt still closes for this view.
  }
}

export function PreferredSourcePrompt() {
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (readDismissed()) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        remember("dismissed");
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button, a, [href], [tabindex]:not([tabindex='-1'])")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!mounted || !open) return null;

  const dismiss = () => {
    remember("dismissed");
    setOpen(false);
  };

  const confirm = () => {
    remember("accepted");
    if (!openPreferredSourceInline()) {
      window.open(preferredSource.deeplink, "_blank", "noopener,noreferrer");
    }
    setOpen(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      onClick={dismiss}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className={`${cardRadiusClass} ${chippedSurfaceClass} w-full max-w-lg border border-border bg-card p-4 shadow-lg outline-none sm:p-[var(--spacing-card)]`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <GoogleMark className="mt-0.5 size-6 shrink-0" />
          <h2 id={titleId} className={`${type.titleMedium} font-semibold text-balance text-foreground`}>
            {balanceText(preferredSource.title)}
          </h2>
        </div>
        <p id={bodyId} className={`mt-3 ${type.bodyMedium} text-pretty text-muted`}>
          {preferredSource.body}
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className={`inline-flex min-h-11 items-center px-3 ${type.labelLarge} text-foreground transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary`}
          >
            {balanceText(preferredSource.dismissLabel)}
          </button>
          <Button onClick={confirm}>{preferredSource.confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
