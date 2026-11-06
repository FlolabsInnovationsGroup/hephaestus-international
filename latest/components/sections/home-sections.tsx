import { Col, Container, Section } from "@/components/layout/container";
import { ContentColumn } from "@/components/layout/content-column";
import { ClosingCtaChamber } from "@/components/sections/closing-cta-chamber";
import { DidYouKnowTimeline } from "@/components/sections/did-you-know-timeline";
import { EcosystemChamber } from "@/components/sections/ecosystem-chamber";
import { EngineThresholdChamber } from "@/components/sections/engine-threshold-chamber";
import { FormBridgeChamber } from "@/components/sections/form-bridge-chamber";
import { LearningEngineChamber } from "@/components/sections/learning-engine-chamber";
import { LemnosLegend } from "@/components/sections/lemnos-legend";
import { NameForgeChamber } from "@/components/sections/name-forge-chamber";
import { NameOriginsManuscript } from "@/components/sections/name-origins-manuscript";
import { PillarsCarousel } from "@/components/sections/pillars-carousel";
import { RootsChamber } from "@/components/sections/roots-chamber";
import { SharedPurposeSection as SharedPurpose } from "@/components/sections/shared-purpose";
import { TransitionBlock } from "@/components/sections/transition-block";
import { HeroBackdrop } from "@/components/ui/hero-backdrop";
import {
  SectionBackdrop,
  SectionCoverBackdrop,
  SectionImageSplit,
} from "@/components/ui/section-image";
import {
  Prose,
  ProseParagraph,
  SectionHeading,
  BalancedText,
} from "@/components/ui/typography";
import {
  hero,
  didYouKnow,
  positioning,
  pillars,
  mappingLegacy,
} from "@/content/site-content";
import { siteImages } from "@/lib/site-images";
import { type } from "@/lib/typography";
import {
  cardRadiusClass,
  glassSurfaceClass,
  glassTextClass,
  photoCoverOverlayClass,
  photoCoverOverlayStrongClass,
} from "@/lib/ui-styles";

const glassTitlePillClass = `inline-block max-w-full ${cardRadiusClass} ${glassSurfaceClass} px-5 py-3`;

export function HeroSection() {
  return (
    <HeroBackdrop
      image={siteImages.heroBackground}
      alt="Hephaestus International presentation hero"
      priority
    >
      <div className="mx-auto w-full max-w-3xl text-center [&_h1]:[text-shadow:0_1px_2px_rgb(0_0_0_/_0.95),0_2px_10px_rgb(0_0_0_/_0.9),0_4px_28px_rgb(0_0_0_/_0.65)] [&_p]:[text-shadow:0_1px_2px_rgb(0_0_0_/_0.95),0_2px_8px_rgb(0_0_0_/_0.88),0_4px_20px_rgb(0_0_0_/_0.6)]">
        <SectionHeading as="h1" scale="title" className="text-white">
          {hero.title}
        </SectionHeading>
        <BalancedText className={`mt-4 ${type.slideSubhead} text-white`}>
          {hero.subtitle}
        </BalancedText>
        <div className="mt-8 space-y-3 text-pretty text-white/90">
          <BalancedText className={type.slideLead}>{hero.taglines[0]}</BalancedText>
          <BalancedText className={type.slideBody}>{hero.taglines[1]}</BalancedText>
        </div>
      </div>
    </HeroBackdrop>
  );
}

export function DidYouKnowSection() {
  return (
    <Section id="did-you-know" padding="none">
      <SectionCoverBackdrop
        image={siteImages.didYouKnowBackground}
        alt="Aerial view of the Lemnos coastline in Greece"
        overlayClassName={photoCoverOverlayClass}
      >
        <Container className="py-16 md:py-24 lg:py-28">
          <ContentColumn centered className="mb-10 md:mb-12">
            <div className={glassTitlePillClass}>
              <SectionHeading as="h2" scale="title" className={glassTextClass}>
                {didYouKnow.leadIn}
              </SectionHeading>
            </div>
          </ContentColumn>
          <ContentColumn width="full">
            <DidYouKnowTimeline
              facts={didYouKnow.facts}
              closing={didYouKnow.closing}
              closingHref="#positioning"
            />
          </ContentColumn>
        </Container>
      </SectionCoverBackdrop>
    </Section>
  );
}


