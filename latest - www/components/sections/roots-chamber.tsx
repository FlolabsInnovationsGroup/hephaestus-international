import Image from "next/image";
import { preventOrphans } from "@/lib/prevent-orphans";
import { siteImages } from "@/lib/site-images";
import { roots } from "@/content/site-content";
import { type } from "@/lib/typography";

const phraseShadow =
  "0 1px 2px rgb(0 0 0 / 0.85), 0 2px 10px rgb(0 0 0 / 0.55)";

function PhraseDivider() {
  return (
    <div
      className="roots-chamber__divider my-4 flex items-center gap-3 md:my-5"
      aria-hidden
    >
      <span className="h-px w-7 bg-[linear-gradient(90deg,transparent,var(--color-brand-primary)_35%,var(--color-brand-primary))] opacity-80 md:w-9" />
      <span className="size-1 rotate-45 bg-brand-primary/85" />
      <span className="h-px w-7 bg-[linear-gradient(90deg,var(--color-brand-primary),var(--color-brand-primary)_65%,transparent)] opacity-80 md:w-9" />
    </div>
  );
}

function TempleDust() {
  return (
    <div className="roots-chamber__dust pointer-events-none absolute inset-0 z-[6] overflow-hidden" aria-hidden>
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className="roots-chamber__mote absolute rounded-full bg-white/30 blur-[1px]"
          style={{
            width: `${2 + (index % 3)}px`,
            height: `${2 + (index % 3)}px`,
            left: `${48 + (index * 4.1) % 42}%`,
            top: `${18 + (index * 7.3) % 55}%`,
            animationDelay: `${index * 0.85}s`,
            animationDuration: `${14 + (index % 5) * 2.5}s`,
          }}
        />
      ))}
    </div>
  );
}

export function RootsChamber() {
  const phrases = roots.lines;

  return (
    <section
      id="roots"
      aria-label="Origins"
      className="roots-chamber relative isolate min-h-[92vh] w-full overflow-hidden md:min-h-screen"
    >
      <div className="roots-chamber__scene absolute inset-0">
        <Image
          src={siteImages.rootsTransition.src}
          alt="Carved ancient stone monolith illuminated in a dark chamber"
          fill
          sizes="100vw"
          priority={false}
          className="roots-chamber__image object-cover object-[68%_42%] sm:object-[72%_40%] md:object-[78%_38%] lg:object-[82%_36%]"
        />
      </div>

      {/* Layered cinematic overlays */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_85%_75%_at_50%_45%,transparent_35%,rgba(0,0,0,0.38)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] max-md:bg-[linear-gradient(180deg,rgba(4,3,2,0.28)_0%,rgba(4,3,2,0.12)_30%,rgba(4,3,2,0.58)_62%,rgba(4,3,2,0.9)_100%)] md:bg-[linear-gradient(90deg,rgba(4,3,2,0.92)_0%,rgba(4,3,2,0.78)_18%,rgba(4,3,2,0.42)_38%,rgba(4,3,2,0.12)_58%,transparent_72%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[42%] bg-[linear-gradient(to_top,rgba(12,8,4,0.72),rgba(12,8,4,0.28)_45%,transparent)]"
        aria-hidden
      />
      <div
        className="roots-chamber__warm pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(ellipse_55%_60%_at_78%_42%,rgba(196,140,70,0.18),transparent_62%)] opacity-90 max-md:bg-[radial-gradient(ellipse_70%_50%_at_60%_35%,rgba(196,140,70,0.14),transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45),transparent)] md:h-28"
        aria-hidden
      />

      <TempleDust />

      <div className="relative z-10 mx-auto flex min-h-[92vh] w-[90%] max-w-[90rem] flex-col justify-end pb-10 pt-28 sm:pb-12 md:min-h-screen md:pb-14 lg:pb-16 lg:w-[90%]">
        <div className="roots-chamber__copy max-w-[22rem] pb-6 md:ml-0 md:max-w-[24rem] md:pb-8 lg:max-w-[26rem] lg:pb-10">
          {phrases.map((phrase, index) => {
            const isClosing = index === phrases.length - 1;

            return (
              <div key={phrase}>
                {index > 0 ? <PhraseDivider /> : null}
                <p
                  className={`roots-chamber__phrase font-[family-name:var(--font-marcellus),Georgia,'Times_New_Roman',serif] text-white text-balance ${
                    isClosing
                      ? `roots-chamber__phrase--closing mt-1 ${type.slideLead} ![font-size:calc(var(--text-slide-lead)*1.1)]`
                      : `${type.slideSubhead} ![font-size:calc(var(--text-slide-subhead)*1.1)]`
                  }`}
                  style={{
                    textShadow: phraseShadow,
                    animationDelay: `${0.15 + index * 0.28}s`,
                  }}
                >
                  {preventOrphans(phrase)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
