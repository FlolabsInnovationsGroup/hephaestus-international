/**
 * Centralized approved website copy from Hephaestus International. Version 3.pdf
 * Do not rewrite without approval. See contentTodos for flagged items.
 * Paragraphs group PDF line wraps; wording is unchanged.
 */

import { siteUrl, withBasePath } from "@/lib/site-url";

export const siteConfig = {
  name: "Hephaestus International",
  tagline: "Center of Excellence and Ethics",
  url: siteUrl,
  contactEmail: "info@hephaestus.international",
  linkedInLabel: "FloLabs Innovation on LinkedIn",
  linkedInUrl: "https://www.linkedin.com/company/flolabs-innovation/",
  youtubeUrl: "https://www.youtube.com/@flolabsinnovation",
  youtubeLabel: "FloLabs Innovation on YouTube",
  facebookUrl: "https://www.facebook.com/people/Flo-Labs-RD/61572285432918/",
  facebookLabel: "Flo Labs RD on Facebook",
  instagramUrl: "https://www.instagram.com/flolabsinnovations/",
  instagramLabel: "FloLabs Innovations on Instagram",
  tiktokUrl: "https://www.tiktok.com/@flomadlabs",
  tiktokLabel: "FloLabs on TikTok",
  redditUrl: "https://www.reddit.com/user/FloLabs_Innovations/",
  redditLabel: "FloLabs Innovations on Reddit",
} as const;

export const socialMediaLinks = [
  { id: "youtube", href: siteConfig.youtubeUrl, label: siteConfig.youtubeLabel },
  { id: "linkedin", href: siteConfig.linkedInUrl, label: siteConfig.linkedInLabel },
  { id: "facebook", href: siteConfig.facebookUrl, label: siteConfig.facebookLabel },
  { id: "instagram", href: siteConfig.instagramUrl, label: siteConfig.instagramLabel },
  { id: "tiktok", href: siteConfig.tiktokUrl, label: siteConfig.tiktokLabel },
  { id: "reddit", href: siteConfig.redditUrl, label: siteConfig.redditLabel },
] as const;

/** Google Search preferred source. Domain-level only (not a path). */
export const preferredSource = {
  domain: "hephaestus.international",
  deeplink: "https://www.google.com/preferences/source?q=hephaestus.international",
  buttonLabel: "Add as preferred source on Google",
  title: "Add Hephaestus International as a preferred source?",
  body: "Google can show Hephaestus International more often in Search. You can change this anytime in your Google preferences.",
  confirmLabel: "OK",
  dismissLabel: "Not now",
} as const;

export const contentTodos = [
  "Grammar: For us, is the place (slide 7)",
  "Typo: But with very system (slide 11)",
  "Slide 2 trailing = on Lemnos date line",
  "Contact form endpoint: confirm API vs mailto",
  "Footer YouTube URL: confirm channel URL with stakeholder",
] as const;