const MOBILE_PHOTO_HEADING_SHADOW =
  "max-lg:[text-shadow:0_1px_2px_rgb(0_0_0_/_0.95),0_2px_10px_rgb(0_0_0_/_0.9),0_4px_28px_rgb(0_0_0_/_0.65)]";

export function PositioningSection() {
  return (
    <Section id="positioning" padding="none">
      <SectionImageSplit
        image={siteImages.positioning}
        alt={positioning.title}
        overlay="heavy"
      >
        <SectionHeading
          scale="title"
          className={`max-lg:text-white ${MOBILE_PHOTO_HEADING_SHADOW}`}
        >
          {positioning.title}
        </SectionHeading>
        <div className="mt-6 w-full">
          <Prose
            size="lg"
            className="max-w-none [&_p]:type-slide-subhead [&_p]:![font-size:calc(var(--text-slide-subhead)-8px)] [&_p]:text-balance max-lg:text-white/90 max-lg:[&_p]:[text-shadow:0_1px_2px_rgb(0_0_0_/_0.95),0_2px_8px_rgb(0_0_0_/_0.88),0_4px_20px_rgb(0_0_0_/_0.6)] lg:[&_p]:[text-shadow:none]"
          >
            {positioning.paragraphs.map((paragraph) => (
              <ProseParagraph key={paragraph}>{paragraph}</ProseParagraph>
            ))}
          </Prose>
        </div>
      </SectionImageSplit>
    </Section>
  );
}

export function PillarsSection() {
  return (
    <Section id="pillars" padding="none">
      <SectionCoverBackdrop
        image={siteImages.pillarsBackground}
        alt="Rustic blacksmith workshop with tools and an anvil"
        overlayClassName={photoCoverOverlayStrongClass}
      >
        <Container className="py-16 md:py-24 lg:py-28">
          <ContentColumn centered className="mb-0 md:mb-1">
            <div className="relative isolate inline-block max-w-full px-3 py-2 text-center">
              <span
                className="pointer-events-none absolute inset-[-0.15em_-0.4em] -z-10 bg-black/35 blur-2xl dark:bg-black/55"
                aria-hidden
              />
              <SectionHeading
                as="h2"
                scale="headline"
                className="relative text-white [text-shadow:0_1px_2px_rgb(0_0_0_/_0.85),0_2px_12px_rgb(0_0_0_/_0.55)]"
              >
                {pillars.title}
              </SectionHeading>
            </div>
          </ContentColumn>
          <ContentColumn width="full">
            <PillarsCarousel items={pillars.items} />
          </ContentColumn>
        </Container>
      </SectionCoverBackdrop>
    </Section>
  );
}

export function RootsTransition() {
  return <RootsChamber />;
}

export function MappingLegacySection() {
  return (
    <Section id="mapping-legacy" padding="none">
      <SectionBackdrop
        image={siteImages.mappingLegacy}
        alt={mappingLegacy.title}
        contentAlign="upper-center"
        contentClassName="pt-[4%] sm:pt-[5%] md:pt-[6%] lg:pt-[7%]"
        overlay="top"
      >
        <Container>
          <ContentColumn
            centered
            className="[&_h2]:[text-shadow:0_1px_2px_rgb(0_0_0_/_0.95),0_2px_10px_rgb(0_0_0_/_0.9),0_4px_28px_rgb(0_0_0_/_0.65)]"
          >
            <SectionHeading as="h2" className="text-white">
              {mappingLegacy.title}
            </SectionHeading>
          </ContentColumn>
        </Container>
      </SectionBackdrop>
    </Section>
  );
}

export function LemnosSection() {
  return <LemnosLegend />;
}

export function NameBridgeTransition() {
  return <NameForgeChamber />;
}

export function NameOriginsSection() {
  return <NameOriginsManuscript />;
}

export function EngineBridgeTransition() {
  return <EngineThresholdChamber />;
}

export function LearningEngineSection() {
  return <LearningEngineChamber />;
}

export function FormBridgeTransition() {
  return <FormBridgeChamber />;
}

export function EcosystemSection() {
  return (
    <Section id="ecosystem" padding="none">
      <EcosystemChamber />
    </Section>
  );
}

export function SharedPurposeSection() {
  return <SharedPurpose />;
}

export function ClosingCtaSection() {
  return <ClosingCtaChamber />;
}
