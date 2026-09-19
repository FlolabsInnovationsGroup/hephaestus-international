"use client";

import Image from "next/image";
import { type ReactNode, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { closingCta } from "@/content/site-content";
import { preventOrphans } from "@/lib/prevent-orphans";
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
      className="closing-cta__divider mx-auto my-1 flex w-full max-w-[12rem] items-center justify-center gap-2.5 sm:max-w-[14rem]"
      aria-hidden
    >
      <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent))]" />
      <span className="size-1 shrink-0 rotate-45 border border-brand-primary/70 bg-brand-primary/35" />
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
      viewport={{ once: true, amount: 0.4 }}
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

function DustMotes() {
  return (
    <div
      className="closing-cta__dust pointer-events-none absolute inset-0 z-[6] overflow-hidden max-md:hidden"
      aria-hidden
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="closing-cta__mote absolute rounded-full bg-white/28 blur-[1px]"
          style={{
            width: `${1.5 + (i % 3)}px`,
            height: `${1.5 + (i % 3)}px`,
            left: `${18 + ((i * 6.4) % 58)}%`,
            top: `${20 + ((i * 8.7) % 55)}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${15 + (i % 4) * 2.5}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ClosingCtaChamber() {
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
    reduceMotion ? [0.8, 0.8] : [0.55, 0.95],
  );
  const exitWash = useTransform(
    scrollYProgress,
    [0.55, 1],
    reduceMotion ? [0.4, 0.4] : [0.2, 0.7],
  );
  const copyY = useTransform(
    scrollYProgress,
    [0.2, 0.8],
    reduceMotion ? [0, 0] : [8, -6],
  );

  return (
    <section
      ref={sectionRef}
      id="join"
      aria-label="Join us"
      className="closing-cta relative isolate min-h-[100svh] w-full overflow-hidden md:min-h-[105svh]"
    >
      <div className="absolute inset-0">
        <motion.div
          className="closing-cta__scene absolute inset-0 origin-center will-change-transform"
          style={{ scale: imageScale }}
        >
          <Image
            src={siteImages.closing.src}
            alt="Join Hephaestus International"
            fill
            sizes="100vw"
            className="object-cover object-[50%_40%] sm:object-[52%_38%] md:object-center"
            priority={false}
          />
        </motion.div>

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(6,4,2,0.45)_0%,rgba(6,4,2,0.22)_30%,rgba(6,4,2,0.35)_55%,rgba(6,4,2,0.72)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[rgba(12,8,5,0.25)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_80%_70%_at_50%_48%,transparent_25%,rgba(4,2,1,0.55)_100%)]"
          aria-hidden
        />
        <motion.div
          className="closing-cta__bloom pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_50%_45%_at_50%_42%,rgba(232,178,92,0.22),transparent_68%)]"
          style={{ opacity: bloomOpacity }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[42%] bg-[linear-gradient(to_top,rgba(8,5,2,0.55),rgba(8,5,2,0.2)_50%,transparent)]"
          style={{ opacity: exitWash }}
          aria-hidden
        />
        <div className="closing-cta__grain pointer-events-none absolute inset-0 z-[5]" aria-hidden />
        <DustMotes />
      </div>

      <motion.div
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[var(--max-width-content)] items-center justify-center px-4 py-20 sm:px-6 md:min-h-[105svh] md:py-24 lg:px-8"
        style={{ y: copyY }}
      >
        <div className="flex w-full max-w-[34rem] flex-col items-center gap-5 text-center sm:max-w-[38rem] md:max-w-[40rem] md:gap-6 lg:max-w-[42rem]">
          <ScrollReveal delay={0.05} duration={0.95}>
            <p
              className={`${serif} text-[clamp(1.15rem,2vw,1.45rem)] leading-[1.35] tracking-[0.04em] text-pretty text-white`}
              style={{ textShadow: TEXT_SHADOW }}
            >
              {preventOrphans(closingCta.lead)}
            </p>
          </ScrollReveal>

          <BeatDivider />

          <ScrollReveal delay={0.18} duration={0.9}>
            <p
              className={`${serif} text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.25] tracking-[0.06em] text-balance text-white`}
              style={{ textShadow: TEXT_SHADOW_DISPLAY }}
            >
              {preventOrphans(closingCta.prompt)}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.28} duration={1}>
            <ul className="flex list-none flex-col items-center gap-2.5 p-0 sm:gap-3">
              {closingCta.questions.map((question) => (
                <li
                  key={question}
                  className={`${serif} text-[clamp(1.05rem,1.8vw,1.3rem)] leading-[1.3] tracking-[0.03em] text-pretty text-white/95`}
                  style={{ textShadow: TEXT_SHADOW }}
                >
                  {preventOrphans(question)}
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <BeatDivider />

          <ScrollReveal delay={0.4} duration={1.05}>
            <p
              className={`${serif} text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.05] tracking-[0.04em] text-balance text-white`}
              style={{ textShadow: TEXT_SHADOW_DISPLAY }}
            >
              {closingCta.headline}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.5} duration={1}>
            <p
              className={`${serif} text-[clamp(1.2rem,2.2vw,1.55rem)] leading-[1.25] tracking-[0.08em] text-balance text-brand-primary`}
              style={{ textShadow: TEXT_SHADOW }}
            >
              {preventOrphans(closingCta.tagline)}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.58} duration={0.85} className="pt-2">
            <div className="flex flex-wrap justify-center gap-4">
              <Button href={closingCta.primaryHref}>
                {closingCta.primaryLabel}
              </Button>
              <Button href="/contact" variant="secondary">
                Contact us
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </motion.div>
    </section>
  );
}
