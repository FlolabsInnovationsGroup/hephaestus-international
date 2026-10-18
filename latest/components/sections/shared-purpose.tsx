import Image from "next/image";
import Link from "next/link";
import { Col, Container, Section } from "@/components/layout/container";
import { sharedPurpose } from "@/content/site-content";
import { preventOrphans } from "@/lib/prevent-orphans";
import { siteImages } from "@/lib/site-images";
import { linkBounceHoverClass } from "@/lib/ui-styles";

const TEXT_SHADOW =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 2px 8px rgb(0 0 0 / 0.88), 0 4px 20px rgb(0 0 0 / 0.6)";
const TEXT_SHADOW_DISPLAY =
  "0 1px 2px rgb(0 0 0 / 0.95), 0 4px 16px rgb(0 0 0 / 0.7), 0 10px 36px rgb(0 0 0 / 0.55)";

const serif =
  "font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] font-bold";

const kickerClass = `${serif} text-[clamp(1.15rem,2vw,1.45rem)] leading-[1.35] tracking-[0.04em] text-brand-primary`;
const headlineClass = `${serif} text-[clamp(1.85rem,4.2vw,3rem)] leading-[1.12] tracking-[0.04em] text-balance text-white`;
const labelClass = `${serif} text-[clamp(1.2rem,2.15vw,1.65rem)] leading-[1.28] tracking-[0.02em] text-balance text-brand-primary`;
const leadClass = `${serif} text-[clamp(1.15rem,2.2vw,1.55rem)] leading-[1.35] tracking-[0.03em] text-pretty text-white`;
const bodyClass = `${serif} text-[clamp(1.05rem,1.7vw,1.28rem)] leading-[1.45] text-pretty text-white/95`;

function BeatDivider() {
  return (
    <div
      className="mx-auto my-5 flex w-full max-w-[12rem] items-center justify-center gap-2.5 sm:max-w-[14rem]"
      aria-hidden
    >
      <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent))]" />
      <span className="size-1 shrink-0 rotate-45 border border-brand-primary/70 bg-brand-primary/35" />
      <span className="h-px flex-1 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-brand-primary)_55%,transparent),transparent)]" />
    </div>
  );
}

export function SharedPurposeSection() {
  return (
    <Section
      id="shared-purpose"
      padding="none"
      className="relative isolate scroll-mt-[var(--site-header-height)] overflow-hidden"
    >
      <Image
        src={siteImages.pillarsBackground.src}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[rgb(8_6_4/0.68)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_85%_75%_at_50%_42%,rgb(8_6_4/0.2),rgb(4_2_1/0.72)_100%)]"
        aria-hidden
      />
      <div className="closing-cta__grain pointer-events-none absolute inset-0 z-[3]" aria-hidden />

      <Container className="relative z-10 py-16 md:py-24 lg:py-28">
        <Col span={12}>
          <div className="mx-auto max-w-3xl text-center">
            <p className={kickerClass} style={{ textShadow: TEXT_SHADOW }}>
              {sharedPurpose.kicker}
            </p>
            <BeatDivider />
            <h2 className={headlineClass} style={{ textShadow: TEXT_SHADOW_DISPLAY }}>
              {sharedPurpose.headline.map((line) => (
                <span key={line} className="block">
                  {preventOrphans(line)}
                </span>
              ))}
            </h2>
          </div>
        </Col>

        <Col span={6} className="mt-12 md:mt-16 lg:mt-20 lg:pr-6">
          <h3 className={labelClass} style={{ textShadow: TEXT_SHADOW }}>
            {sharedPurpose.mission.label}
          </h3>
          <p className={`${leadClass} mt-4`} style={{ textShadow: TEXT_SHADOW }}>
            {sharedPurpose.mission.lines.map((line) => (
              <span key={line} className="block">
                {preventOrphans(line)}
              </span>
            ))}
          </p>
          <p className={`${bodyClass} mt-5`} style={{ textShadow: TEXT_SHADOW }}>
            {sharedPurpose.mission.body}
          </p>
        </Col>

        <Col span={6} className="mt-10 md:mt-16 lg:mt-20 lg:pl-6">
          <h3 className={labelClass} style={{ textShadow: TEXT_SHADOW }}>
            {sharedPurpose.vision.label}
          </h3>
          <p className={`${bodyClass} mt-4`} style={{ textShadow: TEXT_SHADOW }}>
            {sharedPurpose.vision.body}
          </p>
          <p className={`${bodyClass} mt-8 md:mt-10`} style={{ textShadow: TEXT_SHADOW }}>
            {sharedPurpose.teams}
          </p>
          <Link
            href={sharedPurpose.learningHref}
            className={`${linkBounceHoverClass} ${serif} mt-4 inline-flex min-h-11 items-center py-2 text-[clamp(1.05rem,1.7vw,1.28rem)] leading-[1.45] text-white underline decoration-white/80 underline-offset-[0.3em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary`}
            style={{ textShadow: TEXT_SHADOW }}
          >
            {preventOrphans(sharedPurpose.learningLabel)}
          </Link>
        </Col>
      </Container>
    </Section>
  );
}
