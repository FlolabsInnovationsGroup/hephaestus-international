"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BalancedText } from "@/components/ui/typography";
import { preventOrphansInParagraph } from "@/lib/prevent-orphans";
import { type } from "@/lib/typography";
import {
  buttonRadiusClass,
  chippedSurfaceClass,
  glassTextClass,
} from "@/lib/ui-styles";

gsap.registerPlugin(ScrollTrigger);

const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

const marcellusClass =
  "font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif]";

function TimelineMarker({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex size-12 items-center justify-center bg-brand-primary text-white shadow-[0_2px_10px_rgb(18_105_199_/_0.45)] ${chippedSurfaceClass} ${className}`}
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 14L12 18L16 14"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <path
          d="M8 10L12 6L16 10"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  );
}

export function DidYouKnowTimeline({
  facts,
  closing,
  closingHref = "#positioning",
}: {
  facts: readonly string[];
  closing: string;
  closingHref?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const closingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const fill = fillRef.current;
    const marker = markerRef.current;
    const closingEl = closingRef.current;
    if (!root || !track || !fill || !marker) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const slides = slideRefs.current.filter(Boolean) as HTMLElement[];

    let removeDesktopListener: (() => void) | undefined;

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set([...slides, closingEl].filter(Boolean), {
          clearProps: "all",
          opacity: 1,
          x: 0,
        });
        gsap.set(fill, { scaleY: 1 });
        gsap.set(marker, {
          top: 0,
          xPercent: -50,
          y: () => Math.max(track.offsetHeight - 4, 0),
        });
        return;
      }

      slides.forEach((slide, index) => {
        const fromRight = index % 2 === 0;
        gsap.from(slide, {
          scrollTrigger: {
            trigger: slide,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
          x: fromRight ? 64 : -64,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
        });
      });

      if (closingEl) {
        gsap.from(closingEl, {
          scrollTrigger: {
            trigger: closingEl,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
          y: 18,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
        });
      }

      const syncScrub = () => {
        ScrollTrigger.getAll()
          .filter((st) => st.vars.id === "did-you-know-scrub")
          .forEach((st) => st.kill());

        if (!desktop.matches) {
          gsap.set(fill, { scaleY: 1 });
          gsap.set(marker, { clearProps: "transform,top" });
          return;
        }

        const scrubRoot = track.parentElement;
        if (!scrubRoot) return;

        gsap.set(fill, { scaleY: 0, transformOrigin: "top center" });
        gsap.set(marker, { top: 0, y: 0, xPercent: -50 });

        const travelY = () => {
          const height = track.offsetHeight;
          return Math.max(height - 4, 0);
        };

        gsap
          .timeline({
            scrollTrigger: {
              id: "did-you-know-scrub",
              trigger: scrubRoot,
              start: "top 60%",
              end: "bottom 45%",
              scrub: 0.65,
              invalidateOnRefresh: true,
            },
          })
          .to(fill, { scaleY: 1, ease: "none", duration: 1 }, 0)
          .to(marker, { y: travelY, ease: "none", duration: 1 }, 0);
      };

      syncScrub();
      requestAnimationFrame(() => ScrollTrigger.refresh());
      desktop.addEventListener("change", syncScrub);
      removeDesktopListener = () =>
        desktop.removeEventListener("change", syncScrub);
    }, root);

    return () => {
      removeDesktopListener?.();
      ctx.revert();
    };
  }, [facts.length]);

  return (
    <div
      ref={rootRef}
      className="flex w-full flex-col items-center gap-8 md:gap-10"
    >
      <div
        className={`inline-flex items-center justify-center border border-border bg-card/80 px-5 py-2.5 backdrop-blur-md dark:border-white/15 dark:bg-black/35 ${buttonRadiusClass} ${chippedSurfaceClass}`}
      >
        <span
          className={`${type.slideBody} font-medium tracking-[0.12em] uppercase ${glassTextClass}`}
        >
          Origins
        </span>
      </div>

      <div className="relative w-full">
        <div
          ref={trackRef}
          className="pointer-events-none absolute inset-y-2 left-1/2 z-0 hidden w-0 -translate-x-1/2 lg:block"
          aria-hidden
        >
          <div className="relative h-full w-0">
            <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 overflow-hidden bg-border/90 dark:bg-white/20">
              <div
                ref={fillRef}
                className="h-full w-full origin-top bg-brand-primary"
              />
            </div>

            <div
              ref={markerRef}
              className="absolute left-1/2 top-0 z-30 will-change-transform"
              style={{ transform: "translateX(-50%)" }}
            >
              <div className="-translate-y-1/2">
                <TimelineMarker />
              </div>
            </div>
          </div>
        </div>

        <ol className="relative z-10 m-0 flex list-none flex-col gap-5 p-0 md:gap-7 lg:gap-10">
          {facts.map((fact, index) => {
            const alignRight = index % 2 === 0;
            const roman = ROMAN[index] ?? String(index + 1);

            return (
              <li key={fact} className="relative">
                <div
                  className={`flex w-full flex-col gap-3 lg:flex-row lg:items-center ${
                    alignRight ? "lg:justify-end" : "lg:justify-start"
                  }`}
                >
                  <div
                    ref={(el) => {
                      slideRefs.current[index] = el;
                    }}
                    className={`w-full lg:w-[min(100%,28rem)] xl:w-[min(100%,32rem)] ${
                      alignRight
                        ? "lg:mr-[calc(50%+1.75rem)]"
                        : "lg:ml-[calc(50%+1.75rem)]"
                    }`}
                  >
                    <div className="transition-transform duration-300 ease-out hover:-translate-y-2 motion-reduce:transform-none motion-reduce:transition-none">
                      <Card chipSeed={index} className="relative">
                      <div className="mb-3 flex items-center gap-3">
                        <span
                          className={`inline-flex min-h-9 min-w-9 items-center justify-center border border-brand-primary/35 bg-brand-primary/10 px-2 text-sm font-semibold tracking-wide text-brand-primary ${marcellusClass} ${chippedSurfaceClass}`}
                          aria-hidden
                        >
                          {roman}
                        </span>
                        <span className="sr-only">Fact {index + 1}</span>
                      </div>
                      <p
                        className={`${type.slideBody} text-pretty ${glassTextClass}`}
                      >
                        {preventOrphansInParagraph(fact)}
                      </p>
                    </Card>
                    </div>
                  </div>

                  <span
                    className={`pointer-events-none absolute top-1/2 z-20 hidden -translate-y-1/2 lg:inline-flex ${
                      alignRight
                        ? "left-[calc(50%+2.25rem)]"
                        : "right-[calc(50%+2.25rem)]"
                    }`}
                    aria-hidden
                  >
                    <span
                      className={`inline-flex min-h-10 items-center border border-border bg-card/90 px-3 py-1.5 text-sm tracking-wide text-foreground backdrop-blur-md dark:border-white/15 dark:bg-black/40 ${marcellusClass} ${chippedSurfaceClass}`}
                    >
                      {roman}
                    </span>
                  </span>
                </div>

                {index < facts.length - 1 ? (
                  <div
                    className="mx-auto mt-5 h-px w-full max-w-sm bg-gradient-to-r from-transparent via-border to-transparent lg:hidden dark:via-white/25"
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div ref={closingRef} className="w-full max-w-2xl">
        <Card chipSeed="did-you-know-closing" className="text-center">
          <BalancedText className={`${type.slideLead} ${glassTextClass}`}>
            {closing}
          </BalancedText>
          <div className="mt-6 flex justify-center">
            <Button href={closingHref}>Our Story</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
