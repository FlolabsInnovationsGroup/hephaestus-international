"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { nameBridge } from "@/content/site-content";
import { siteImages } from "@/lib/site-images";

const TEXT_SHADOW =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 2px 8px rgb(0 0 0 / 0.88), 0 4px 20px rgb(0 0 0 / 0.6)";
const TEXT_SHADOW_EMPHASIS =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 4px 16px rgb(0 0 0 / 0.7), 0 10px 36px rgb(0 0 0 / 0.55)";

const easeCinematic: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Seconds after the forge enters view before the first line appears. */
const INTRO_HOLD = 0.12;
/** Seconds between stanza reveals. */
const STANZA_GAP = 0.28;
const STANZA_DURATION = 0.95;

type StanzaLine =
  | { kind: "secondary"; text: string }
  | { kind: "emphasis"; before?: string; word: string; after?: string };

type Stanza = {
  aria: string;
  lines: StanzaLine[];
};

/**
 * Visual rhythm only. Spoken / aria text stays the exact site copy.
 * Emphasized words: work, legacy, earned, born.
 */
const STANZAS: Stanza[] = [
  {
    aria: nameBridge.lines[0],
    lines: [
      { kind: "secondary", text: "Before a name exists," },
      { kind: "emphasis", before: "the ", word: "work" },
      { kind: "secondary", text: "must speak." },
    ],
  },
  {
    aria: nameBridge.lines[1],
    lines: [
      { kind: "emphasis", before: "Before a ", word: "legacy" },
      { kind: "secondary", text: "can be claimed," },
      { kind: "secondary", text: "it must be" },
      { kind: "emphasis", word: "earned." },
    ],
  },
  {
    aria: nameBridge.lines[2],
    lines: [
      { kind: "secondary", text: "And so," },
      { kind: "secondary", text: "a name" },
      { kind: "emphasis", before: "is ", word: "born..." },
    ],
  },
];

