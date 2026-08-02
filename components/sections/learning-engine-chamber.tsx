"use client";

import { type ReactNode, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { learningEngine } from "@/content/site-content";
import { preventOrphans } from "@/lib/prevent-orphans";
import { siteImages } from "@/lib/site-images";
import { SectionImageSplit } from "@/components/ui/section-image";
import { externalBodyLinkClass, photoBrandAccentClass } from "@/lib/ui-styles";

const TEXT_SHADOW_TITLE =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 6px 24px rgb(0 0 0 / 0.65)";

const easeCinematic: [number, number, number, number] = [0.22, 1, 0.36, 1];

const serif =
  "font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] font-bold";

const ACCENTS = [
  "living system",
  "Alexandria",
  "Hypatia",
  "understanding",
  "learning",
  "shared",
] as const;

const accentPattern = new RegExp(
  `(${[...ACCENTS]
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
  "g",
);

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/** Narrative groups from existing paragraphs — copy unchanged. */
const GROUPS: readonly (readonly number[])[] = [
  [0, 1],
  [2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11],
] as const;

function ManuscriptRule() {
  return (
    <div
      className="learning-engine-ch__rule flex w-full max-w-[14rem] items-center gap-2.5"
      aria-hidden
    >
      <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent))]" />
      <span className="size-1 rotate-45 border border-brand-primary/70 bg-brand-primary/35" />
      <span className="h-px flex-1 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent),transparent)]" />
    </div>
  );
}

function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.9,
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

function HighlightedTerm({
  term,
  play,
  index,
}: {
  term: string;
  play: boolean;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const isHypatia = term === "Hypatia";
  const isAlexandria = term === "Alexandria";

  return (
    <motion.span
      className={`learning-engine-ch__ink inline font-bold text-brand-primary ${
        isHypatia ? "learning-engine-ch__hypatia" : ""
      }`}
      initial={reduceMotion ? false : { opacity: 0.45 }}
      animate={play || reduceMotion ? { opacity: 1 } : { opacity: 0.45 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: isHypatia ? 1.2 : 0.95,
              ease: easeCinematic,
              delay:
                (isHypatia ? 0.45 : isAlexandria ? 0.28 : 0.2) + index * 0.08,
            }
      }
    >
      {term}
    </motion.span>
  );
}

function AccentedText({
  text,
  play,
  startIndex,
}: {
  text: string;
  play: boolean;
  startIndex: number;
}) {
  const parts = preventOrphans(text)
    .split(accentPattern)
    .filter((p) => p.length > 0);
  let local = 0;

  return (
    <>
      {parts.map((part, index) => {
        if (!(ACCENTS as readonly string[]).includes(part)) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }
        const accentIndex = startIndex + local;
        local += 1;
        return (
          <HighlightedTerm
            key={`${part}-${index}`}
            term={part}
            play={play}
            index={accentIndex}
          />
        );
      })}
    </>
  );
}

function countAccents(text: string) {
  return text
    .split(accentPattern)
    .filter((p) => (ACCENTS as readonly string[]).includes(p)).length;
}

function LearningParagraph({
  text,
  play,
  accentStart,
  isHypatiaLine,
}: {
  text: string;
  play: boolean;
  accentStart: number;
  isHypatiaLine: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const bodyClass = `${serif} text-[clamp(1.02rem,1.55vw,1.2rem)] leading-[1.65] text-pretty text-white/95 max-lg:[text-shadow:0_1px_2px_rgb(0_0_0_/_0.95),0_2px_8px_rgb(0_0_0_/_0.88)] lg:[text-shadow:none]`;

  if (text.includes("(Insert the link*)")) {
    const parts = text.split("(Insert the link*)");
    const href = learningEngine.hypatiaHref;

    return (
      <motion.p
        className={bodyClass}
        variants={fadeUp}
        transition={{
          duration: reduceMotion ? 0 : isHypatiaLine ? 1.15 : 0.9,
          ease: easeCinematic,
        }}
      >
        <AccentedText text={parts[0]} play={play} startIndex={accentStart} />
        {href ? (
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`learning-engine-ch__hypatia inline font-bold no-underline ${photoBrandAccentClass} ${externalBodyLinkClass} lg:[text-shadow:none]`}
            initial={reduceMotion ? false : { opacity: 0.4 }}
            animate={play || reduceMotion ? { opacity: 1 } : { opacity: 0.4 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.2, ease: easeCinematic, delay: 0.5 }
            }
          >
            Hypatia
          </motion.a>
        ) : (
          <span className="text-white/60">(Insert the link*)</span>
        )}
        {parts[1] ? (
          <AccentedText
            text={parts[1]}
            play={play}
            startIndex={accentStart + countAccents(parts[0])}
          />
        ) : null}
      </motion.p>
    );
  }

  return (
    <motion.p
      className={bodyClass}
      variants={fadeUp}
      transition={{
        duration: reduceMotion ? 0 : 0.9,
        ease: easeCinematic,
      }}
    >
      <AccentedText text={text} play={play} startIndex={accentStart} />
    </motion.p>
  );
}

function ParagraphGroup({ indices }: { indices: readonly number[] }) {
  const reduceMotion = useReducedMotion();
  const [inkPlay, setInkPlay] = useState(false);
  let accentCursor = 0;
  const isFinal = indices[0] === 9;

  return (
    <motion.div
      className={`flex flex-col ${isFinal ? "gap-5 sm:gap-6" : "gap-4 sm:gap-5"}`}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      onViewportEnter={() => setInkPlay(true)}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: reduceMotion ? 0 : 0.14 },
        },
      }}
    >
      {indices.map((i) => {
        const text = learningEngine.paragraphs[i];
        const start = accentCursor;
        accentCursor += countAccents(
          text.replace("(Insert the link*)", "Hypatia"),
        );
        return (
          <LearningParagraph
            key={text}
            text={text}
            play={inkPlay || !!reduceMotion}
            accentStart={start}
            isHypatiaLine={text.includes("(Insert the link*)")}
          />
        );
      })}
    </motion.div>
  );
}

export function LearningEngineChamber() {
  return (
    <section
      id="learning-engine"
      aria-labelledby="learning-engine-title"
      className="learning-engine-ch relative isolate w-full bg-background"
    >
      <SectionImageSplit
        image={siteImages.learningEngine}
        alt="Sunlit aisles of an ancient library with tall shelves and arched windows"
        mobileOverlay="learning"
        contentClassName="py-16 md:py-24 lg:py-28"
      >
        <ScrollReveal className="mb-8 sm:mb-10" duration={1}>
          <div className="flex flex-col items-start gap-3 sm:gap-3.5">
            <h2
              id="learning-engine-title"
              className={`${serif} text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.15] tracking-[0.05em] text-balance text-white max-lg:[text-shadow:0_1px_2px_rgb(0_0_0_/_0.95),0_4px_18px_rgb(0_0_0_/_0.65)]`}
              style={{ textShadow: TEXT_SHADOW_TITLE }}
            >
              {learningEngine.title}
            </h2>
            <ManuscriptRule />
          </div>
        </ScrollReveal>

        <div className="flex flex-col gap-7 sm:gap-8 md:gap-10">
          {GROUPS.map((indices, groupIndex) => (
            <ParagraphGroup key={groupIndex} indices={indices} />
          ))}
        </div>
      </SectionImageSplit>
    </section>
  );
}