export const navPrimaryLinks = [
  { href: "/about", label: "About us" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/internships", label: "Internships" },
] as const;

export const navUtilityLinks = [{ href: "/contact", label: "Contact" }] as const;

export const navLinks = [...navPrimaryLinks, ...navUtilityLinks] as const;

export const siteFooter = {
  projectLine: "by FloLabs Innovations Group",
  description:
    "Where ancient history meets modern innovation. Where craft becomes code, curiosity becomes capability, and intention becomes infrastructure.",
  tagline: "Live Long and Prosper.",
  newsletter: {
    title: "Newsletter",
    prompt: "Receive the newest FloLabs updates at:",
    placeholder: "Enter your email...",
    submitLabel: "Subscribe to newsletter",
  },
  socialTitle: "Social Media",
  navigation: {
    title: "Navigation",
    links: [
      { label: "Home", href: "/" },
      ...navPrimaryLinks,
      navUtilityLinks[0],
    ],
  },
  projects: {
    title: "Projects",
    links: [
      {
        id: "athletic-performance-intelligence",
        label: "Athletic Performance Intelligence",
      },
      { id: "caipo", label: "CAIPO" },
      { id: "connecting-the-dots", label: "Connecting the Dots" },
      { id: "cosmos-intelligence", label: "Cosmos Intelligence" },
      { id: "flotravel", label: "Flo Travel" },
      { id: "flobrain", label: "FloBrain" },
      { id: "flolabs-innovations", label: "FloLabs Innovations Group" },
      { id: "flolabs-international", label: "FloLabs International" },
      { id: "flostudios", label: "FloStudios" },
      { id: "hephaestus-international", label: "Hephaestus International" },
      {
        id: "innovation-bootcamp-university",
        label: "Innovation Bootcamp University",
      },
      { id: "moodchanger", label: "MoodChanger" },
      { id: "moodchanger-pets", label: "MoodChanger for Pets" },
      {
        id: "legal-ethics",
        label: "Legal & Ethics Ventures Institute",
      },
      { id: "robocollective", label: "RoboCollective" },
      { id: "space-ventures", label: "Space Ventures Institute" },
      { id: "tarrl", label: "TARRL" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "Careers", href: "/internships" },
      { label: "Contact Us", href: "/contact" },
      {
        label: "Merch",
        href: "https://flolabsrd.notion.site/merch-background",
      },
    ],
  },
} as const;

export const hero = {
  title: "Hephaestus International",
  subtitle: "Center of Excellence and Ethics",
  taglines: [
    "From Origins to the Architecture of Intelligence.",
    "Be at the Center of the Future.",
  ],
} as const;

export const didYouKnow = {
  leadIn: "Did you know …",
  facts: [
    'Hephaestus is pronounced "Efestos".',
    "When Hera cast the infant Hephaestus from Olympus, myth says he fell on Lemnos, where the island\u2019s people helped raise the god who would become the master smith.",
    "Lemnos, situated in Greece, a magnificent place yet undiscovered wonder of the world...",
    "Lemnos was believed to be one of Hephaestus\u2019 favourite places, and ancient stories connected the island with his forge.",
    "Hephaestus was probably there around 2,000 BC, or maybe earlier, around 10,000 BC when the first inhabitants were there.",
    "One myth says Hephaestus created a magical golden chair that trapped Hera until Dionysus brought him back to Olympus.",
    "Hephaestus forged Zeus\u2019s thunderbolts, Athena\u2019s aegis, and Hermes\u2019s winged sandals. In myth, the whole pantheon ran on his engineering.",
    "Greek myth imagined Hephaestus building self-moving golden tripods, almost like ancient robot servants for the gods.",
    "Hephaestus was said to have golden assistants with intelligence, speech, and strength, a very old mythological image of artificial helpers.",
    "Talos is the first trace of artificial intelligence created by Hephaestus.",
    'The famous "Pandora\'s Box" saying comes from Greek mythology, where Hephaestus created Pandora with the jar containing all manner of mystery and evil.',
    "Hephaestus once made an almost invisible bronze net to trap Ares and Aphrodite, proving that even on Olympus, the best revenge was engineering.",
  ],
  closing: "Ready to hear the story?",
} as const;

export const positioning = {
  title: "Hephaestus International",
  paragraphs: [
    "Where ancient history meets modern innovation.",
    "Where craft becomes code, curiosity becomes capability, and intention becomes infrastructure.",
    "We don\u2019t shape minds to fit the frame\u2026",
    "We teach them to redraw it.",
  ],
} as const;

export const pillars = {
  title: "How we built the future…",
  items: [
    {
      number: "1",
      title: "What We Do",
      paragraphs: [
        "Build at the intersection of making, learning, and intelligence. Educate, launch ventures. Cultivate jobs of the future.",
      ],
    },
    {
      number: "2",
      title: "How We Do It",
      paragraphs: [
        "Revitalize trade school models for today. Inspire curiosity, creativity, STEM. Foster innovation and problem-solving.",
      ],
    },
    {
      number: "3",
      title: "Why It Matters",
      paragraphs: [
        "Empower learners to make a meaningful impact. Give learners the wings to build, create, and lead. Provide transformative experiences and global perspective.",
      ],
    },
  ],
} as const;

export const roots = {
  lines: [
    "Everything starts somewhere.",
    "Every tradition has roots.",
    "Every great endeavor is shaped by intention.",
    "Ours is too.",
  ],
} as const;

export const mappingLegacy = {
  title: "Mapping the Legacy",
} as const;

export const lemnos = {
  title: "Where Legacy Becomes Innovation",
  paragraphs: [
    "Each journey has a story. Ours bears a legacy…",
    "Long before innovation became a buzzword, it had a place.",
    "An island where creation was not only imagined but forged.",
    "Not theorized. Not abstracted.",
    "Made.",
    "That place was Lemnos.",
    "A cornerstone of craftsmanship, where materials, ideas, and techniques converged, traveled, and evolved.",
    "In ancient history… it was the forge of Hephaestus.",
    "In practice… it was a place where making shaped progress.",
    "For us, is the place where knowledge becomes form, where ideas leave the mind and enter the world…",
    "Our forge.",
    "Our workshop.",
    "Our first lab.",
  ],
} as const;

export const nameBridge = {
  lines: [
    "Before a name exists, the work must speak.",
    "Before a legacy can be claimed, it must be earned.",
    "And so, a name is born...",
  ],
} as const;

export const nameOrigins = {
  title: "The origins of the Name",
  footer:
    "At Hephaestus International, where the wisdom of the past meets the forge of the present.",
  leftBlocks: [
    [
      "We did not borrow it.",
      "We reclaimed it.",
      "We returned to the spark that started it all.",
    ],
    [
      "Hephaestus International was never named at random.",
      "Our mission was never stitched together from trends.",
    ],
    [
      "In the distant past, Hephaestus was the maker.",
      "The builder.",
      "The Greek architect of tools and systems that turned raw material into possibility.",
    ],
  ],
  rightBlocks: [
    [
      "We closed a chapter of what had been.",
      "We opened a path toward what could be.",
    ],
    [
      "What we are building comes from the way humanity has always advanced:",
      "by making,",
      "by learning through doing,",
      "and by questioning what exists.",
    ],
    [
      "At heart, he represents something timeless:",
      "the force that brings craft, knowledge, and creation into one place…",
    ],
  ],
} as const;

export const engineBridge = {
  lines: [
    "We've got the place.",
    "We've got the force.",
    "But tools without knowledge are a journey without a destination…",
  ],
} as const;

export const learningEngine = {
  title: "The Learning Engine",
  paragraphs: [
    "Across history, humanity's greatest advances have emerged where making meets learning.",
    "Alexandria… became the epicenter of that convergence, not simply a place of knowledge, but a system for it.",
    "A place where ideas were collected, tested, shared, and expanded.",
    "Where learning was not preserved for its own sake, but applied, challenged, and advanced.",
    "A system designed to unite people through understanding.",
    "But with very system comes a center…",
    "For Alexandria, that center was (Insert the link*).",
    "Not just a name in history, but a symbol in motion.",
    "A gatekeeper of access, a translator of knowledge, proof that learning only transforms when it is shared, lived, and experienced.",
    "Today, that spirit drives us. Here…",
    "We've created a living system that keeps our ecosystem in motion.",
    "Where exploration sparks practice, ideas evolve through experience, and understanding compounds through use, uniting people in a shared dance of learning.",
  ],
  hypatiaHref: "https://www.facebook.com/reel/860185246978132",
} as const;

export const formBridge = {
  lines: ["Most stories are told…", "Ours is written and takes a form…"],
} as const;

export const ecosystem = {
  title: "Where Intelligence Takes Form",
  subtitle:
    "The blueprint where learning, making, and innovation collide.",
  items: [
    {
      id: "flobrain",
      title: "FloBrain is Our Alexandria: Where knowledge is gathered, synthesized, and shared.",
      paragraphs: [
        "A unified AI middleware layer designed as a form of streaming intelligence. A single, persistent platform linking AI models, tools, data, and devices across web, mobile, wearables, and robotics.",
        "An always-on, adaptive intelligence layer that can not only power the ecosystem but also be deployed standalone, maintaining context, orchestrating actions, and connecting every piece of it.",
        'The hub where ideas become insight. Our "digital cord" tying all intelligence together.',
      ],
    },
    {
      id: "caipo",
      title: "CAIPO is Our Craftsmanship: The power of Hephaestus made real.",
      paragraphs: [
        "The Chief AI Productivity Officer.",
        "A personal voice assistant that transcribes meetings, translates 110+ languages in real time, and learns to know individuals, helping them live long and prosper.",
        "A wearable embodiment that turns thought into action.",
      ],
    },
    {
      id: "robocollective",
      title: "RoboCollective is Our Playground: Bringing History to Life",
      paragraphs: [
        "Just as Hephaestus created Talos and Pandora, displaying innovation and ingenuity in Lemnos, we bring that spirit into the modern era.",
        "Through RoboShows, public performances of robots and embodied AI, we showcase our creations in ways that inspire, entertain, and educate.",
        "We combine entertainment with learning, sparking curiosity, promoting STEM careers, and connecting communities to the future of technology.",
        "We don't just tell stories, we bring them to life. By connecting creativity, technology, and community, we transform ancient history into experiences you can see, touch, and feel.",
      ],
    },
  ],
} as const;

export const sharedPurpose = {
  kicker: "Our shared purpose",
  headline: ["Talent is everywhere.", "Opportunity should be too."],
  mission: {
    label: "Mission",
    lines: [
      "Aspire to inspire",
      "Help as many people as possible.",
      "Live long and prosper.",
    ],
    body: "At FloStudios, we bring this purpose to life through design, storytelling, and creative projects that help people learn, build, and turn ideas into useful experiences.",
  },
  vision: {
    label: "Vision",
    body: "A world where talent everywhere has access to experiential learning, frontier technologies, and meaningful opportunities to solve humanity\u2019s greatest challenges and build a healthier, longer, and more prosperous future",
  },
  teams:
    "Our teams build together across disciplines, developing their craft through work with a purpose.",
  learningLabel: "Explore learning opportunities",
  learningHref: "/internships",
} as const;

export const closingCta = {
  lead:
    "You've seen the forge. You've seen the library. You've seen the intelligence, the tools, the craft.",
  prompt: "Now the choice is yours:",
  questions: [
    "Do you want to step into the making?",
    "Do you want to turn curiosity into capability?",
    "Do you want to be a part of our story?",
  ],
  headline: "Join us.",
  tagline: "Be at the Center of the Future.",
  primaryHref: "/internships",
  primaryLabel: "Join us",
} as const;

export const seo = {
  defaultTitle: "Hephaestus International | Center of Excellence and Ethics",
  defaultDescription:
    "From Origins to the Architecture of Intelligence. Be at the Center of the Future.",
} as const;

/** About page copy: approved homepage themes plus experiential learning pathway context. */
export const aboutPage = {
  title: "About us",
  description:
    "Hephaestus International is the experiential learning and talent pathway within FloLabs Innovations Group. Hands-on AI and robotics on Lemnos, Greece, with global remote options.",
  heading: "About us",
  intro:
    "Hephaestus International is the experiential learning and talent pathway within FloLabs Innovations Group. We offer hands-on internships in AI and robotics on real marketable projects, on-site on Lemnos, Greece, or remotely worldwide.",
  floLabs: {
    title: "Part of FloLabs Innovations Group",
    paragraphs: [
      "Hephaestus International is the experiential learning and talent acquisition pathway within FloLabs Innovations Group.",
      "From classrooms to clinics to orbit, FloLabs pioneers AI and robotics across education, healthcare, travel, and space. Hephaestus is where that work becomes hands-on: learners join real projects, grow through making, and move toward roles that matter.",
    ],
    href: "https://www.flolabsinnovations.com/",
    label: "Visit FloLabs Innovations Group",
  },
  pathway: {
    title: "Learn, build, earn",
    intro:
      "Our internship starts with learning. As you reach the agreed level of skill, time, and contribution on a project, you can move into earning within the program.",
    steps: [
      {
        title: "Learn",
        body: "Start with structured, hands-on training on real AI and robotics projects. Revitalize trade school models for today: curiosity, STEM, innovation, and problem-solving through doing.",
      },
      {
        title: "Build",
        body: "Work alongside researchers, engineers, and founders across the FloLabs ecosystem. Contribute to marketable work in humanoid robotics, wearables, EdTech, and more.",
      },
      {
        title: "Earn",
        body: "Once you meet the agreed milestones, transition from learning into paid roles. Structured pathways connect education to professional work, including paid internships in AI and robotics.",
      },
    ],
  },
  whereWeWork: {
    title: "Lemnos and beyond",
    paragraphs: [
      "Our forge. Our workshop. Our first lab is on Lemnos, Greece, where ancient craftsmanship meets modern innovation.",
      "Programs are available on-site or remotely, connected through a global team. For robotics-based projects, on-site work on Lemnos can make hands-on testing and iteration easier, but many roles can be done from anywhere.",
    ],
  },
  whoItsFor: {
    title: "Who it's for",
    items: [
      {
        title: "Students",
        body: "High school, college, and university learners ready for hands-on work in AI and robotics, not just classroom theory.",
      },
      {
        title: "Career changers",
        body: "People bringing new perspective and discipline to technology, looking for experiential pathways into jobs of the future.",
      },
      {
        title: "AI and robotics enthusiasts",
        body: "Builders, makers, and curious minds who want to learn by working on real projects with a team at the forefront of innovation.",
      },
    ],
  },
  missionTitle: "Our mission",
  mission:
    "Inspire and empower individuals through transformative educational experiences that foster global perspectives, innovative thinking, and practical skills. We cultivate curiosity and creativity, create jobs of the future, and build innovative solutions for a rapidly changing world.",
  teamTitle: "Our team",
  teamBody:
    "Meet the Flo Team. Our team consists of passionate innovators, researchers, and industry experts dedicated to advancing AI and robotics technologies. Together, we are building the future through cutting-edge research, experiential learning, and collaborative innovation.",
  storyLinkLabel: "Explore our full story",
  storyLinkHref: "/#positioning",
  internshipsLabel: "View internships",
  internshipsHref: "/internships",
  projectsLabel: "Explore projects",
  projectsHref: "/projects",
  contactLabel: "Contact us",
  contactHref: "/contact",
} as const;

export const internshipsPage = {
  title: "Internships",
  heading: "Internship Positions",
  intro:
    "Join us and be at the Center of the Future. Explore experiential learning pathways with Hephaestus International.",
  ctaLabel: "View opportunities",
  note: "Subject Matter Accelerator Programs. Over 30 Unique Positions Available.",
} as const;

export type GalleryItemMedia =
  | {
      type: "image";
      src: string;
      width: number;
      height: number;
      alt: string;
    }
  | {
      type: "video";
      poster: string;
      posterWidth: number;
      posterHeight: number;
      alt: string;
    };

export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  href: string;
  media: GalleryItemMedia;
  /** Facebook or other iframe embed URL for inline playback on the gallery page. */
  embedSrc?: string;
  /** Overrides the default external link label when set. */
  linkLabel?: string;
};

