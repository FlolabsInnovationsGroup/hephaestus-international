"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { preventOrphans } from "@/lib/prevent-orphans";
import { siteImages } from "@/lib/site-images";
import { lemnos } from "@/content/site-content";

const IVORY = "#FFFFFF";
const PARCHMENT = "#FFFFFF";

const TEXT_SHADOW_TITLE =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 4px 18px rgb(0 0 0 / 0.75), 0 12px 40px rgb(0 0 0 / 0.65)";
const TEXT_SHADOW_BODY =
  "0 1px 2px rgb(0 0 0 / 0.9), 0 4px 16px rgb(0 0 0 / 0.7), 0 10px 36px rgb(0 0 0 / 0.55)";
const TEXT_SHADOW_EMPHASIS =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 6px 22px rgb(0 0 0 / 0.75), 0 14px 42px rgb(0 0 0 / 0.6)";

const ACCENT_TERMS = [
  "For us,",
  "Hephaestus.",
  "Lemnos.",
  "Made.",
  "legacy…",
] as const;

const accentPattern = new RegExp(
  `(${ACCENT_TERMS.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g",
);

type PhraseRole = "lead" | "body" | "artifact-line" | "closing";

function classifyPhrase(text: string): PhraseRole {
  if (
    text === "Made." ||
    text === "Our forge." ||
    text === "Our workshop." ||
    text === "Our first lab."
  ) {
    return "artifact-line";
  }
  if (text.startsWith("Each journey") || text.startsWith("For us,")) {
    return "lead";
  }
  if (text.startsWith("That place was") || text.includes("forge of Hephaestus")) {
    return "closing";
  }
  return "body";
}

function countAccents(text: string) {
  return text
    .split(accentPattern)
    .filter((part) => (ACCENT_TERMS as readonly string[]).includes(part))
    .length;
}

function AccentedText({
  text,
  startIndex,
  play,
}: {
  text: string;
  startIndex: number;
  play: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const parts = text.split(accentPattern).filter((part) => part.length > 0);
  let accentLocal = 0;

  return (
    <>
      {parts.map((part, index) => {
        if (!(ACCENT_TERMS as readonly string[]).includes(part)) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        const accentIndex = startIndex + accentLocal;
        accentLocal += 1;

        return (
          <motion.span
            key={`${part}-${index}`}
            className="lemnos-legend__glow relative inline px-[0.12em] font-medium text-white"
            initial="hidden"
            animate={play || reduceMotion ? "visible" : "hidden"}
          >
            <motion.span
              className="lemnos-legend__glow-bg pointer-events-none absolute inset-y-[0.08em] left-0 right-0 -z-10 bg-brand-primary"
              aria-hidden
              style={{ transformOrigin: "left center" }}
              variants={{
                hidden: { scaleX: 0 },
                visible: { scaleX: 1 },
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.85,
                      ease: [0.22, 1, 0.36, 1],
                      delay: accentIndex * 0.7,
                    }
              }
            />
            <span className="relative z-[1]">{part}</span>
          </motion.span>
        );
      })}
    </>
  );
}

const ARTIFACTS = [
  {
    label: "Made.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
        <path
          d="M8 22V12l8-5 8 5v10l-8 5-8-5Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M16 7v18M8 12l8 5 8-5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: "Lemnos.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
        <path
          d="M4 22c3-1 5-5 7-5s3 4 5 4 3-6 6-6 4 4 6 5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M3 24h26" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Hephaestus.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
        <path
          d="M10 26V14l6-8 6 8v12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 26h16M13 18h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Our forge.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
        <path
          d="M7 24h18M9 24V12c0-3 3-5 7-5s7 2 7 5v12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M12 16h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Our workshop.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
        <path
          d="M6 24V13l10-6 10 6v11H6Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M13 24v-6h6v6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: "Our first lab.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
        <path
          d="M12 6h8M16 6v8l6 10H10l6-10V6Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function LemnosLegend() {
  const reduceMotion = useReducedMotion();
  const [highlightsPlay, setHighlightsPlay] = useState(false);
  const paragraphs = lemnos.paragraphs;

  const story = paragraphs.filter(
    (p) =>
      p !== "Made." &&
      p !== "Our forge." &&
      p !== "Our workshop." &&
      p !== "Our first lab.",
  );

  // Keep short artifact lines in the narrative too — poetic placement
  const opening = story.slice(0, 4);
  const middle = story.slice(4);
  const madeLine = paragraphs.find((p) => p === "Made.")!;
  const forgeLines = paragraphs.filter(
    (p) =>
      p === "Our forge." || p === "Our workshop." || p === "Our first lab.",
  );

  let accentCursor = 0;

  return (
    <section
      id="lemnos"
      aria-labelledby="lemnos-legend-title"
      className="lemnos-legend relative isolate min-h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0">
        <Image
          src={siteImages.lemnos.src}
          alt={lemnos.title}
          fill
          sizes="100vw"
          className="lemnos-legend__image object-cover object-[center_40%] md:object-[center_35%]"
          priority={false}
        />
      </div>

      {/* Atmosphere layers */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,transparent_20%,rgba(8,5,2,0.45)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(90deg,rgba(6,4,2,0.82)_0%,rgba(6,4,2,0.62)_28%,rgba(6,4,2,0.28)_52%,rgba(6,4,2,0.08)_72%,transparent_88%)] max-md:bg-[linear-gradient(180deg,rgba(6,4,2,0.45)_0%,rgba(6,4,2,0.2)_30%,rgba(6,4,2,0.55)_68%,rgba(6,4,2,0.88)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(6,4,2,0.35)_0%,transparent_22%,transparent_58%,rgba(6,4,2,0.55)_100%)]"
        aria-hidden
      />
      <div
        className="lemnos-legend__bloom pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_50%_40%_at_62%_32%,rgba(255,180,90,0.16),transparent_70%)]"
        aria-hidden
      />
      <div
        className="lemnos-legend__fog pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[45%] bg-[linear-gradient(to_top,rgba(20,14,8,0.35),transparent)]"
        aria-hidden
      />
      <div className="lemnos-legend__grain pointer-events-none absolute inset-0 z-[5]" aria-hidden />
      <div className="lemnos-legend__dust pointer-events-none absolute inset-0 z-[6] overflow-hidden" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="lemnos-legend__mote absolute rounded-full bg-[#F2E8D5]/25 blur-[1px]"
            style={{
              width: `${1.5 + (i % 3)}px`,
              height: `${1.5 + (i % 3)}px`,
              left: `${20 + ((i * 7.3) % 60)}%`,
              top: `${15 + ((i * 9.1) % 50)}%`,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${16 + (i % 4) * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[var(--max-width-content)] flex-col justify-end px-4 py-14 sm:px-6 md:justify-center md:py-20 lg:px-8 lg:py-24">
        <motion.div
          className="flex w-full max-w-[34rem] flex-col gap-7 md:max-w-[36rem] md:gap-8 lg:max-w-[38rem]"
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          onViewportEnter={() => setHighlightsPlay(true)}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: reduceMotion ? 0 : 0.14 },
            },
          }}
        >
          <motion.h2
            id="lemnos-legend-title"
              className="w-full max-w-none whitespace-nowrap font-sans text-[clamp(1.85rem,4.2vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.02em]"
            style={{
              color: IVORY,
              textShadow: TEXT_SHADOW_TITLE,
            }}
            variants={fadeUp}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {preventOrphans(lemnos.title)}
          </motion.h2>

          <div className="flex flex-col gap-6 md:gap-7">
            {opening.map((paragraph) => {
              const startIndex = accentCursor;
              accentCursor += countAccents(paragraph);
              return (
              <motion.p
                key={paragraph}
                className={`font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] leading-[1.5] text-pretty ${
                  classifyPhrase(paragraph) === "lead"
                    ? "text-[clamp(1.05rem,1.7vw,1.35rem)]"
                    : "text-[clamp(0.95rem,1.4vw,1.15rem)]"
                }`}
                style={{
                  color: PARCHMENT,
                  textShadow: TEXT_SHADOW_BODY,
                }}
                variants={fadeUp}
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              >
                <AccentedText
                  text={preventOrphans(paragraph)}
                  startIndex={startIndex}
                  play={highlightsPlay}
                />
              </motion.p>
              );
            })}

            <motion.p
              className="font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] text-[clamp(1.35rem,2.4vw,2rem)] font-normal tracking-[0.04em] text-balance"
              style={{
                color: IVORY,
                textShadow: TEXT_SHADOW_EMPHASIS,
              }}
              variants={fadeUp}
              transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {preventOrphans(madeLine)}
            </motion.p>

            {middle.map((paragraph) => {
              const startIndex = accentCursor;
              accentCursor += countAccents(paragraph);
              return (
              <motion.p
                key={paragraph}
                className={`max-w-[40ch] font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] leading-[1.5] text-pretty ${
                  classifyPhrase(paragraph) === "closing" ||
                  classifyPhrase(paragraph) === "lead"
                    ? "text-[clamp(1.05rem,1.65vw,1.3rem)]"
                    : "text-[clamp(0.92rem,1.35vw,1.1rem)] opacity-95"
                }`}
                style={{
                  color: PARCHMENT,
                  textShadow: TEXT_SHADOW_BODY,
                }}
                variants={fadeUp}
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              >
                <AccentedText
                  text={preventOrphans(paragraph)}
                  startIndex={startIndex}
                  play={highlightsPlay}
                />
              </motion.p>
              );
            })}

            <div className="flex flex-col gap-3 pt-1">
              {forgeLines.map((paragraph) => (
                <motion.p
                  key={paragraph}
                  className="font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] text-[clamp(1.15rem,2vw,1.55rem)] tracking-[0.02em] text-balance"
                  style={{
                    color: IVORY,
                    textShadow: TEXT_SHADOW_EMPHASIS,
                  }}
                  variants={fadeUp}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {preventOrphans(paragraph)}
                </motion.p>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.ul
          className="lemnos-legend__artifacts mx-auto mt-10 flex w-[90%] list-none flex-row flex-wrap items-start justify-center gap-x-6 gap-y-8 p-0 sm:mt-12 sm:gap-x-8 md:mt-14 md:gap-x-10 lg:gap-x-12"
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: reduceMotion ? 0 : 0.1 },
            },
          }}
        >
          {ARTIFACTS.map((artifact) => (
            <motion.li
              key={artifact.label}
              className="lemnos-legend__artifact group flex w-[6.5rem] flex-col items-center gap-2.5 text-center sm:w-[7.25rem]"
              variants={fadeUp}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              whileHover={
                reduceMotion
                  ? undefined
                  : { y: -4, transition: { duration: 0.35, ease: "easeOut" } }
              }
            >
              <span
                className="flex size-11 items-center justify-center text-white/85 transition-colors duration-300 group-hover:text-brand-primary sm:size-12"
                aria-hidden
              >
                {artifact.icon}
              </span>
              <span
                className="font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] text-[0.7rem] leading-snug tracking-[0.12em] uppercase sm:text-[0.78rem]"
                style={{ color: IVORY, textShadow: TEXT_SHADOW_BODY }}
              >
                {artifact.label}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
