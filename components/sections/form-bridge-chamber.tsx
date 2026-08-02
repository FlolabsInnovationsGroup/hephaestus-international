"use client";

import Image from "next/image";
import { type ReactNode, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { formBridge } from "@/content/site-content";
import { siteImages } from "@/lib/site-images";

const TEXT_SHADOW =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 2px 8px rgb(0 0 0 / 0.88), 0 4px 20px rgb(0 0 0 / 0.6)";
const TEXT_SHADOW_DISPLAY =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 4px 16px rgb(0 0 0 / 0.7), 0 10px 36px rgb(0 0 0 / 0.55)";

const easeCinematic: [number, number, number, number] = [0.22, 1, 0.36, 1];

const serif =
  "font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] font-bold";

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(5px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function BeatDivider() {
  return (
    <div
      className="form-bridge__divider my-1 flex items-center gap-2.5"
      aria-hidden
    >
      <span className="h-px w-7 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent))] sm:w-9" />
      <span className="size-1 rotate-45 border border-brand-primary/70 bg-brand-primary/35" />
      <span className="h-px w-7 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent),transparent)] sm:w-9" />
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
      viewport={{ once: true, amount: 0.45 }}
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

function StoryBeat({
  fullLine,
  lead,
  display,
  delay,
  emphasizeDisplay = false,
}: {
  fullLine: string;
  lead: string;
  display: string;
  delay: number;
  emphasizeDisplay?: boolean;
}) {
  return (
    <ScrollReveal delay={delay} duration={0.95}>
      <p className="sr-only">{fullLine}</p>
      <p className="flex flex-col gap-1" aria-hidden>
        <span
          className={`${serif} text-[clamp(1.2rem,2vw,1.45rem)] tracking-[0.12em] text-white`}
          style={{ textShadow: TEXT_SHADOW }}
        >
          {lead}
        </span>
        <span
          className={`${serif} text-[clamp(2.2rem,4.8vw,3.5rem)] leading-[1.08] tracking-[0.03em] ${
            emphasizeDisplay ? "text-brand-primary" : "text-white"
          }`}
          style={{ textShadow: TEXT_SHADOW_DISPLAY }}
        >
          {display}
        </span>
      </p>
    </ScrollReveal>
  );
}

function DustMotes() {
  return (
    <div
      className="form-bridge__dust pointer-events-none absolute inset-0 z-[6] overflow-hidden max-md:hidden"
      aria-hidden
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="form-bridge__mote absolute rounded-full bg-white/28 blur-[1px]"
          style={{
            width: `${1.5 + (i % 3)}px`,
            height: `${1.5 + (i % 3)}px`,
            left: `${20 + ((i * 6.4) % 55)}%`,
            top: `${18 + ((i * 8.7) % 58)}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${15 + (i % 4) * 2.5}s`,
          }}
        />
      ))}
    </div>
  );
}

export function FormBridgeChamber() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageScale = useTransform(
    scrollYProgress,
    [0.1, 0.85],
    reduceMotion ? [1.04, 1.04] : [1.02, 1.07],
  );
  const bloomOpacity = useTransform(
    scrollYProgress,
    [0.15, 0.7],
    reduceMotion ? [0.75, 0.75] : [0.55, 0.95],
  );
  const exitWash = useTransform(
    scrollYProgress,
    [0.65, 1],
    reduceMotion ? [0.35, 0.35] : [0.15, 0.65],
  );
  const copyY = useTransform(
    scrollYProgress,
    [0.2, 0.8],
    reduceMotion ? [0, 0] : [8, -6],
  );

  const toldLine = formBridge.lines[0];
  const formLine = formBridge.lines[1];

  return (
    <section
      ref={sectionRef}
      id="form-bridge"
      aria-label="Stories take form"
      className="form-bridge relative isolate min-h-[100svh] w-full overflow-hidden md:min-h-[105svh]"
    >
      <div className="absolute inset-0">
        <motion.div
          className="form-bridge__scene absolute inset-0 origin-center will-change-transform"
          style={{ scale: imageScale }}
        >
          <Image
            src={siteImages.ecosystemBridge.src}
            alt="Ancient carved stone facade bathed in warm light"
            fill
            sizes="100vw"
            className="object-cover object-[55%_42%] sm:object-[58%_40%] md:object-[60%_38%] lg:object-center"
            priority={false}
          />
        </motion.div>

        <div
          className="pointer-events-none absolute inset-0 z-[1] max-md:bg-[linear-gradient(180deg,rgba(6,4,2,0.55)_0%,rgba(6,4,2,0.28)_28%,rgba(6,4,2,0.42)_58%,rgba(6,4,2,0.78)_100%)] md:bg-[linear-gradient(90deg,rgba(6,4,2,0.82)_0%,rgba(6,4,2,0.62)_14%,rgba(6,4,2,0.28)_32%,rgba(6,4,2,0.08)_48%,transparent_62%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[rgba(12,8,5,0.22)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_85%_75%_at_55%_45%,transparent_28%,rgba(4,2,1,0.55)_100%)]"
          aria-hidden
        />
        <motion.div
          className="form-bridge__bloom pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_42%_48%_at_62%_40%,rgba(232,178,92,0.24),transparent_68%)] max-md:bg-[radial-gradient(ellipse_70%_45%_at_55%_32%,rgba(232,178,92,0.18),transparent_65%)]"
          style={{ opacity: bloomOpacity }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[42%] bg-[linear-gradient(to_top,rgba(255,210,140,0.22),rgba(180,120,50,0.08)_45%,transparent)]"
          style={{ opacity: exitWash }}
          aria-hidden
        />
        <div className="form-bridge__grain pointer-events-none absolute inset-0 z-[5]" aria-hidden />
        <DustMotes />
      </div>

      <motion.div
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[var(--max-width-content)] items-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 md:min-h-[105svh] md:pb-24 lg:px-8 lg:pb-28"
        style={{ y: copyY }}
      >
        <div className="flex w-full max-w-[28rem] flex-col gap-7 sm:max-w-[32rem] md:max-w-[34rem] md:gap-8 lg:max-w-[36rem] lg:gap-9">
          <StoryBeat
            fullLine={toldLine}
            lead="Most stories"
            display="are told…"
            delay={0.05}
          />
          <BeatDivider />
          <StoryBeat
            fullLine={formLine}
            lead="Ours is written and"
            display="takes a form…"
            delay={0.28}
            emphasizeDisplay
          />
        </div>
      </motion.div>
    </section>
  );
}