/** Gallery tiles link to external pages for full stories, articles, or videos. */
export const galleryItems: readonly GalleryItem[] = [
  {
    id: "carl-sagan-cosmos-lost-history",
    title: 'Carl Sagan, Cosmos: "The Knowledge We Lost To History"',
    description:
      "Carl Sagan on Cosmos, shared by Saganism on Facebook. Play here or open the reel.",
    href: "https://www.facebook.com/share/v/1CfWSqLy2j/",
    embedSrc:
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F753412424454490&show_text=false&width=560&height=315",
    media: {
      type: "video",
      poster: withBasePath("/images/carl-sagan-cosmos-lost-history.webp"),
      posterWidth: 406,
      posterHeight: 720,
      alt: 'Carl Sagan Cosmos reel preview, "The Knowledge We Lost To History"',
    },
  },
  {
    id: "carl-sagan-death-of-hypatia",
    title: "Carl Sagan and the Death of Hypatia (Cosmos Audio)",
    description:
      "Carl Sagan on Hypatia from Cosmos, shared by Saganism on Facebook. Play here or open the reel.",
    href: "https://www.facebook.com/share/v/1HVpEuofjQ/",
    embedSrc:
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F860185246978132&show_text=false&width=560&height=315",
    media: {
      type: "video",
      poster: withBasePath("/images/carl-sagan-hypatia-cosmos.webp"),
      posterWidth: 1152,
      posterHeight: 2048,
      alt: "Carl Sagan on the death of Hypatia from Cosmos, reel preview",
    },
  },
  {
    id: "limnos-from-above",
    title: "Limnos from Above",
    description:
      "Sunset photography from Limnos from Above. See the full post for more.",
    href: "https://www.facebook.com/groups/236778251861578/permalink/1194551059417621/",
    media: {
      type: "image",
      src: withBasePath("/images/limnos-from-above-gallery.webp"),
      width: 1024,
      height: 575,
      alt: "Sunset over Mount Athos and the sea, Limnos from Above photography",
    },
  },
  {
    id: "limnos-from-above-sea-stacks",
    title: "Limnos from Above: Sea Stacks at Sunset",
    description:
      "Sunset between sea stacks on Limnos. See the full post for more.",
    href: "https://www.facebook.com/groups/236778251861578/permalink/1179467540925973",
    media: {
      type: "image",
      src: withBasePath("/images/limnos-from-above-sea-stacks.webp"),
      width: 1024,
      height: 575,
      alt: "Sunset between sea stacks on Limnos, Limnos from Above photography",
    },
  },
  {
    id: "limnos-hephaistia-theatre-360",
    title: "Limnos from Above: Ancient Theatre of Hephaistia (360°)",
    description:
      "360° photograph of the Ancient Theatre of Hephaistia on Limnos. See the full post for more.",
    href: "https://www.facebook.com/groups/236778251861578/permalink/1161231762749551/",
    media: {
      type: "image",
      src: withBasePath("/images/limnos-hephaistia-theatre-360.webp"),
      width: 600,
      height: 600,
      alt: "360° view of the Ancient Theatre of Hephaistia on Limnos, Limnos from Above photography",
    },
  },
  {
    id: "ancient-hephaestia-archaeological-site",
    title: "Archeological Site Ancient Hephaestia",
    description:
      "The ancient city and sanctuary of Hephaestus on Lemnos. View the archaeological site on Google Maps.",
    href: "https://maps.app.goo.gl/9kU3UNfSLE496oqTA",
    linkLabel: "View on Google Maps",
    media: {
      type: "image",
      src: withBasePath("/images/limnos-hephaistia-theatre-360.webp"),
      width: 600,
      height: 600,
      alt: "Ancient Theatre of Hephaistia at the archaeological site of Ancient Hephaestia on Lemnos",
    },
  },
  {
    id: "john-hazlewood-five-years-later",
    title: "St. John's Beach",
    description:
      "St John's Beach: an upside down hearti where our lab is located behind the tree.",
    href: "https://www.facebook.com/photo/?fbid=10234695140573798&set=pb.1057247183.-2207520000",
    media: {
      type: "image",
      src: withBasePath("/images/john-hazlewood-five-years-later.webp"),
      width: 2304,
      height: 1040,
      alt: "Coastal bay at sunset with boats, from John Andrew Hazlewood's 5 Years Later Facebook photo",
    },
  },
  {
    id: "limnos-from-above-video",
    title: "Limnos from Above (Η Λήμνος από ψηλά)",
    description:
      "Aerial views of Limnos by Dimitris Eleftherakis on Facebook. Play here or open the reel.",
    href: "https://www.facebook.com/share/v/18xaGEJKNA/",
    embedSrc:
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F795948636178330&show_text=false&width=560&height=315",
    media: {
      type: "video",
      poster: withBasePath("/images/limnos-from-above-reel.webp"),
      posterWidth: 1280,
      posterHeight: 720,
      alt: "Aerial reel preview from Limnos from Above by Dimitris Eleftherakis",
    },
  },
  {
    id: "talos-minoan-greek-reporter",
    title: "Was Talos, the Protector of Ancient Crete, Actually a Minoan?",
    description:
      "GreekReporter on Talos, the bronze automaton created by Hephaestus, and links to Minoan Crete.",
    href: "https://greekreporter.com/2026/02/17/talos-protector-ancient-crete-minoan/",
    media: {
      type: "image",
      src: withBasePath("/images/talos-greek-reporter.webp"),
      width: 1020,
      height: 912,
      alt: "Talos, a giant bronze automaton described as a creation of Hephaestus in Greek mythology",
    },
  },
  {
    id: "hypatia-greek-reporter",
    title: "Hypatia: The Female Greek Philosopher Killed for Her Beliefs",
    description:
      "GreekReporter on Hypatia, the Alexandrian philosopher, astronomer, and mathematician.",
    href: "https://greekreporter.com/2026/03/02/hypatia-greek-philosopher/",
    media: {
      type: "image",
      src: withBasePath("/images/hypatia-greek-reporter.webp"),
      width: 700,
      height: 335,
      alt: "Death of the Greek philosopher Hypatia in Alexandria, unknown artist, public domain",
    },
  },
  {
    id: "paleothea-hephaestus-lemnos",
    title: "Hephaestus and Lemnos",
    description:
      "Paleothea on Hephaestus's forge on Lemnos, the island's mythic history, and his legendary creations.",
    href: "https://paleothea.com/gods-and-goddesses/hephaestus-and-lemnos/",
    media: {
      type: "image",
      src: withBasePath("/images/paleothea-hephaestus-lemnos.webp"),
      width: 1200,
      height: 686,
      alt: "Hephaestus and Lemnos, featured image from Paleothea",
    },
  },
  {
    id: "connecting-the-dots",
    title: "Connecting the Dots",
    description:
      "FloLabs conversations on AI, robotics, entrepreneurship, and education.",
    href: "https://www.youtube.com/@flolabsinnovation",
    media: {
      type: "video",
      poster: withBasePath("/images/pillars-background.webp"),
      posterWidth: 1024,
      posterHeight: 682,
      alt: "Connecting the Dots video series preview",
    },
  },
  {
    id: "flolabs-linkedin",
    title: "FloLabs Innovation on LinkedIn",
    description: "Updates, breakthroughs, and emerging tech from the FloLabs ecosystem.",
    href: "https://www.linkedin.com/company/flolabs-innovation/",
    media: {
      type: "image",
      src: withBasePath("/images/positioning.webp"),
      width: 800,
      height: 1200,
      alt: "FloLabs Innovation on LinkedIn",
    },
  },
] as const;

