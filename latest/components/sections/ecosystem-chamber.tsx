"use client";

import Image from "next/image";
import {
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ecosystem } from "@/content/site-content";
import {
  ecosystemArtifactMedia,
  type EcosystemArtifactId,
  type EcosystemArtifactMedia,
} from "@/lib/ecosystem-artifacts";
import { siteImages } from "@/lib/site-images";
import { withBasePath } from "@/lib/site-url";

const easeCinematic: [number, number, number, number] = [0.22, 1, 0.36, 1];

const serif =
  "font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] font-bold";

const TEXT_SHADOW =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 2px 8px rgb(0 0 0 / 0.88), 0 4px 20px rgb(0 0 0 / 0.6)";
const TEXT_SHADOW_DISPLAY =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 4px 16px rgb(0 0 0 / 0.7), 0 10px 36px rgb(0 0 0 / 0.55)";

type EcosystemItem = (typeof ecosystem.items)[number];

function LibraryMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-full" fill="none" aria-hidden>
      <path
        d="M8 26V10.5c0-1.2.7-2.2 1.8-2.6L16 6l6.2 1.9c1.1.4 1.8 1.4 1.8 2.6V26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 6v20M11 13h3.2M11 17h3.2M17.8 13H21M17.8 17H21"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnvilMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-full" fill="none" aria-hidden>
      <path
        d="M7 14h18l-1.5 3.5H8.5L7 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 17.5V22h12v-4.5M12 22h8v2.5H12V22Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 11.5c2-2.5 5-4 7-4s5 1.5 7 4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MaskMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-full" fill="none" aria-hidden>
      <path
        d="M6.5 14c1.2-5 5-8 9.5-8s8.3 3 9.5 8c.4 1.6.5 3.2.2 4.6-.8 3.4-3.8 5.9-9.7 5.9s-8.9-2.5-9.7-5.9c-.3-1.4-.2-3 .2-4.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 15.2c.6-1 1.5-1.6 2.5-1.6M18.3 13.6c1 0 1.9.6 2.5 1.6M13 20.2c.8.7 1.8 1.1 3 1.1s2.2-.4 3-1.1"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

const marksById: Record<EcosystemArtifactId, ReactNode> = {
  flobrain: <LibraryMark />,
  caipo: <AnvilMark />,
  robocollective: <MaskMark />,
};