function ForgeAtmosphere() {
  return (
    <>
      <div
        className="name-forge__grain pointer-events-none absolute inset-0 z-[5]"
        aria-hidden
      />
      <div
        className="name-forge__dust pointer-events-none absolute inset-0 z-[6] overflow-hidden"
        aria-hidden
      >
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={`dust-${i}`}
            className="name-forge__mote absolute rounded-full bg-white/30 blur-[1px]"
            style={{
              width: `${1.5 + (i % 3)}px`,
              height: `${1.5 + (i % 3)}px`,
              left: `${8 + ((i * 6.7) % 48)}%`,
              top: `${20 + ((i * 8.3) % 55)}%`,
              animationDelay: `${i * 0.75}s`,
              animationDuration: `${15 + (i % 5) * 2.8}s`,
            }}
          />
        ))}
      </div>
      <div
        className="name-forge__embers pointer-events-none absolute inset-0 z-[6] overflow-hidden"
        aria-hidden
      >
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={`ember-${i}`}
            className="name-forge__ember absolute rounded-full"
            style={{
              width: `${2 + (i % 2)}px`,
              height: `${2 + (i % 2)}px`,
              left: `${52 + ((i * 5.1) % 40)}%`,
              top: `${35 + ((i * 7.7) % 40)}%`,
              background:
                i % 2 === 0
                  ? "rgb(205 161 90 / 0.55)"
                  : "rgb(184 134 59 / 0.45)",
              boxShadow: "0 0 6px rgb(205 161 90 / 0.25)",
              animationDelay: `${i * 1.1}s`,
              animationDuration: `${10 + (i % 4) * 2.2}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function EmphasizedWord({
  before,
  word,
  after,
}: {
  before?: string;
  word: string;
  after?: string;
}) {
  return (
    <span className="inline">
      {before ? (
        <span
          className="font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] text-[clamp(1.45rem,2.85vw,2.05rem)] font-normal tracking-[0.1em] text-white"
          style={{ textShadow: TEXT_SHADOW }}
        >
          {before}
        </span>
      ) : null}
      <span
        className="relative inline-block font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] text-[clamp(1.75rem,3.4vw,2.5rem)] font-normal leading-[1.1] tracking-[0.06em] text-brand-primary"
        style={{ textShadow: TEXT_SHADOW_EMPHASIS }}
      >
        {word}
      </span>
      {after ? (
        <span
          className="font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] text-[clamp(1.45rem,2.85vw,2.05rem)] tracking-[0.1em] text-white"
          style={{ textShadow: TEXT_SHADOW }}
        >
          {after}
        </span>
      ) : null}
    </span>
  );
}

function StanzaBlock({
  stanza,
  index,
  play,
}: {
  stanza: Stanza;
  index: number;
  play: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const delay = reduceMotion ? 0 : INTRO_HOLD + index * STANZA_GAP;

  return (
    <motion.p
      className="flex flex-col gap-1.5 md:gap-2"
      initial={reduceMotion ? false : "hidden"}
      animate={play || reduceMotion ? "visible" : "hidden"}
      variants={{
        hidden: {
          opacity: 0,
          y: 10,
          filter: "blur(4px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        },
      }}
      transition={{
        duration: reduceMotion ? 0 : STANZA_DURATION,
        ease: easeCinematic,
        delay,
      }}
    >
      {stanza.lines.map((line, lineIndex) => {
        if (line.kind === "emphasis") {
          return (
            <span
              key={`${stanza.aria}-e-${lineIndex}`}
              className="block leading-[1.15]"
            >
              <EmphasizedWord
                before={line.before}
                word={line.word}
                after={line.after}
              />
            </span>
          );
        }

        return (
          <span
            key={`${stanza.aria}-s-${lineIndex}`}
            className="block font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] text-[clamp(1.45rem,2.85vw,2.05rem)] font-normal leading-[1.2] tracking-[0.1em] text-balance text-white"
            style={{ textShadow: TEXT_SHADOW }}
          >
            {line.text}
          </span>
        );
      })}
    </motion.p>
  );
}

export function NameForgeChamber() {
  const reduceMotion = useReducedMotion();
  const [narrationPlay, setNarrationPlay] = useState(false);

  return (
    <section
      id="name-bridge"
      aria-label="Before a name exists"
      className="name-forge relative isolate min-h-[100svh] w-full overflow-hidden"
    >
      <div className="name-forge__scene absolute inset-0">
        <Image
          src={siteImages.nameBridge.src}
          alt="Ancient forge with glowing steel on the anvil and flying sparks"
          fill
          sizes="100vw"
          priority={false}
          className="name-forge__image object-cover object-[72%_45%] sm:object-[76%_42%] md:object-[82%_40%] lg:object-[86%_38%]"
        />
      </div>

      {/* Soft left veil so type sits in shadow; forge stays open on the right */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_90%_80%_at_70%_42%,transparent_18%,rgba(6,3,1,0.42)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] max-md:bg-[linear-gradient(180deg,rgba(5,3,1,0.5)_0%,rgba(5,3,1,0.18)_28%,rgba(5,3,1,0.45)_62%,rgba(5,3,1,0.88)_100%)] md:bg-[linear-gradient(90deg,rgba(5,3,1,0.88)_0%,rgba(5,3,1,0.72)_16%,rgba(5,3,1,0.38)_34%,rgba(5,3,1,0.1)_52%,transparent_68%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(5,3,1,0.4)_0%,transparent_18%,transparent_70%,rgba(5,3,1,0.55)_100%)]"
        aria-hidden
      />
      {/* Warm haze from the steel */}
      <div
        className="name-forge__haze pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_45%_40%_at_78%_48%,rgba(205,161,90,0.2),transparent_68%)] max-md:bg-[radial-gradient(ellipse_70%_45%_at_60%_32%,rgba(205,161,90,0.14),transparent_65%)]"
        aria-hidden
      />
      {/* Light smoke */}
      <div
        className="name-forge__smoke pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[50%] bg-[linear-gradient(to_top,rgba(18,12,6,0.4),transparent)]"
        aria-hidden
      />
      <div
        className="name-forge__vignette pointer-events-none absolute inset-0 z-[4] shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]"
        aria-hidden
      />

      <ForgeAtmosphere />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[var(--max-width-content)] flex-col justify-end px-4 pt-28 sm:px-6 lg:px-8">
        <div className="sr-only">
          <h2>Before a name exists</h2>
          {nameBridge.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <motion.div
          className="mb-16 flex w-full max-w-[22rem] flex-col gap-8 sm:mb-20 sm:max-w-[26rem] md:mb-22 md:max-w-[28rem] md:gap-9 lg:mb-24 lg:max-w-[30rem] lg:gap-10"
          aria-hidden
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          onViewportEnter={() => setNarrationPlay(true)}
        >
          {STANZAS.map((stanza, index) => (
            <StanzaBlock
              key={stanza.aria}
              stanza={stanza}
              index={index}
              play={narrationPlay || !!reduceMotion}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