export const galleryPage = {
  title: "Gallery",
  heading: "Gallery",
  empty: "New gallery items will appear here soon.",
  externalLinkLabel: "Learn more",
  watchExternalLabel: "Watch on Facebook",
  viewFullImageLabel: "View full image",
  playVideoLabel: "Play video",
  closeViewerLabel: "Close",
} as const;

export const contactPage = {
  title: "Contact Us",
  heading: "Contact Us",
  intro: "Have questions? We'd love to hear from you.",
  formTitle: "Send Us a Message",
  otherTitle: "Other Ways to Reach Us",
} as const;

/**
 * Initiative names and external URLs.
 * storytellingId: approved Version 3 PDF copy (ecosystem.items).
 * tileIntro: short card teaser only (detail pages use paragraphs / storytellingId).
 * paragraphs / focusPoints: project-specific copy on the catalog entry.
 */
/** Alphabetical by title. Display order is also enforced in getProjectsCatalogSorted(). */
export const projectsCatalog = [
  {
    id: "athletic-performance-intelligence",
    title: "Athletic Performance Intelligence",
    href: "https://www.athleticperformanceintelligence.com/",
    tileIntro:
      "Performance data lives everywhere except together. Unify mental, physical, and behavioral signals into one FloBrain-powered view.",
    paragraphs: [
      "Performance data lives everywhere except together. Unify mental, physical, and behavioral signals into one FloBrain-powered view.",
    ],
  },
  {
    id: "caipo",
    title: "CAIPO",
    href: "https://www.caipo.ai/",
    storytellingId: "caipo",
    tileIntro:
      "A wearable AI system focused on capturing moments, organizing notes, and improving productivity workflows.",
    focusPoints: [
      "Design excellence and practical UX/UI",
      "AI-enabled productivity gains for teams and individuals",
      "Entrepreneurial execution in emerging AI products",
    ],
  },
  {
    id: "connecting-the-dots",
    title: "Connecting The Dots",
    href: "https://www.youtube.com/@flolabsinnovation",
    tileIntro:
      "A cross-disciplinary initiative connecting ideas, teams, and execution into clearer and more actionable outcomes.",
    paragraphs: [
      "Developing connected content and systems that align design, technology, and business workstreams into cohesive project outcomes.",
    ],
  },
  {
    id: "cosmos-intelligence",
    title: "Cosmos Intelligence",
    href: "https://cosmosintelligence.org/",
    tileIntro:
      "An open research and product initiative using AI to study cosmic-scale structure, signals, and information patterns across public space data.",
    paragraphs: [
      "An open research and product initiative using AI to study cosmic-scale structure, signals, and information patterns across public space data.",
    ],
  },
  {
    id: "flobrain",
    title: "FloBrain",
    href: "https://www.flobrain.ai/",
    storytellingId: "flobrain",
    tileIntro:
      "An AI-native initiative focused on knowledge workflows, intelligent assistants, and practical team productivity systems.",
  },
  {
    id: "flolabs-innovations",
    title: "FloLabs Innovations Group",
    href: "https://www.flolabsinnovations.com/",
    tileIntro:
      "A global platform showcasing FloLabs initiatives, partnerships, and AI/technology innovation.",
    paragraphs: [
      "Redesigning the platform to better highlight mission, active projects, and collaboration opportunities.",
    ],
  },
  {
    id: "flolabs-international",
    title: "FloLabs International",
    href: "https://www.flolabs.international/",
    tileIntro:
      "A global hub highlighting FloLabs' mission, projects, and collaboration opportunities.",
    paragraphs: [
      "Redesigning the website to better highlight FloLabs' mission, ongoing projects, and opportunities for collaboration and internships.",
    ],
  },
  {
    id: "flostudios",
    title: "FloStudios",
    href: "https://www.flostudios.ai/",
    tileIntro:
      "A creative hub for UX/UI, multimedia, and marketing teams building next-generation internal projects and digital experiences.",
    paragraphs: [
      "Our first production is a film project inspired by the mythological roots of Lemnos, Greece, blending ancient tales with the future of AI and robotics. The story highlights Hephaestus, the legendary blacksmith who built the first robot, Talos, and AI Pandora on the island of Lemnos, where we are launching one of our labs and future campus. This project, along with others, offers an incredible opportunity to contribute to something meaningful while honing your skills.",
    ],
    focusPoints: [
      "Design excellence across digital products",
      "Multimedia innovation with AI-first tooling",
      "Startup experimentation in creative production",
    ],
  },
  {
    id: "flotravel",
    title: "FloTravel",
    href: "https://www.flomadtravel.com/",
    tileIntro:
      "AI-powered travel planning for flights, hotels, reservations, and activities in one connected experience.",
    paragraphs: [
      "AI is taking over in the market for travel. Flo Travel is using AI to help clients plan their trips accordingly. Plan your flight, hotel, trip, activites, etc. all in one place.",
    ],
  },
  {
    id: "hephaestus-international",
    title: "Hephaestus International",
    href: "https://hephaestus.international/",
    tileIntro:
      "An experiential learning institute focused on innovation, education, and advanced technology development.",
    paragraphs: [
      "Hephaestus Labs Institute of Experiential Learning Center of Excellence",
    ],
  },
  {
    id: "innovation-bootcamp-university",
    title: "Innovation Bootcamp University",
    href: "https://www.bootcampuniversity.org/",
    tileIntro:
      "A cooperative education initiative that helps learners move from foundational training to paid, real-world tech project experience.",
    paragraphs: [
      "A cooperative education initiative that helps learners move from foundational training to paid, real-world tech project experience.",
    ],
  },
  {
    id: "legal-ethics",
    title: "Legal & Ethics Ventures Institute",
    href: "https://www.legalethicsventuresinstitute.com/",
    tileIntro:
      "A remote-first, hands-on institute for legal, ethics, and AI venture projects with real-world execution.",
    paragraphs: [
      "Expanding hands-on legal and ethics initiatives that help students and career changers build real-world experience through applied projects and venture-style collaboration.",
    ],
  },
  {
    id: "moodchanger",
    title: "MoodChanger",
    href: "https://www.moodchanger.ai/",
    tileIntro:
      "An AI-powered platform designed to enhance emotional well-being with personalized insights and practical guidance.",
    paragraphs: [
      "Expanding MoodChanger's functionality by integrating interactive AI tools, refining algorithms for better personalization, and designing a user-friendly interface to make emotional health accessible to everyone.",
    ],
    focusPoints: [
      "Design excellence and intuitive UX/UI",
      "AI connectivity across multiple innovations",
      "Startup-style innovation and creator enablement",
    ],
  },
  {
    id: "moodchanger-pets",
    title: "MoodChanger for Pets",
    href: "https://moodchanger.ai/pets",
    tileIntro:
      "An AI-driven pet wellness platform combining wearables, environment data, and behavior insights.",
    paragraphs: [
      "Developing a seamless platform that integrates with pet wearables, creating AI models for real-time analysis, and designing engaging tools for pet owners to monitor and enhance their pets' quality of life.",
    ],
  },
  {
    id: "robocollective",
    title: "RoboCollective",
    href: "https://robocollective.ai/",
    storytellingId: "robocollective",
    tileIntro:
      "A major initiative focused on intelligent systems, human-robot interaction, and robotics commercialization through RoboCollective.",
  },
  {
    id: "space-ventures",
    title: "Space Ventures Institute",
    href: "https://www.spaceventuresinstitute.com/",
    tileIntro:
      "A remote-first experiential venture institute connecting talent to real space economy projects.",
    paragraphs: [
      "Building project streams across CAIPO Space Buddy, MoodChanger for space, space travel initiatives, and robotics-focused product development.",
    ],
  },
  {
    id: "tarrl",
    title: "TARRL",
    href: "https://www.tarrl.org/",
    tileIntro:
      "The official portal for FloLabs' Texas Advanced Robotics Research Lab (TARRL).",
    paragraphs: [
      "Redesigning the site to reflect ongoing changes at FloLabs.",
    ],
  },
] as const;

export const projectsPage = {
  title: "Our Projects",
  heading: "Our Projects",
  intro:
    "Explore the innovative AI, robotics, education, and media initiatives being built across the Hephaestus and FloLabs ecosystem.",
  viewDetailsLabel: "View details",
  backToProjectsLabel: "All projects",
  externalSiteLabel: "Visit site",
  focusPointsTitle: "Focus points:",
  noApprovedCopyNote:
    "Approved presentation copy is not available for this initiative. Use the project site link below when provided.",
} as const;