function DustMotes() {
  return (
    <div
      className="ecosystem-chamber__dust pointer-events-none absolute inset-0 z-[6] overflow-hidden max-md:hidden"
      aria-hidden
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="ecosystem-chamber__mote absolute rounded-full bg-white/28 blur-[0.5px]"
          style={{
            width: `${1.25 + (i % 3) * 0.5}px`,
            height: `${1.25 + (i % 3) * 0.5}px`,
            left: `${14 + ((i * 7.3) % 72)}%`,
            top: `${18 + ((i * 9.1) % 62)}%`,
            animationDelay: `${i * 0.85}s`,
            animationDuration: `${16 + (i % 4) * 2.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function IntelligenceSectionHeader() {
  const reduceMotion = useReducedMotion();

  return (
    <header className="mx-auto mb-14 max-w-3xl text-center md:mb-16 lg:mb-20">
      <div
        className="mb-5 flex items-center justify-center gap-3"
        aria-hidden
      >
        <motion.span
          className="h-px origin-right bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent))]"
          initial={reduceMotion ? false : { scaleX: 0, opacity: 1 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: reduceMotion ? 0 : 0.85,
            ease: easeCinematic,
          }}
          style={{ width: "clamp(2.5rem, 12vw, 5.5rem)" }}
        />
        <span className="size-1.5 rotate-45 border border-brand-primary/70 bg-brand-primary/35" />
        <motion.span
          className="h-px origin-left bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent),transparent)]"
          initial={reduceMotion ? false : { scaleX: 0, opacity: 1 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: reduceMotion ? 0 : 0.85,
            ease: easeCinematic,
          }}
          style={{ width: "clamp(2.5rem, 12vw, 5.5rem)" }}
        />
      </div>

      <motion.h2
        id="ecosystem-heading"
        className={`${serif} text-[clamp(1.85rem,4.2vw,3rem)] leading-[1.12] tracking-[0.04em] text-balance text-white`}
        style={{ textShadow: TEXT_SHADOW_DISPLAY }}
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{
          duration: reduceMotion ? 0 : 0.9,
          ease: easeCinematic,
          delay: reduceMotion ? 0 : 0.08,
        }}
      >
        {ecosystem.title}
      </motion.h2>

      <motion.p
        className={`${serif} mx-auto mt-5 max-w-[42ch] text-[clamp(1.15rem,2.2vw,1.55rem)] leading-[1.35] tracking-[0.03em] text-pretty text-white/95`}
        style={{ textShadow: TEXT_SHADOW }}
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{
          duration: reduceMotion ? 0 : 0.85,
          ease: easeCinematic,
          delay: reduceMotion ? 0 : 0.18,
        }}
      >
        {ecosystem.subtitle}
      </motion.p>
    </header>
  );
}

function ArtifactMedallion({
  id,
  active,
}: {
  id: EcosystemArtifactId;
  active: boolean;
}) {
  return (
    <div className="ecosystem-artifact__medallion-slot" aria-hidden>
      <div
        className={`ecosystem-artifact__medallion ${
          active ? "ecosystem-artifact__medallion--active" : ""
        }`}
      >
        <span className="ecosystem-artifact__medallion-ring">
          <span className="ecosystem-artifact__medallion-icon">
            {marksById[id]}
          </span>
        </span>
      </div>
    </div>
  );
}

function ArtifactMedia({ media }: { media: EcosystemArtifactMedia }) {
  return (
    <div className="ecosystem-artifact__media">
      <div className="ecosystem-artifact__media-mask">
        <div className="ecosystem-artifact__media-zoom relative size-full">
          {media.image ? (
            <Image
              src={withBasePath(media.image)}
              alt={media.imageAlt}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 40vw, 28rem"
              className="ecosystem-artifact__image"
              style={{
                objectFit: media.imageFit,
                objectPosition: media.imagePosition,
                transform:
                  media.imageScale != null && media.imageScale !== 1
                    ? `scale(${media.imageScale})`
                    : undefined,
              }}
            />
          ) : (
            <div
              className="ecosystem-artifact__placeholder"
              role="img"
              aria-label={media.imageAlt}
            >
              <span
                className="ecosystem-artifact__placeholder-mark"
                aria-hidden
              />
              <span className="ecosystem-artifact__placeholder-label">
                Image to be added
              </span>
            </div>
          )}
          <div className="ecosystem-artifact__media-veil" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function ArtifactContent({ item }: { item: EcosystemItem }) {
  return (
    <div className="ecosystem-artifact__content">
      <h3
        className={`${serif} text-[clamp(1.2rem,2.15vw,1.65rem)] leading-[1.28] tracking-[0.02em] text-balance text-brand-primary`}
        style={{ textShadow: TEXT_SHADOW }}
      >
        {item.title}
      </h3>
      <div
        className={`${serif} mt-5 max-w-[42rem] space-y-3.5 text-[clamp(1.05rem,1.7vw,1.28rem)] leading-[1.45] text-white/95`}
        style={{ textShadow: TEXT_SHADOW }}
      >
        {item.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-pretty">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

function ArtifactFeatureCard({
  item,
  index,
  active,
  onActivate,
}: {
  item: EcosystemItem;
  index: number;
  active: boolean;
  onActivate: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const id = item.id as EcosystemArtifactId;
  const media = ecosystemArtifactMedia[id];
  const fromLeft = index % 2 === 0;
  const xEnter = fromLeft ? -36 : 36;

  return (
    <motion.article
      className="ecosystem-artifact"
      initial={
        reduceMotion ? false : { opacity: 0, y: 36, x: xEnter * 0.5 }
      }
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      onViewportEnter={onActivate}
      transition={{
        duration: reduceMotion ? 0 : 0.85,
        ease: easeCinematic,
      }}
    >
      <div className="ecosystem-artifact__shell">
        <ArtifactMedia media={media} />
        <ArtifactMedallion id={id} active={active} />
        <ArtifactContent item={item} />
      </div>
    </motion.article>
  );
}

function ProgressRail({
  progress,
  activated,
}: {
  progress: MotionValue<number>;
  activated: boolean[];
}) {
  const scaleY = useTransform(progress, [0, 1], [0, 1]);

  return (
    <div className="ecosystem-chamber__rail" aria-hidden>
      <div className="ecosystem-chamber__rail-track" />
      <motion.div
        className="ecosystem-chamber__rail-fill"
        style={{ scaleY, transformOrigin: "top" }}
      />
      <ol className="ecosystem-chamber__rail-nodes">
        {ecosystem.items.map((item, index) => (
          <li
            key={item.id}
            className={`ecosystem-chamber__rail-node ${
              activated[index] ? "ecosystem-chamber__rail-node--active" : ""
            }`}
            style={{
              top: `${(index / Math.max(ecosystem.items.length - 1, 1)) * 100}%`,
            }}
          />
        ))}
      </ol>
    </div>
  );
}

export function EcosystemChamber() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [activated, setActivated] = useState<boolean[]>(() =>
    ecosystem.items.map(() => false),
  );

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.75", "end 0.45"],
  });

  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(
    sectionProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["-2.5%", "2.5%"],
  );

  const activate = useCallback((index: number) => {
    setActivated((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }, []);

  return (
    <div
      ref={sectionRef}
      className="ecosystem-chamber relative isolate overflow-hidden"
    >
      <motion.div
        className="ecosystem-chamber__bg pointer-events-none absolute inset-x-0 -top-[6%] -bottom-[6%] -z-10"
        style={reduceMotion ? undefined : { y: bgY }}
        aria-hidden
      >
        <Image
          src={siteImages.ecosystemBackground.src}
          alt="Library of Celsus at Ephesus with classical columns and stone facade"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={false}
        />
      </motion.div>

      <div
        className="ecosystem-chamber__overlay pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
      />
      <div
        className="ecosystem-chamber__vignette pointer-events-none absolute inset-0 z-[2]"
        aria-hidden
      />
      <div
        className="ecosystem-chamber__haze pointer-events-none absolute inset-0 z-[3]"
        aria-hidden
      />
      <div
        className="ecosystem-chamber__grain pointer-events-none absolute inset-0 z-[4]"
        aria-hidden
      />
      {!reduceMotion ? <DustMotes /> : null}

      <div className="relative z-10 mx-auto w-full max-w-[78rem] px-4 py-16 sm:px-6 md:py-24 lg:px-8 lg:py-28">
        <IntelligenceSectionHeader />

        <div
          ref={listRef}
          className="ecosystem-chamber__feature-list relative"
        >
          {!reduceMotion ? (
            <ProgressRail progress={scrollYProgress} activated={activated} />
          ) : null}

          <div className="feature-list flex flex-col gap-7 md:gap-9 lg:gap-10">
            {ecosystem.items.map((item, index) => (
              <ArtifactFeatureCard
                key={item.id}
                item={item}
                index={index}
                active={activated[index] || Boolean(reduceMotion)}
                onActivate={() => activate(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
