"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/typography";
import { siteImages, type SiteImageAsset } from "@/lib/site-images";
import { type } from "@/lib/typography";
import {
  buttonRadiusClass,
  chippedSurfaceClass,
  glassTextClass,
} from "@/lib/ui-styles";

type PillarItem = {
  number: string;
  title: string;
  paragraphs: readonly string[];
};

const pillarImagesByTitle: Record<string, SiteImageAsset> = {
  "What We Do": siteImages.pillarWhatWeDo,
  "How We Do It": siteImages.pillarHowWeDo,
  "Why It Matters": siteImages.pillarWhyItMatters,
};

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={direction === "prev" ? "" : "rotate-180"}
    >
      <path
        d="M14.5 5.5L8 12L14.5 18.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function relativeOffset(index: number, active: number, length: number) {
  let diff = index - active;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

export function PillarsCarousel({ items }: { items: readonly PillarItem[] }) {
  const labelId = useId();
  const [active, setActive] = useState(0);
  const count = items.length;

  const go = useCallback(
    (direction: -1 | 1) => {
      setActive((current) => (current + direction + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go]);

  return (
    <div
      className="relative w-full"
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="sr-only">
        How we built the future pillars
      </p>

      <div className="relative mx-auto flex min-h-[24rem] items-center justify-center overflow-x-clip sm:min-h-[26rem] md:min-h-[29rem]">
        <ul className="relative m-0 flex h-full w-full max-w-5xl list-none items-center justify-center p-0">
          {items.map((item, index) => {
            const offset = relativeOffset(index, active, count);
            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 1;
            const translateX =
              offset === 0 ? "0%" : offset < 0 ? "-105%" : "105%";
            const scale = isCenter ? 1.06 : 0.84;
            const zIndex = isCenter ? 10 : 5 - Math.abs(offset);
            const image = pillarImagesByTitle[item.title];

            return (
              <li
                key={item.number}
                aria-hidden={!isCenter}
                aria-current={isCenter ? "true" : undefined}
                className="absolute left-1/2 top-1/2 w-[min(100%,19.5rem)] max-md:data-[center=false]:invisible sm:w-[min(100%,21.5rem)] md:w-[min(42%,23.5rem)]"
                data-center={isCenter ? "true" : "false"}
                style={{
                  transform: `translate(-50%, -50%) translateX(${isVisible ? translateX : "0%"}) scale(${isVisible ? scale : 0.8})`,
                  zIndex,
                  opacity: isVisible ? 1 : 0,
                  pointerEvents: isVisible ? "auto" : "none",
                  transition:
                    "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Focus ${item.title}`}
                  aria-pressed={isCenter}
                  className={`w-full text-center transition-transform duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary motion-reduce:transform-none motion-reduce:transition-none ${
                    isCenter
                      ? "cursor-default"
                      : "cursor-pointer hover:-translate-y-2"
                  }`}
                >
                  <Card
                    chipSeed={item.number}
                    className={`flex min-h-[19.5rem] flex-col justify-between sm:min-h-[21rem] ${
                      isCenter ? "ring-1 ring-brand-primary/35" : ""
                    }`}
                  >
                    <div>
                      {image ? (
                        <div className="mx-auto mb-4 flex w-full max-w-[9.5rem] justify-center sm:max-w-[10.75rem]">
                          <Image
                            src={image.src}
                            alt=""
                            width={image.width}
                            height={image.height}
                            className="h-auto w-full object-contain"
                            sizes="172px"
                          />
                        </div>
                      ) : null}
                      <SectionHeading
                        as="h3"
                        scale="lead"
                        className={`text-center ${glassTextClass}`}
                      >
                        {item.title}
                      </SectionHeading>
                      <div
                        className={`mt-4 space-y-2 text-center ${type.slideBody} ${glassTextClass}`}
                      >
                        {item.paragraphs.map((paragraph) => (
                          <p key={paragraph} className="text-pretty">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 sm:gap-5">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous pillar"
          className={`inline-flex size-11 shrink-0 items-center justify-center border border-border bg-card/85 text-foreground backdrop-blur-md transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:border-white/20 dark:bg-black/45 ${buttonRadiusClass} ${chippedSurfaceClass}`}
        >
          <ChevronIcon direction="prev" />
        </button>

        <div
          className="flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Pillar slides"
        >
          {items.map((item, index) => {
            const isActive = index === active;
            return (
              <button
                key={item.number}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show ${item.title}`}
                onClick={() => setActive(index)}
                className="h-1.5 min-h-[var(--min-touch-target)] min-w-11 px-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                <span
                  className={`block h-1.5 w-full transition-colors ${chippedSurfaceClass} ${
                    isActive
                      ? "bg-brand-primary"
                      : "bg-foreground/25 dark:bg-white/30"
                  }`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next pillar"
          className={`inline-flex size-11 shrink-0 items-center justify-center border border-border bg-card/85 text-foreground backdrop-blur-md transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:border-white/20 dark:bg-black/45 ${buttonRadiusClass} ${chippedSurfaceClass}`}
        >
          <ChevronIcon direction="next" />
        </button>
      </div>
    </div>
  );
}
