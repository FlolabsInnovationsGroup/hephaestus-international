/**
 * Media slots for the “Where Intelligence Takes Form” artifact cards.
 *
 * Text copy lives in `content/site-content.ts` (`ecosystem`) and must stay untouched.
 * Paths are rooted at `public/` and passed through `withBasePath` at render time.
 */
export type ArtifactImageFit = "cover" | "contain";

export type EcosystemArtifactMedia = {
  /** Public path (e.g. `/images/caipo.png`), or `null` until the asset exists. */
  image: string | null;
  imageAlt: string;
  imageFit: ArtifactImageFit;
  /** CSS `object-position` value, e.g. `"center"`, `"center top"`, `"40% 30%"`. */
  imagePosition: string;
  /** Optional display scale inside the media frame (1 = full size). */
  imageScale?: number;
};

export const ecosystemArtifactMedia = {
  flobrain: {
    image: "/images/flobrain.png",
    imageAlt: "FloBrain metallic brain artifact",
    imageFit: "contain" as const,
    imagePosition: "center",
  },
  caipo: {
    image: "/images/caipo.png",
    imageAlt: "CAIPO wearable device",
    imageFit: "contain" as const,
    imagePosition: "center",
  },
  robocollective: {
    image: "/images/robocolective.png",
    imageAlt: "RoboCollective humanoid robot",
    imageFit: "contain" as const,
    imagePosition: "center",
    imageScale: 0.78,
  },
} as const satisfies Record<string, EcosystemArtifactMedia>;

export type EcosystemArtifactId = keyof typeof ecosystemArtifactMedia;
