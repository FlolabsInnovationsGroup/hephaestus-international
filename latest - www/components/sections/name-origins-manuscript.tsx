"use client";

import Image from "next/image";
import { type ReactNode, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { nameOrigins } from "@/content/site-content";
import { preventOrphans } from "@/lib/prevent-orphans";
import { siteImages } from "@/lib/site-images";

const TEXT_SHADOW =
  "0 1px 2px rgb(0 0 0 / 0.9), 0 3px 14px rgb(0 0 0 / 0.55)";
const TEXT_SHADOW_TITLE =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 6px 24px rgb(0 0 0 / 0.65)";

const easeCinematic: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ACCENTS = [
  "Hephaestus International",
  "learning through doing",
  "questioning what exists",
  "reclaimed",
  "spark",
  "Hephaestus",
  "making",
  "craft",
  "knowledge",
  "creation",
] as const;

const accentPattern = new RegExp(
  `(${[...ACCENTS]
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
  "g",
);

const serif =
  "font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] font-bold";

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

type Passage = {
  id: string;
  lines: readonly string[];
  emphasis?: "lead" | "body" | "strong";
};

const PASSAGES: Passage[] = [
  {
    id: "reclaim",
    lines: [nameOrigins.leftBlocks[0][0], nameOrigins.leftBlocks[0][1]],
    emphasis: "lead",
  },
  {
    id: "spark",
    lines: [nameOrigins.leftBlocks[0][2]],
    emphasis: "body",
  },
  {
    id: "chapter",
    lines: nameOrigins.rightBlocks[0],
    emphasis: "body",
  },
  {
    id: "mission",
    lines: nameOrigins.leftBlocks[1],
    emphasis: "strong",
  },
  {
    id: "making",
    lines: nameOrigins.rightBlocks[1],
    emphasis: "body",
  },
  {
    id: "historical",
    lines: nameOrigins.leftBlocks[2],
    emphasis: "body",
  },
  {
    id: "craft",
    lines: nameOrigins.rightBlocks[2],
    emphasis: "lead",
  },
];

function ManuscriptDivider() {
  return (
    <div
      className="name-origins-ms__divider mx-auto flex w-full max-w-[18rem] items-center gap-3 sm:max-w-[22rem]"
      aria-hidden
    >
      <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent))]" />
      <span className="size-1.5 rotate-45 border border-brand-primary/70 bg-brand-primary/35" />
      <span className="h-px flex-1 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent),transparent)]" />
    </div>
  );
}

function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 1,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      variants={fadeUp}
      transition={{
        duration: reduceMotion ? 0 : duration,
        ease: easeCinematic,
        delay: reduceMotion ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}

function HighlightedWord({
  word,
  play,
  index,
}: {
  word: string;
  play: boolean;
  index: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className="name-origins-ms__ink inline font-bold text-brand-primary"
      initial={reduceMotion ? false : { opacity: 0.55 }}
      animate={play || reduceMotion ? { opacity: 1 } : { opacity: 0.55 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: 1.05,
              ease: easeCinematic,
              delay: 0.3 + index * 0.1,
            }
      }
    >
      {word}
    </motion.span>
  );
}

function AccentedLine({
  text,
  play,
  startIndex,
  className,
}: {
  text: string;
  play: boolean;
  startIndex: number;
  className: string;
}) {
  const parts = preventOrphans(text)
    .split(accentPattern)
    .filter((part) => part.length > 0);
  let accentLocal = 0;

  return (
    <p className={className} style={{ textShadow: TEXT_SHADOW }}>
      {parts.map((part, index) => {
        if (!(ACCENTS as readonly string[]).includes(part)) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }
        const accentIndex = startIndex + accentLocal;
        accentLocal += 1;
        return (
          <HighlightedWord
            key={`${part}-${index}`}
            word={part}
            play={play}
            index={accentIndex}
          />
        );
      })}
    </p>
  );
}

function countAccents(text: string) {
  return text
    .split(accentPattern)
    .filter((part) => (ACCENTS as readonly string[]).includes(part)).length;
}

function StoryPassage({
  passage,
  accentStart,
}: {
  passage: Passage;
  accentStart: number;
}) {
  const reduceMotion = useReducedMotion();
  const [inkPlay, setInkPlay] = useState(false);
  let cursor = accentStart;

  const lineClass =
    passage.emphasis === "strong"
      ? `${serif} text-center text-[clamp(1.15rem,2.1vw,1.55rem)] leading-[1.25] tracking-[0.03em] text-balance`
      : passage.emphasis === "lead"
        ? `${serif} text-center text-[clamp(1.2rem,2.2vw,1.65rem)] leading-[1.22] tracking-[0.04em] text-balance`
        : `${serif} text-center text-[clamp(1.05rem,1.85vw,1.35rem)] leading-[1.28] tracking-[0.03em] text-pretty`;

  return (
    <div className="name-origins-ms__passage relative w-full">
      <motion.div
        className="flex flex-col items-center gap-1.5 sm:gap-2"
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        onViewportEnter={() => setInkPlay(true)}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: reduceMotion ? 0 : 0.18,
            },
          },
        }}
      >
        {passage.lines.map((line) => {
          const start = cursor;
          cursor += countAccents(line);
          return (
            <motion.div
              key={line}
              variants={fadeUp}
              transition={{ duration: reduceMotion ? 0 : 1, ease: easeCinematic }}
            >
              <AccentedLine
                text={line}
                play={inkPlay || !!reduceMotion}
                startIndex={start}
                className={`${lineClass} text-[#E8DFD0]`}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function ClosingSpark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 text-brand-primary sm:size-6 ${className}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.5 13.2 9.2 19.5 12 13.2 14.8 12 21.5 10.8 14.8 4.5 12l6.3-2.8L12 2.5Z" />
    </svg>
  );
}

function ClosingAnvilMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`size-7 text-brand-primary/90 sm:size-8 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 18h20l-2 4H8z" />
      <path d="M10 22v4h12v-4" />
      <path d="M4 16h10l2 2" />
      <path d="M20 7l4 7M18 10h10" />
    </svg>
  );
}

function ClosingStatement() {
  return (
    <div className="name-origins-ms__closing-frame relative w-full max-w-[40rem] px-4 py-7 sm:px-7 sm:py-8 md:px-9 md:py-9">
      <div
        className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] border border-brand-primary/35 bg-[linear-gradient(180deg,rgba(8,16,28,0.72),rgba(4,8,16,0.82))] shadow-[0_0_0_1px_rgba(18,105,199,0.12),0_12px_40px_rgba(0,0,0,0.45)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[1px] rounded-[calc(var(--radius-card)-1px)] bg-[radial-gradient(ellipse_80%_70%_at_50%_40%,rgba(18,105,199,0.16),transparent_72%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col items-center gap-4 sm:gap-5">
        <div className="flex items-center gap-3" aria-hidden>
          <ClosingSpark />
          <ClosingAnvilMark />
          <ClosingSpark />
        </div>

        <AccentedLine
          text={nameOrigins.footer}
          play
          startIndex={0}
          className={`${serif} name-origins-ms__closing text-center text-[clamp(1.2rem,2.3vw,1.75rem)] uppercase leading-[1.25] tracking-[0.16em] text-balance text-white`}
        />

        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px w-8 bg-[linear-gradient(90deg,transparent,var(--color-brand-primary))] sm:w-10" />
          <ClosingSpark className="size-3.5 sm:size-4" />
          <span className="h-px w-8 bg-[linear-gradient(90deg,var(--color-brand-primary),transparent)] sm:w-10" />
        </div>
      </div>
    </div>
  );
}

function AtmosphereDust() {
  return (
    <div
      className="name-origins-ms__dust pointer-events-none absolute inset-0 z-[6] overflow-hidden max-md:hidden"
      aria-hidden
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="name-origins-ms__mote absolute rounded-full bg-white/25 blur-[1px]"
          style={{
            width: `${1.5 + (i % 3)}px`,
            height: `${1.5 + (i % 3)}px`,
            left: `${18 + ((i * 7.1) % 64)}%`,
            top: `${12 + ((i * 9.3) % 70)}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${16 + (i % 4) * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

export function NameOriginsManuscript() {
  let accentCursor = 0;

  return (
    <section
      id="name-origins"
      aria-labelledby="name-origins-title"
      className="name-origins-ms relative isolate w-full"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-black">
          <Image
            src={siteImages.nameOrigins.src}
            alt=""
            fill
            sizes="100vw"
            className="name-origins-ms__image object-cover object-center opacity-[0.72]"
            priority={false}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_45%,rgba(8,10,16,0.28),rgba(2,3,6,0.82)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_42%,rgba(0,0,0,0.22),transparent_70%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,16,0.35),rgba(4,6,12,0.2)_40%,rgba(2,3,6,0.5))]"
            aria-hidden
          />
          <div
            className="name-origins-ms__candle pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_50%_40%,rgba(18,105,199,0.08),transparent_70%)]"
            aria-hidden
          />
          <div className="name-origins-ms__grain pointer-events-none absolute inset-0" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.65)]"
            aria-hidden
          />
          <AtmosphereDust />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[var(--max-width-content)] flex-col items-center px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 md:pb-24 md:pt-24 lg:px-8">
        <ScrollReveal className="relative mb-8 w-full max-w-[36rem] sm:mb-9 md:mb-10" duration={1.15}>
          <div className="flex flex-col items-center gap-3 text-center">
            <h2
              id="name-origins-title"
              className={`${serif} text-[clamp(1.85rem,4.5vw,3.25rem)] uppercase leading-[1.05] tracking-[0.22em] text-balance text-brand-primary`}
              style={{ textShadow: TEXT_SHADOW_TITLE }}
            >
              <span className="block">The origins</span>
              <span className="mt-0.5 block text-[0.72em] tracking-[0.28em]">of the</span>
              <span className="mt-0.5 block">Name</span>
            </h2>
            <span className="sr-only">{nameOrigins.title}</span>
            <ManuscriptDivider />
          </div>
        </ScrollReveal>

        <div className="flex w-full max-w-[34rem] flex-col items-center gap-8 sm:gap-9 md:max-w-[36rem] md:gap-10 lg:gap-11">
          {PASSAGES.map((passage, index) => {
            const start = accentCursor;
            for (const line of passage.lines) {
              accentCursor += countAccents(line);
            }

            return (
              <div key={passage.id} className="flex w-full flex-col items-center gap-5 sm:gap-6">
                {index > 0 ? <ManuscriptDivider /> : null}
                <StoryPassage passage={passage} accentStart={start} />
              </div>
            );
          })}
        </div>

        <ScrollReveal
          className="mt-10 flex w-full max-w-[40rem] flex-col items-center sm:mt-12 md:mt-14"
          duration={1.35}
          delay={0.1}
        >
          <ClosingStatement />
        </ScrollReveal>
      </div>
    </section>
  );
}
