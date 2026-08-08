/** @migration-reference Phase 2 — runtime reads DB repositories; this file remains seed/reference source. */
/**
 * Detail-page narrative for published Solutions.
 * Catalogue metadata lives in data/solutions.ts.
 */

export type ContrastColumn = {
  title: string;
  description: string;
  areas?: string[];
};

export type DecisionLevel = {
  title: string;
  description: string;
  items: string[];
};

export type VisibilityStage = {
  title: string;
  description: string;
  examples?: string[];
};

/** Leads / conversion solution narrative */
export type LeadsSolutionPageContent = {
  kind: "leads";
  slug: string;
  trafficVsLeads: {
    intro: string;
    traffic: ContrastColumn;
    conversion: ContrastColumn;
  };
  causesIntro: string;
  valuePropositionNote: string;
  intentNote: string;
  nextStepNote: string;
  trustNote: string;
  formFrictionNote: string;
  mobileNote: string;
  performanceNote: string;
  measurementIntro: string;
  redesignIntro: string;
  redesignLevels: DecisionLevel[];
  diagnoseNote: string;
  reviewVsAudit: {
    review: { title: string; description: string };
    audit: { title: string; description: string };
  };
};

/** Search visibility / ranking solution narrative */
export type RankingSolutionPageContent = {
  kind: "ranking";
  slug: string;
  onlineVsDiscoverable: {
    intro: string;
    exists: ContrastColumn;
    searchReady: ContrastColumn;
  };
  visibilityModelIntro: string;
  visibilityStages: VisibilityStage[];
  causesIntro: string;
  keywordsMyth: { title: string; body: string };
  crawlIndex: {
    title: string;
    intro: string;
    issues: string[];
  };
  indexedNotCompetitive: {
    title: string;
    body: string;
    points: string[];
  };
  searchIntent: {
    title: string;
    body: string;
    examples: { query: string; mismatch: string }[];
  };
  architecture: { title: string; body: string; points: string[] };
  contentQuality: { title: string; body: string; weaknesses: string[] };
  onPage: { title: string; body: string; signals: string[] };
  performance: { title: string; body: string };
  localSearch: { title: string; body: string; considerations: string[] };
  siteWideVsPage: {
    intro: string;
    siteWide: ContrastColumn;
    pageSpecific: ContrastColumn;
  };
  newWebsite: { title: string; body: string; stillNeeds: string[] };
  rankingDrop: { title: string; body: string; areas: string[] };
  searchConsoleNote: string;
  diagnoseNote: string;
  rebuildIntro: string;
  rebuildLevels: DecisionLevel[];
  seoAuditVsWebsiteAudit: {
    seoAudit: { title: string; description: string };
    websiteAudit: { title: string; description: string };
  };
  freeReviewPrompt: string;
  relatedWorkHeading: string;
};

export const websiteNotGeneratingLeadsPage: LeadsSolutionPageContent = {
  kind: "leads",
  slug: "website-not-generating-leads",
  trafficVsLeads: {
    intro:
      "If almost nobody reaches the website, the issue may primarily involve visibility or acquisition. If people are already reaching the website but few take action, something inside the experience may be preventing conversion. Often both problems exist at once.",
    traffic: {
      title: "Traffic problem",
      description:
        "People are not finding or reaching the website in meaningful numbers.",
      areas: [
        "SEO",
        "Local visibility",
        "Campaign targeting",
        "Content reach",
      ],
    },
    conversion: {
      title: "Conversion problem",
      description:
        "People arrive but do not take meaningful action — enquire, call, book, request a quote or buy.",
      areas: [
        "Messaging",
        "UX",
        "Trust",
        "CTA",
        "Forms",
        "Performance",
        "Page structure",
      ],
    },
  },
  causesIntro:
    "When visitors reach the site but enquiries stay low, the friction usually sits in how the offer is explained, how the journey is structured, or how easy it is to act.",
  valuePropositionNote:
    "A visitor should quickly understand what the business offers, who it is for, why it matters, and what to do next. If those answers take too much work to find, many people leave before they become a lead.",
  intentNote:
    "Visitors may arrive looking for a specific service, pricing context, a comparison, or local availability — then land on a page that does not answer that need. When the page and the intent do not match, conversion drops even if the design looks polished.",
  nextStepNote:
    "Pages often fail because visitors cannot easily determine the next action. Depending on the business, that may be requesting a quote, booking a consultation, checking availability, buying a product, calling, or submitting an enquiry. The primary action should be obvious for that page — not every page needs the same CTA.",
  trustNote:
    "People rarely enquire when they are still unsure whether the business is credible. Useful trust signals include real project examples, testimonials, clear business information, professional design, useful service detail and a transparent process — where those things are genuine. Fake badges, inventing reviews or manufacturing urgency does not help.",
  formFrictionNote:
    "Forms can create unnecessary friction when there are too many fields, unclear questions, awkward mobile layouts, no explanation of what happens after submission, technical failures, or weak CTA wording. Useful qualification fields still matter — the goal is the right balance, not removing every question.",
  mobileNote:
    "Lead generation often suffers on mobile when navigation is awkward, text is hard to scan, CTAs disappear, forms are uncomfortable, pages load poorly, or layouts break. Many visitors will only ever see the mobile experience.",
  performanceNote:
    "Slow pages create additional friction, especially for mobile visitors. Speed is rarely the only cause of low leads, but it can make every other issue worse.",
  measurementIntro:
    "If you cannot see whether visitors click important CTAs, start forms, submit forms, use phone or email links, reach booking or product pages, or complete key actions, it is hard to know where the journey breaks. Measurement does not fix conversion on its own — it shows where to look.",
  redesignIntro:
    "Low enquiries do not automatically mean the whole website needs rebuilding. The right response depends on how widespread the friction is.",
  redesignLevels: [
    {
      title: "Small improvements",
      description:
        "Targeted changes when the site is mostly sound but specific friction is clear.",
      items: ["CTA", "Copy", "Forms", "Navigation", "Page hierarchy"],
    },
    {
      title: "Targeted page work",
      description:
        "Focused redesign of the journeys that matter most for enquiries or sales.",
      items: [
        "Landing pages",
        "Service pages",
        "Checkout",
        "Booking journeys",
      ],
    },
    {
      title: "Larger redesign",
      description:
        "When structure, branding, UX, performance and technical foundations have broader problems across the site.",
      items: [
        "Information architecture",
        "Design system",
        "Development foundations",
        "SEO-aware rebuild planning",
      ],
    },
  ],
  diagnoseNote:
    "Low leads may involve conversion work, design, copy, development, performance, SEO, analytics — or a combination. Smartlance diagnoses the problem before prescribing a service. A redesign is one possible answer, not the default.",
  reviewVsAudit: {
    review: {
      title: "Free Website Review",
      description:
        "Useful when you want an initial outside perspective and are not yet sure where the problem lies. A practical starting conversation with focused observations — not a full consulting engagement.",
    },
    audit: {
      title: "Full Website Audit",
      description:
        "A more detailed professional evaluation across UX, SEO, performance, content and conversion, with prioritized recommendations for what to fix first.",
    },
  },
};

export const websiteNotRankingPage: RankingSolutionPageContent = {
  kind: "ranking",
  slug: "website-not-ranking",
  onlineVsDiscoverable: {
    intro:
      "Publishing a website does not automatically mean search engines will understand when and where it should appear. Being online and being discoverable for the searches that matter are different problems.",
    exists: {
      title: "Website exists",
      description: "Pages are publicly accessible on the internet.",
      areas: ["Live URLs", "Public pages", "A working homepage"],
    },
    searchReady: {
      title: "Website is search-ready",
      description:
        "Search engines can discover, crawl, understand, index, evaluate and match the content to relevant searches.",
      areas: [
        "Discover",
        "Crawl",
        "Understand",
        "Index",
        "Evaluate",
        "Match",
      ],
    },
  },
  visibilityModelIntro:
    "Search visibility usually fails somewhere along this path — not because of one missing keyword.",
  visibilityStages: [
    {
      title: "Discovery",
      description: "Can search engines find the page?",
      examples: ["Internal links", "Sitemap", "Site architecture"],
    },
    {
      title: "Crawling",
      description: "Can they access the important content?",
      examples: ["Robots directives", "Broken links", "Technical barriers"],
    },
    {
      title: "Indexing",
      description:
        "Has the page been included in the search index? Crawlable does not always mean indexed.",
    },
    {
      title: "Understanding",
      description:
        "Can search engines tell what the page is about, what the business offers, and how pages relate?",
    },
    {
      title: "Relevance",
      description:
        "Does the page answer the kind of query the business wants to rank for?",
    },
    {
      title: "Competitiveness",
      description:
        "Is the page and site strong enough relative to other useful results — without reducing SEO to a single score?",
    },
  ],
  causesIntro:
    "Weak rankings rarely come from one missing keyword. These are common areas worth investigating when organic visibility stays low.",
  keywordsMyth: {
    title: "Ranking Problems Usually Aren’t Fixed by Adding More Keywords.",
    body: "Keywords without useful content, clear structure, technical accessibility, intent alignment, internal linking and credible signals do not solve the underlying problem. Stuffing terms onto thin pages often adds noise rather than visibility.",
  },
  crawlIndex: {
    title: "First: Can Search Engines Access the Right Pages?",
    intro:
      "Before debating content quality, it helps to confirm search engines can reach and evaluate the pages that matter. Issues we may investigate include:",
    issues: [
      "Incorrect robots directives",
      "Accidental noindex",
      "Broken internal links",
      "Redirect problems",
      "Canonical problems",
      "Orphaned pages",
      "Malformed sitemap",
      "Duplicate or near-duplicate pages",
    ],
  },
  indexedNotCompetitive: {
    title: "Indexed Doesn’t Mean Competitive.",
    body: "A page appearing in Google’s index simply means it can potentially be shown. It does not mean the page is ready to compete for valuable searches.",
    points: [
      "Matches valuable search intent",
      "Is sufficiently useful",
      "Is well structured",
      "Has appropriate internal context",
      "Is competitive enough against other results",
    ],
  },
  searchIntent: {
    title: "Are Your Pages Built Around What People Are Actually Looking For?",
    body: "Search visibility suffers when the page and the searcher’s need do not match — even if the site looks professional.",
    examples: [
      {
        query: "commercial property management Lagos",
        mismatch:
          "Landing on a vague generic homepage that never explains the service clearly.",
      },
      {
        query: "WordPress website redesign",
        mismatch:
          "A site with no focused redesign page, only a broad “web design” mention.",
      },
    ],
  },
  architecture: {
    title: "Unclear Structure Confuses People and Search Engines",
    body: "Poor organization makes it harder for visitors to find services and harder for search engines to understand which pages matter.",
    points: [
      "Clear service hierarchy",
      "Logical categories",
      "Internal links between related pages",
      "Descriptive URLs",
      "Important pages not buried deeply",
      "Fewer competing pages about the same thing",
    ],
  },
  contentQuality: {
    title: "Content That Looks Complete Can Still Be Weak for Search",
    body: "Useful pages answer real questions. Thin, repetitive or keyword-led copy often fails even when word count looks fine.",
    weaknesses: [
      "Thin service descriptions",
      "Pages that say the same thing",
      "Content written around keywords rather than users",
      "Missing important questions",
      "Weak differentiation",
      "Outdated information",
      "Poorly structured headings",
    ],
  },
  onPage: {
    title: "On-Page Signals Should Make the Topic Obvious",
    body: "Titles, headings, URLs, internal links, image context, metadata and carefully used structured data help describe a page. Metadata can influence how a result is presented and clicked; ranking depends on broader factors than a meta description alone.",
    signals: [
      "Page title",
      "Main heading",
      "Subheadings",
      "URL",
      "Internal links",
      "Image context",
      "Metadata",
      "Structured data where appropriate",
    ],
  },
  performance: {
    title: "Technical Quality Supports Search — It Rarely Explains Everything",
    body: "Performance and page experience can contribute to overall quality and should be considered alongside content, structure and technical SEO. Speed, mobile usability, Core Web Vitals, rendering issues and broken functionality matter — but they are rarely the only reason a site fails to rank.",
  },
  localSearch: {
    title: "What If You Mostly Need Nearby Customers?",
    body: "Local businesses may face a different visibility problem than national or service brands targeting broader searches. Local relevance is worth reviewing when nearby customers are the priority.",
    considerations: [
      "Google Business Profile",
      "Location and service-area signals",
      "Consistent business details",
      "Location-relevant pages",
      "Reviews and reputation where genuine",
      "Local relevance on key pages",
    ],
  },
  siteWideVsPage: {
    intro:
      "Diagnostic scope changes depending on whether visibility is weak everywhere or only on specific pages.",
    siteWide: {
      title: "Site-wide",
      description: "Organic visibility is limited across most of the site.",
      areas: [
        "Very little organic visibility",
        "Many pages missing from the index",
        "Technical or architecture problems",
        "Major migration issues",
      ],
    },
    pageSpecific: {
      title: "Page-specific",
      description: "Some pages perform while others stay invisible.",
      areas: [
        "Homepage ranks but service pages do not",
        "Some services perform while others disappear",
        "Individual pages target weak or mismatched intent",
        "Internal linking or content issues on key URLs",
      ],
    },
  },
  newWebsite: {
    title: "Does a New Website Need Time to Rank?",
    body: "A newly launched website may take time to be discovered, indexed and evaluated. Time alone is not a strategy. The site still needs solid foundations and ongoing improvement — there is no fixed ranking calendar that applies to every business.",
    stillNeeds: [
      "Technical accessibility",
      "Useful pages",
      "Logical structure",
      "Search relevance",
      "Ongoing improvement",
    ],
  },
  rankingDrop: {
    title: "What If Rankings Used to Be Better?",
    body: "When visibility declines after previously stronger performance, investigation often focuses on what changed — without assuming a penalty unless there is evidence.",
    areas: [
      "Website migration",
      "URL changes",
      "Redirect mistakes",
      "Technical changes",
      "Content removal",
      "Indexing problems",
      "Competitive or search-result changes",
      "Site quality changes",
    ],
  },
  searchConsoleNote:
    "Access to Google Search Console can help investigate indexing, search queries, page visibility, crawl and index issues, and performance trends. It does not contain every ranking factor, but it is often useful context when reviewing search visibility.",
  diagnoseNote:
    "Weak rankings may involve technical SEO, on-page work, content, architecture, performance, local search, migration cleanup — or a combination. Smartlance reviews the visibility path before prescribing a package.",
  rebuildIntro:
    "Poor ranking does not automatically mean the whole website needs rebuilding. The right response depends on how technical, structural or content-related the issues are.",
  rebuildLevels: [
    {
      title: "SEO improvements",
      description:
        "The existing site is technically healthy, but pages and content need better search alignment.",
      items: [
        "On-page clarity",
        "Intent-led pages",
        "Internal linking",
        "Search-focused copy",
      ],
    },
    {
      title: "Technical / structural work",
      description:
        "Architecture, indexing, internal linking, speed or technical setup need improvement.",
      items: [
        "Crawl and index fixes",
        "Site architecture",
        "Performance",
        "Technical SEO",
      ],
    },
    {
      title: "Redesign / rebuild",
      description:
        "Broader site structure, technology, UX and search foundations are holding the business back.",
      items: [
        "Information architecture",
        "Platform or template limits",
        "UX and content systems",
        "SEO-aware rebuild planning",
      ],
    },
  ],
  seoAuditVsWebsiteAudit: {
    seoAudit: {
      title: "SEO Audit",
      description:
        "Focused specifically on organic search visibility — technical, on-page, indexing and search-intent issues.",
    },
    websiteAudit: {
      title: "Website Audit",
      description:
        "A broader review of UX, design, SEO, performance, content and conversion when the problem may span more than search.",
    },
  },
  freeReviewPrompt:
    "Not sure whether the issue is SEO, the website itself or both?",
  relatedWorkHeading: "Related Website & SEO Work",
};

/** Slow website / performance solution narrative */
export type PerformanceSolutionPageContent = {
  kind: "performance";
  slug: string;
  measuredVsPerceived: {
    intro: string;
    measured: ContrastColumn;
    perceived: ContrastColumn;
  };
  journeyIntro: string;
  journeyStages: VisibilityStage[];
  coreWebVitals: {
    intro: string;
    items: { abbr: string; name: string; description: string }[];
  };
  scoreClue: { title: string; body: string; factors: string[] };
  causesIntro: string;
  imagesNote: { title: string; body: string; points: string[] };
  javascriptNote: { title: string; body: string; examples: string[] };
  thirdPartyNote: { title: string; body: string; examples: string[] };
  hostingVsFrontend: {
    intro: string;
    hosting: ContrastColumn;
    frontend: ContrastColumn;
    closing: string;
  };
  mobileNote: { title: string; body: string; factors: string[] };
  layoutShift: { title: string; body: string; examples: string[] };
  interactionDelay: { title: string; body: string; examples: string[] };
  perceivedSpeed: { title: string; body: string; ideas: string[] };
  siteWideVsPage: {
    intro: string;
    siteWide: ContrastColumn;
    pageSpecific: ContrastColumn;
  };
  seoRelationship: { title: string; body: string };
  conversionRelationship: { title: string; body: string };
  diagnoseNote: string;
  diagnosticLayers: { title: string; description: string }[];
  rebuildIntro: string;
  rebuildLevels: DecisionLevel[];
  platformNote: { title: string; body: string; platforms: { name: string; note: string }[] };
  serviceDistinctions: {
    performance: { title: string; description: string };
    technicalSeo: { title: string; description: string };
    websiteAudit: { title: string; description: string };
  };
  freeReviewPrompt: string;
  relatedWorkHeading: string;
};

export const slowWebsitePage: PerformanceSolutionPageContent = {
  kind: "performance",
  slug: "slow-website",
  measuredVsPerceived: {
    intro:
      "Website performance has two dimensions. Tools can measure loading, rendering, interaction and layout stability — but visitors also notice blank waiting, delayed buttons and content that jumps while they try to use the page.",
    measured: {
      title: "Measured performance",
      description: "Things tools can detect across loading and interaction.",
      areas: ["Loading", "Rendering", "Interaction", "Layout stability"],
    },
    perceived: {
      title: "Perceived performance",
      description: "What the user actually experiences on the page.",
      areas: [
        "Blank waiting",
        "Slow visual response",
        "Jumping content",
        "Delayed buttons",
        "Heavy interactions",
      ],
    },
  },
  journeyIntro:
    "Most performance problems show up somewhere along this path — from the first request to the moment the page feels ready to use.",
  journeyStages: [
    {
      title: "Request",
      description: "The browser begins retrieving what the page needs.",
    },
    {
      title: "Load",
      description:
        "Images, CSS, fonts, JavaScript and third-party resources arrive.",
    },
    {
      title: "Render",
      description: "Useful content becomes visible.",
    },
    {
      title: "Stabilize",
      description: "The page stops unexpectedly moving around.",
    },
    {
      title: "Interact",
      description:
        "Buttons, forms, menus and other controls respond properly.",
    },
  ],
  coreWebVitals: {
    intro:
      "Core Web Vitals are a useful way to talk about whether a page appears, stays stable and responds. They are important clues — not the whole performance story.",
    items: [
      {
        abbr: "LCP",
        name: "Largest Contentful Paint",
        description: "How quickly the main visible content appears.",
      },
      {
        abbr: "INP",
        name: "Interaction to Next Paint",
        description:
          "How quickly the page responds when someone interacts.",
      },
      {
        abbr: "CLS",
        name: "Cumulative Layout Shift",
        description: "How stable the page remains while loading.",
      },
    ],
  },
  scoreClue: {
    title: "A Performance Score Is a Clue, Not the Website.",
    body: "Tools such as Lighthouse or PageSpeed can help identify issues, but a single score should not replace real-world testing. Chasing 100/100 is rarely the point.",
    factors: [
      "Actual device",
      "Connection",
      "Page type",
      "User interaction",
      "Third-party scripts",
      "Content complexity",
    ],
  },
  causesIntro:
    "A slow website is rarely caused by one missing setting. These are common areas worth investigating when pages feel heavy or unresponsive.",
  imagesNote: {
    title: "Large Images Are a Common Problem — but Not the Only One.",
    body: "Images often add unnecessary weight, but fixing images alone will not solve every performance issue.",
    points: [
      "Wrong dimensions",
      "Uncompressed assets",
      "Poor format choice",
      "Loading too many images immediately",
      "Hidden mobile or desktop duplicates",
    ],
  },
  javascriptNote: {
    title: "Too Much Code Can Delay the Moment the Site Feels Ready.",
    body: "Useful tools can still add frontend work. The goal is to load what is actually needed — not to remove every script by default.",
    examples: [
      "Analytics",
      "Chat tools",
      "Tracking",
      "Animation libraries",
      "Page builders",
      "Marketing scripts",
      "Plugins",
      "Custom functionality",
    ],
  },
  thirdPartyNote: {
    title: "Third-Party Tools Can Be Useful — and Still Slow the Page",
    body: "Each tool may have a valid business purpose. Friction appears when too many load too early or are poorly implemented.",
    examples: [
      "Analytics",
      "Ads",
      "Chat",
      "Booking widgets",
      "Review widgets",
      "Heatmaps",
      "CRM tracking",
      "Social embeds",
    ],
  },
  hostingVsFrontend: {
    intro:
      "Performance problems can sit in hosting, the website itself, or both. Treating them as the same issue often leads to the wrong fix.",
    hosting: {
      title: "Hosting / server",
      description: "Issues that start before the page assets even run.",
      areas: [
        "Slow response",
        "Poor caching",
        "Resource limitations",
        "Geographic delivery",
      ],
    },
    frontend: {
      title: "Website / frontend",
      description: "Issues that travel with the page into the browser.",
      areas: [
        "Heavy images",
        "Scripts",
        "Themes",
        "Plugins",
        "Rendering",
        "Third-party tools",
      ],
    },
    closing:
      "Changing hosting does not automatically fix a heavy website. Likewise, code optimization cannot fix every server bottleneck.",
  },
  mobileNote: {
    title: "Mobile Usually Exposes Performance Problems First.",
    body: "A site that feels acceptable on a fast desktop connection may still be frustrating on mobile. Mobile visitors often face more constraints.",
    factors: [
      "Slower processors",
      "Less memory",
      "Variable network conditions",
      "Smaller screens",
      "Different interaction patterns",
    ],
  },
  layoutShift: {
    title: "Does the Page Move While You’re Trying to Use It?",
    body: "Layout shift makes pages feel unreliable even when the final design looks polished.",
    examples: [
      "Images appearing without reserved space",
      "Fonts changing after load",
      "Banners inserting above content",
      "Late-loading embeds",
      "Buttons moving",
    ],
  },
  interactionDelay: {
    title: "Loading Isn’t the Only Kind of Slowness.",
    body: "A page can appear visually complete but still respond poorly when visitors try to use it.",
    examples: [
      "Open navigation",
      "Click filters",
      "Submit forms",
      "Interact with sliders",
      "Use search",
      "Add products to cart",
    ],
  },
  perceivedSpeed: {
    title: "Sometimes the Site Needs to Feel Faster, Not Just Test Faster.",
    body: "Improving the experience often means getting useful content in front of people sooner and reducing unnecessary work before the page is ready.",
    ideas: [
      "Prioritize important content",
      "Avoid blocking the first screen",
      "Show useful content earlier",
      "Reduce unnecessary visual complexity",
      "Load secondary content later where appropriate",
    ],
  },
  siteWideVsPage: {
    intro:
      "Diagnostic scope changes depending on whether every page feels slow or only specific journeys do.",
    siteWide: {
      title: "Site-wide",
      description: "Most of the website feels heavy or delayed.",
      areas: [
        "Theme or frontend architecture",
        "Global scripts",
        "Hosting",
        "Fonts",
        "Common plugins",
        "Site-wide tracking",
      ],
    },
    pageSpecific: {
      title: "Page-specific",
      description: "Certain pages or features create the bottleneck.",
      areas: [
        "Large galleries",
        "Maps",
        "Booking widgets",
        "Video",
        "Product filters",
        "Third-party embeds",
        "Specific page scripts",
      ],
    },
  },
  seoRelationship: {
    title: "Can Website Speed Affect SEO?",
    body: "Performance contributes to page experience and technical quality, but rankings are not determined by speed alone. Search relevance, content, architecture, crawlability and other factors still matter. A faster site is not a ranking guarantee.",
  },
  conversionRelationship: {
    title: "Can a Slow Website Reduce Enquiries or Sales?",
    body: "Additional friction can make it harder for people to complete their journey — waiting for a product page, a booking widget, form interaction lag or mobile navigation delay. That does not mean every speed fix produces a guaranteed conversion lift.",
  },
  diagnoseNote:
    "Slow websites may involve images, scripts, third-party tools, hosting, caching, themes, plugins or broader architecture — often in combination. Smartlance reviews the layers before prescribing a fix.",
  diagnosticLayers: [
    {
      title: "User experience",
      description: "What visitors notice while waiting, scanning and interacting.",
    },
    {
      title: "Page / components",
      description: "Templates, widgets and page-level features that shape the load.",
    },
    {
      title: "Frontend assets",
      description: "Images, fonts, CSS and JavaScript that travel with the page.",
    },
    {
      title: "Third-party tools",
      description: "External scripts that serve business needs but add weight.",
    },
    {
      title: "Server / delivery",
      description: "Hosting response, caching and how assets are delivered.",
    },
  ],
  rebuildIntro:
    "A slow website does not automatically mean the whole site needs rebuilding. The right response depends on how deep the bottlenecks run.",
  rebuildLevels: [
    {
      title: "Optimization",
      description: "When the existing foundation is sound.",
      items: [
        "Images",
        "Scripts",
        "Fonts",
        "Caching",
        "Loading behavior",
      ],
    },
    {
      title: "Targeted development",
      description:
        "When specific components, templates or integrations create bottlenecks.",
      items: [
        "Template cleanup",
        "Integration changes",
        "Frontend refinements",
        "Critical-page work",
      ],
    },
    {
      title: "Redesign / rebuild",
      description:
        "When performance problems are deeply tied to older or fragile foundations.",
      items: [
        "Old architecture",
        "Bloated theme",
        "Fragile page builder",
        "Legacy code",
        "Broader UX or site problems",
      ],
    },
  ],
  platformNote: {
    title: "Platform Context Matters — Without Platform Myths",
    body: "Different platforms can have different common performance constraints. No platform is always fast or always slow.",
    platforms: [
      { name: "WordPress", note: "Themes, plugins and hosting often interact." },
      { name: "Shopify", note: "Apps and theme scripts can add weight." },
      {
        name: "WooCommerce",
        note: "Catalog, plugins, database and frontend work together.",
      },
      {
        name: "Webflow",
        note: "Assets, interactions and third-party scripts still matter.",
      },
      {
        name: "Wix Studio",
        note: "Page, media and script configuration can affect experience.",
      },
    ],
  },
  serviceDistinctions: {
    performance: {
      title: "Website Performance Optimization",
      description:
        "Focuses on speed, loading, rendering and interaction quality.",
    },
    technicalSeo: {
      title: "Technical SEO",
      description:
        "Broader search-engine accessibility and technical search foundations. They can overlap, but they are not the same service.",
    },
    websiteAudit: {
      title: "Website Audit",
      description:
        "Relevant when slow performance sits alongside poor UX, SEO issues, conversion problems, outdated design or structural issues.",
    },
  },
  freeReviewPrompt:
    "Not sure whether the slowdown comes from hosting, the site itself or both?",
  relatedWorkHeading: "Related Website Work",
};

/** Outdated website / business evolution solution narrative */
export type OutdatedSolutionPageContent = {
  kind: "outdated";
  slug: string;
  notJustFashion: {
    intro: string;
    reasons: string[];
  };
  dimensionsIntro: string;
  dimensions: { title: string; description: string }[];
  brandNote: { title: string; body: string; points: string[] };
  contentNote: { title: string; body: string; points: string[]; closing: string };
  structureNote: {
    title: string;
    body: string;
    additions: string[];
    outcomes: string[];
  };
  visualAge: { title: string; body: string; signs: string[]; closing: string };
  mobileNote: { title: string; body: string; issues: string[] };
  websiteDebt: {
    title: string;
    body: string;
    items: string[];
    sequence: string[];
    resolve: string[];
  };
  credibility: { title: string; body: string; questions: string[] };
  competitors: { title: string; body: string; usefulFor: string[]; focusOn: string[] };
  looksVsWorks: {
    intro: string;
    looks: ContrastColumn;
    works: ContrastColumn;
  };
  inventory: {
    title: string;
    body: string;
    items: string[];
  };
  seoProtect: { title: string; body: string; risks: string[] };
  refreshLevels: DecisionLevel[];
  whenNotRedesign: { title: string; body: string; examples: string[] };
  diagnoseNote: string;
  businessEvolution: {
    title: string;
    body: string;
    thenLabels: string[];
    nowLabels: string[];
    changes: string[];
  };
  platformQuestion: { title: string; body: string; factors: string[] };
  messagingNote: { title: string; body: string; topics: string[] };
  relatedProblemNotes: {
    leads: string;
    performance: string;
    ranking: string;
  };
  freeReviewPrompt: string;
  relatedWorkHeading: string;
};

export const outdatedWebsitePage: OutdatedSolutionPageContent = {
  kind: "outdated",
  slug: "outdated-website",
  notJustFashion: {
    intro:
      "A website can look reasonably modern and still be outdated for the business. Outdatedness is not only a visual trend problem.",
    reasons: [
      "The content no longer reflects the business",
      "The structure no longer fits the services",
      "Customers cannot find what they need",
      "The site is difficult to manage",
      "Technology has accumulated problems",
      "The brand has evolved",
      "SEO requirements changed",
      "Important journeys were added as afterthoughts",
    ],
  },
  dimensionsIntro:
    "Websites become outdated in different ways. Identifying which dimensions matter helps avoid redesigning for the wrong reason.",
  dimensions: [
    {
      title: "Brand",
      description: "Positioning, imagery and tone no longer match the company.",
    },
    {
      title: "Content",
      description: "Services, details and pages describe an older version of the business.",
    },
    {
      title: "Structure",
      description: "Navigation and hierarchy never caught up with growth.",
    },
    {
      title: "Experience",
      description: "Journeys feel awkward, inconsistent or hard to complete.",
    },
    {
      title: "Technology",
      description: "The system has become fragile, limited or hard to maintain.",
    },
    {
      title: "Performance",
      description: "Accumulated assets and scripts make the site feel heavier.",
    },
    {
      title: "Search",
      description: "SEO was patched on later instead of planned into the structure.",
    },
    {
      title: "Management",
      description: "Simple updates require awkward workarounds.",
    },
  ],
  brandNote: {
    title: "Brand Can Mature Faster Than the Website",
    body: "The business may have matured while the website still uses older branding, imagery, positioning, tone or offers. The website should not chase design trends for their own sake — the question is whether it still communicates the current business clearly and credibly.",
    points: [
      "Old branding",
      "Old imagery",
      "Old positioning",
      "Old tone",
      "Old offers",
      "Inconsistent visual elements",
    ],
  },
  contentNote: {
    title: "Content Can Quietly Drift Out of Date",
    body: "Pages often keep working while the story they tell falls behind.",
    points: [
      "Old services",
      "Former offers",
      "Incorrect information",
      "Missing new capabilities",
      "Old team or company information",
      "Outdated FAQs",
      "Old location or contact details",
      "Content accumulated without structure",
    ],
    closing:
      "Useful historical content may still have search or customer value. The goal is clarity — not deleting everything that is old.",
  },
  structureNote: {
    title: "The Business Grew. The Website Structure Didn’t.",
    body: "Businesses often add new services, industries, locations, products, content and platforms without reconsidering navigation and page hierarchy.",
    additions: [
      "New services",
      "New industries",
      "New locations",
      "New products",
      "New content",
      "New platforms",
    ],
    outcomes: [
      "Crowded menus",
      "Duplicate pages",
      "Buried information",
      "Unclear service relationships",
      "Weak internal linking",
    ],
  },
  visualAge: {
    title: "Visual Age Matters — Clarity Matters More",
    body: "Design age can affect first impressions, but “newer-looking” does not automatically mean better. Design should improve clarity, trust, usability, consistency and action.",
    signs: [
      "Poor hierarchy",
      "Dense layouts",
      "Small typography",
      "Inconsistent spacing",
      "Obsolete image styles",
      "Desktop-first layouts",
      "Old UI conventions",
      "Overuse of effects from an earlier design era",
    ],
    closing:
      "A refresh can update the visual system. It still needs to support how the business works today.",
  },
  mobileNote: {
    title: "Was the Website Designed for How People Browse Now?",
    body: "Many older sites were adapted for mobile later. They may collapse technically while still feeling awkward to use.",
    issues: [
      "Navigation that collapses but remains awkward",
      "Tiny text",
      "Poor spacing",
      "Buttons difficult to tap",
      "Desktop layouts simply squeezed onto phones",
      "Forms that are frustrating",
      "Wide tables or components",
      "Important CTAs hidden far down the page",
    ],
  },
  websiteDebt: {
    title: "Website Debt Builds Up Over Time.",
    body: "Like technical debt, website debt accumulates when temporary decisions stay in place for years. The site can still function while becoming harder to understand, update and improve.",
    items: [
      "Temporary fixes that became permanent",
      "Duplicate plugins",
      "Unused components",
      "Inconsistent page templates",
      "Old tracking scripts",
      "Redirect chains",
      "Unused assets",
      "Multiple design styles",
      "Hardcoded content",
      "Fragile integrations",
    ],
    sequence: [
      "Original website",
      "Quick fix",
      "New service",
      "Plugin / integration",
      "Another page",
      "Design patch",
      "Complexity",
    ],
    resolve: ["Review", "Simplify", "Restructure"],
  },
  credibility: {
    title: "What Does an Outdated Website Communicate?",
    body: "An inconsistent or obviously neglected website can create uncertainty before a visitor has spoken to the business. That does not mean every older design destroys trust — but neglected details can raise questions.",
    questions: [
      "Is the business still active?",
      "Is the information current?",
      "Will the experience be professional?",
      "Can I trust the enquiry or payment process?",
    ],
  },
  competitors: {
    title: "Should You Redesign Because Competitors Did?",
    body: "Not by itself. Competitors can be useful reference points, but redesigning simply because another business changed its website is not a strategy.",
    usefulFor: [
      "Expectations",
      "Content depth",
      "User experience",
      "Features",
      "Clarity",
    ],
    focusOn: [
      "Customers",
      "Business goals",
      "Content",
      "Technical needs",
      "Positioning",
    ],
  },
  looksVsWorks: {
    intro:
      "Sometimes a website looks dated but still works well. Sometimes it looks acceptable while the underlying experience is already failing. Knowing which problem you have helps prevent unnecessary redesigns.",
    looks: {
      title: "Looks outdated",
      description: "The presentation feels behind the business.",
      areas: [
        "Visual style",
        "Imagery",
        "Typography",
        "Brand inconsistency",
      ],
    },
    works: {
      title: "Works outdated",
      description: "The system and journeys no longer fit how the business operates.",
      areas: [
        "Navigation",
        "CMS",
        "Performance",
        "Forms",
        "Mobile",
        "SEO structure",
        "Content architecture",
        "Integrations",
      ],
    },
  },
  inventory: {
    title: "Before Redesigning, Know What You Already Have.",
    body: "A redesign works better when valuable pages, URLs, content and integrations are understood first — especially when migration is involved.",
    items: [
      "Existing pages",
      "Traffic-driving content",
      "Important URLs",
      "Service content",
      "Blog posts",
      "Downloads",
      "Forms",
      "Integrations",
      "Metadata",
      "Media",
    ],
  },
  seoProtect: {
    title: "A Redesign Shouldn’t Accidentally Erase What Already Works.",
    body: "Redesigns do not always hurt rankings — but SEO should be considered during the redesign, not only after launch.",
    risks: [
      "URLs",
      "Metadata",
      "Internal links",
      "Content",
      "Structured data",
      "Redirects",
      "Indexation",
      "Crawl paths",
    ],
  },
  refreshLevels: [
    {
      title: "Refresh",
      description:
        "Best when the foundation is still sound, but selected areas feel dated.",
      items: [
        "Updated imagery",
        "Typography",
        "Colors",
        "Copy",
        "CTA hierarchy",
        "Specific page layouts",
        "Small UX improvements",
      ],
    },
    {
      title: "Redesign",
      description:
        "Best when the website needs broader improvement across the visual system, layouts, navigation, messaging, mobile UX, content hierarchy and conversion paths — while the core platform may remain.",
      items: [
        "Visual system",
        "Page layouts",
        "Navigation",
        "Messaging",
        "Mobile UX",
        "Content hierarchy",
        "Conversion paths",
      ],
    },
    {
      title: "Rebuild",
      description:
        "Best when the underlying system significantly limits progress. Rebuild is not automatically superior — it is appropriate when the foundation itself is holding the business back.",
      items: [
        "Obsolete technology",
        "Fragile architecture",
        "Severe performance issues",
        "CMS limitations",
        "Major structural change",
        "Platform migration",
        "Complex accumulated technical debt",
      ],
    },
  ],
  whenNotRedesign: {
    title: "When a Redesign May Not Be the Answer",
    body: "Not every website problem is a redesign problem. Targeted work can be the more useful next step.",
    examples: [
      "Traffic problem caused primarily by SEO",
      "One landing page underperforming",
      "Specific performance bottleneck",
      "A single broken conversion journey",
      "Small content updates",
      "Analytics or tracking gaps",
    ],
  },
  diagnoseNote:
    "Smartlance reviews how the business has changed and how the current website supports — or limits — that change before recommending a refresh, redesign or rebuild.",
  businessEvolution: {
    title: "Has the Website Kept Up With the Business?",
    body: "Significant business changes often need structural website changes — not only a visual polish.",
    thenLabels: ["Services A / B", "Earlier audience", "Earlier offer"],
    nowLabels: [
      "Services A / B / C / D",
      "New audience",
      "New positioning",
      "New customer journey",
    ],
    changes: [
      "New audience",
      "New services",
      "New locations",
      "New markets",
      "New positioning",
      "New pricing model",
      "New booking or sales process",
      "New platform or integration requirements",
    ],
  },
  platformQuestion: {
    title: "Do You Need to Change Platforms?",
    body: "Not necessarily. Redesign can happen within the current platform or alongside migration, depending on what the business needs next.",
    factors: [
      "CMS limitations",
      "Editing needs",
      "Commerce requirements",
      "Performance",
      "Integrations",
      "Internal team",
      "Future growth",
    ],
  },
  messagingNote: {
    title: "A New Layout Won’t Fix Old Messaging.",
    body: "Redesigning layouts without revisiting outdated content can produce a newer-looking version of the same problem.",
    topics: [
      "Service clarity",
      "Positioning",
      "Headings",
      "Calls to action",
      "Proof",
      "FAQs",
      "Customer questions",
      "Search intent",
    ],
  },
  relatedProblemNotes: {
    leads:
      "An outdated website may contribute to low enquiries when the offer is unclear, trust is weak, navigation is confusing, CTAs are buried or forms are poor.",
    performance:
      "Older architecture may also accumulate scripts, plugins, legacy code, large assets and inefficient components — but not every old website is slow.",
    ranking:
      "Older websites may have structural or search issues, but a dated design alone does not cause poor rankings.",
  },
  freeReviewPrompt:
    "Not sure whether the site needs a few improvements or a larger redesign?",
  relatedWorkHeading: "Related Website Redesign Work",
};

/** Low website conversions / journey friction solution narrative */
export type ConversionsSolutionPageContent = {
  kind: "conversions";
  slug: string;
  conversionDefinition: {
    intro: string;
    examples: { context: string; action: string }[];
  };
  journeyIntro: string;
  journeyStages: VisibilityStage[];
  notJustTheButton: { title: string; body: string; influences: string[] };
  microMacro: {
    intro: string;
    macro: ContrastColumn;
    micro: ContrastColumn;
  };
  causesIntro: string;
  intentNote: { title: string; body: string; mismatches: string[] };
  clarityNote: { title: string; body: string; points: string[] };
  informationGaps: { title: string; body: string; examples: string[]; closing: string };
  commitment: { title: string; body: string; examples: string[] };
  trust: { title: string; body: string; signals: string[] };
  decisionFriction: { title: string; body: string; issues: string[] };
  ctaHierarchy: {
    title: string;
    body: string;
    examples: { primary: string; secondary: string }[];
  };
  formFriction: { title: string; body: string; points: string[]; contexts: string[] };
  checkoutBooking: { title: string; body: string; issues: string[] };
  ecommerceNote: { title: string; body: string; steps: string[] };
  performanceNote: { title: string; body: string; factors: string[] };
  journeyBreak: {
    title: string;
    body: string;
    stages: { label: string; status: string }[];
  };
  measurement: { title: string; body: string; events: string[] };
  analyticsVsCro: {
    intro: string;
    analytics: ContrastColumn;
    cro: ContrastColumn;
  };
  qualitative: { title: string; body: string; inputs: string[] };
  ethicalPrinciple: { title: string; body: string; avoid: string[]; prefer: string[] };
  pageVsJourney: {
    intro: string;
    page: ContrastColumn;
    journey: ContrastColumn;
  };
  needCro: { title: string; body: string; alternatives: string[] };
  redesignLevels: DecisionLevel[];
  diagnoseNote: string;
  auditFramework: VisibilityStage[];
  decisionPath: {
    title: string;
    steps: { label: string; friction?: string }[];
  };
  freeReviewPrompt: string;
  relatedWorkHeading: string;
};

export const lowWebsiteConversionsPage: ConversionsSolutionPageContent = {
  kind: "conversions",
  slug: "low-website-conversions",
  conversionDefinition: {
    intro:
      "A conversion is a meaningful action the website is supposed to help someone complete. It is not only a sale.",
    examples: [
      { context: "Service business", action: "Request a quote" },
      { context: "Hospitality", action: "Check availability / book" },
      { context: "E-commerce", action: "Purchase" },
      { context: "SaaS / technology", action: "Start trial / book demo" },
      { context: "Local business", action: "Call / request appointment" },
      { context: "Content / campaign", action: "Sign up / download" },
    ],
  },
  journeyIntro:
    "Conversion problems often appear somewhere between interest and action. Each stage asks a different question.",
  journeyStages: [
    {
      title: "Arrive",
      description: "Did the user reach a page relevant to what they wanted?",
    },
    {
      title: "Understand",
      description: "Can they quickly understand the offer?",
    },
    {
      title: "Trust",
      description: "Do they have enough confidence to continue?",
    },
    {
      title: "Evaluate",
      description: "Can they compare, learn or verify what they need?",
    },
    {
      title: "Decide",
      description: "Is the value and next step clear enough?",
    },
    {
      title: "Act",
      description: "Can they complete the action without unnecessary friction?",
    },
  ],
  notJustTheButton: {
    title: "Conversion Problems Rarely Begin at the Button.",
    body: "Changing button colour, button text or one headline may sometimes help. Low conversion often involves the whole sequence leading to the action — not only the final click.",
    influences: [
      "Traffic intent",
      "Offer",
      "Content",
      "Navigation",
      "Trust",
      "Pricing context",
      "UX",
      "Performance",
      "Forms",
      "Checkout or booking",
      "Measurement",
    ],
  },
  microMacro: {
    intro:
      "Understanding smaller steps helps identify where journeys break — without treating every click as equally important.",
    macro: {
      title: "Macro conversion",
      description: "The primary business action.",
      areas: [
        "Purchase",
        "Booking",
        "Quote request",
        "Consultation request",
      ],
    },
    micro: {
      title: "Micro conversion",
      description: "A meaningful step toward the primary action.",
      areas: [
        "View pricing",
        "Check availability",
        "Add to cart",
        "Open contact form",
        "Download guide",
        "Click phone",
        "Create account",
        "Start checkout",
      ],
    },
  },
  causesIntro:
    "When visitors reach the site but do not complete important actions, friction usually sits somewhere in the journey — not only at the final button.",
  intentNote: {
    title: "Did the Visitor Land in the Right Place?",
    body: "A technically strong page can still convert poorly if it does not match the user’s intent.",
    mismatches: [
      "Searching for pricing but landing on a vague homepage",
      "Wanting to book but being forced through multiple informational pages",
      "Looking for one service but reaching a generic service overview",
      "Wanting product details but receiving mainly promotional copy",
    ],
  },
  clarityNote: {
    title: "What Is Being Offered — and Why Should It Matter?",
    body: "Visitors should generally understand the essentials without working for them.",
    points: [
      "What this is",
      "Who it is for",
      "What problem it solves",
      "What they receive",
      "Why the business is credible",
      "What happens next",
    ],
  },
  informationGaps: {
    title: "Missing Information Creates Hesitation",
    body: "People often pause when the page does not answer questions they need before acting.",
    examples: [
      "Pricing context",
      "Availability",
      "Scope",
      "Process",
      "Delivery",
      "Features",
      "Location",
      "Policies",
      "Returns",
      "FAQs",
      "What happens after contact",
    ],
    closing:
      "Not every business must publish exact prices. The right context depends on the offer and audience.",
  },
  commitment: {
    title: "Are You Asking for Too Much, Too Soon?",
    body: "Journeys convert better when commitment increases progressively — not when the website demands too much before the visitor understands enough.",
    examples: [
      "A long consultation form when the user only wants basic pricing",
      "Forced account creation before useful information",
      "Many form fields before explaining the service",
      "Pushing “Buy Now” before users understand the product",
    ],
  },
  trust: {
    title: "Confidence Has to Catch Up With Interest",
    body: "Useful confidence signals help people continue. Manipulative tactics do not belong in a genuine conversion approach.",
    signals: [
      "Clear business information",
      "Real testimonials",
      "Real project or work examples",
      "Transparent policies",
      "Secure payment experience",
      "Useful FAQs",
      "Credible service or product detail",
      "Contact information",
      "Consistent design",
    ],
  },
  decisionFriction: {
    title: "More Choice Does Not Always Make Decisions Easier.",
    body: "Choice should be organized, not simply removed. Competing actions and unclear options can stall progress.",
    issues: [
      "Too many competing CTAs",
      "Too many plans or options without distinction",
      "Complex menus",
      "Duplicate offers",
      "Unclear packages",
      "Overloaded product pages",
    ],
  },
  ctaHierarchy: {
    title: "Actions Need Priority",
    body: "A page may contain multiple useful actions, but they should have hierarchy. That does not mean every page should have only one clickable element.",
    examples: [
      { primary: "Book a Consultation", secondary: "View Work" },
      { primary: "Book Now", secondary: "View Rooms" },
    ],
  },
  formFriction: {
    title: "Forms Can Interrupt More Than Enquiries",
    body: "Forms appear across many journeys — not only lead capture.",
    points: [
      "Number of fields",
      "Field relevance",
      "Mobile usability",
      "Validation",
      "Error messages",
      "Required vs optional",
      "Unclear submission expectations",
      "Technical failures",
    ],
    contexts: [
      "Registration",
      "Checkout",
      "Booking",
      "Applications",
      "Enquiries",
    ],
  },
  checkoutBooking: {
    title: "Checkout and Booking Can Create Their Own Friction",
    body: "Transaction-oriented journeys often fail after interest has already been established.",
    issues: [
      "Unexpected requirements",
      "Unclear totals or context",
      "Poor mobile experience",
      "Too many unnecessary steps",
      "Slow third-party booking tools",
      "Confusing availability",
      "Errors",
      "Forced account creation where unnecessary",
    ],
  },
  ecommerceNote: {
    title: "E-commerce Journeys Break in Stages",
    body: "Each step can reveal a different kind of friction. Improving only the final purchase button rarely explains the whole path.",
    steps: [
      "Product view",
      "Add to cart",
      "Begin checkout",
      "Purchase",
    ],
  },
  performanceNote: {
    title: "Friction Can Be Technical Too.",
    body: "Technical problems can interrupt intent even when the offer is clear.",
    factors: [
      "Slow pages",
      "Delayed interactions",
      "Unstable layouts",
      "Broken controls",
      "Heavy mobile experiences",
    ],
  },
  journeyBreak: {
    title: "Where the Journey Breaks",
    body: "Use this as a diagnostic lens — without inventing percentages. The question is where people stop progressing.",
    stages: [
      { label: "Landing page", status: "Reached" },
      { label: "Key information", status: "Continued" },
      { label: "Primary CTA", status: "Started" },
      { label: "Form / cart / booking", status: "Started" },
      { label: "Completion", status: "Completed" },
    ],
  },
  measurement: {
    title: "You Need to Know Where the Drop-Off Happens.",
    body: "Not every website needs every event. Measurement should focus on the actions that matter for the business.",
    events: [
      "CTA clicks",
      "Product views",
      "Add to cart",
      "Checkout start",
      "Form start",
      "Form completion",
      "Booking start",
      "Booking completion",
      "Phone clicks",
      "Email clicks",
      "Downloads",
      "Sign-ups",
    ],
  },
  analyticsVsCro: {
    intro:
      "Measurement without action is incomplete. Optimization without measurement can become guesswork.",
    analytics: {
      title: "Analytics",
      description: "Tells you what users are doing.",
      areas: ["Events", "Paths", "Drop-off points", "Device behaviour"],
    },
    cro: {
      title: "CRO",
      description:
        "Uses evidence to determine what should be tested or improved.",
      areas: [
        "Journey friction",
        "Offer clarity",
        "UX changes",
        "Evidence-led tests",
      ],
    },
  },
  qualitative: {
    title: "Numbers Are Not the Only Useful Evidence",
    body: "Customer conversations and support patterns often reveal friction that analytics alone cannot explain. Evidence collection should respect privacy and lawful use.",
    inputs: [
      "Customer questions",
      "Sales-team feedback",
      "Support questions",
      "User recordings where lawfully and appropriately collected",
      "Survey feedback",
      "Form abandonment patterns",
      "Search terms",
      "Repeated navigation behaviour",
    ],
  },
  ethicalPrinciple: {
    title:
      "Conversion Optimization Should Make Decisions Easier — Not Trick People.",
    body: "Smartlance CRO focuses on clarity, relevance, trust and reduced friction — not manipulative tactics.",
    avoid: [
      "Fake urgency",
      "Hidden fees",
      "Preselected paid extras",
      "Misleading buttons",
      "Difficult cancellation",
      "False scarcity",
      "Forced consent",
      "Confirmshaming",
    ],
    prefer: ["Clarity", "Relevance", "Trust", "Reduced friction"],
  },
  pageVsJourney: {
    intro:
      "Diagnostic scope changes depending on whether one page underperforms or the whole path creates friction.",
    page: {
      title: "Page-specific",
      description: "A concentrated problem around one important URL or offer.",
      areas: [
        "Landing page",
        "Product page",
        "Service page",
        "Pricing page",
      ],
    },
    journey: {
      title: "Journey-wide",
      description: "Friction appears across connected steps and pages.",
      areas: [
        "Navigation",
        "Cross-page messaging",
        "Checkout",
        "Booking",
        "Forms",
        "Mobile flow",
        "Account creation",
      ],
    },
  },
  needCro: {
    title: "Does Low Conversion Automatically Mean You Need CRO?",
    body: "Not always. CRO becomes particularly useful when there is enough meaningful traffic or interaction to evaluate behaviour. There is no universal traffic threshold.",
    alternatives: [
      "Better traffic targeting",
      "SEO",
      "Website performance",
      "A technical fix",
      "Better content",
      "A redesigned page",
      "Analytics setup",
      "Larger website redesign",
    ],
  },
  redesignLevels: [
    {
      title: "Targeted fix",
      description: "A specific form, CTA or page issue is creating friction.",
      items: ["CTA", "Form", "Single page", "Missing information"],
    },
    {
      title: "Journey improvement",
      description:
        "Multiple related pages or steps need clearer structure and flow.",
      items: [
        "Connected pages",
        "Checkout or booking",
        "Mobile flow",
        "Cross-page messaging",
      ],
    },
    {
      title: "Broader redesign",
      description:
        "Structural, UX or content problems exist across the website.",
      items: [
        "Information architecture",
        "Visual system",
        "Content hierarchy",
        "Site-wide experience",
      ],
    },
  ],
  diagnoseNote:
    "Smartlance reviews the journey from arrival to action before prescribing CRO, analytics setup, page work or a wider redesign.",
  auditFramework: [
    {
      title: "Can they find it?",
      description: "Is the relevant offer or page reachable?",
    },
    {
      title: "Can they understand it?",
      description: "Is the offer clear enough to evaluate?",
    },
    {
      title: "Can they trust it?",
      description: "Is there enough confidence to continue?",
    },
    {
      title: "Can they decide?",
      description: "Are options organized and the next step obvious?",
    },
    {
      title: "Can they complete it?",
      description: "Is the action free of unnecessary friction?",
    },
    {
      title: "Can we measure it?",
      description: "Do we know where the journey breaks?",
    },
  ],
  decisionPath: {
    title: "Interest to Completion",
    steps: [
      { label: "Interest" },
      { label: "Need more information?", friction: "Unclear copy" },
      { label: "Confidence established?", friction: "Missing proof" },
      { label: "Ready to act?", friction: "Too many options" },
      { label: "Action easy to complete?", friction: "Long form / slow tool" },
      { label: "Confirmation" },
    ],
  },
  freeReviewPrompt: "Not sure where visitors are getting stuck?",
  relatedWorkHeading: "Related Website Work",
};

/** Website migration / transition planning solution narrative */
export type MigrationSolutionPageContent = {
  kind: "migration";
  slug: string;
  systemsIntro: { title: string; body: string; assets: string[] };
  lifecycleIntro: string;
  lifecycleStages: VisibilityStage[];
  migrationTypes: {
    intro: string;
    types: { title: string; description: string }[];
  };
  shouldMigrate: {
    intro: string;
    yes: ContrastColumn;
    no: ContrastColumn;
  };
  riskModel: {
    intro: string;
    categories: { title: string; areas: string[] }[];
  };
  urlsCritical: { title: string; body: string; reasons: string[]; closing: string };
  redirectMapping: {
    title: string;
    body: string;
    examples: { from: string; to: string; note: string }[];
  };
  homepageDump: { title: string; body: string; reasons: string[] };
  contentInventory: { title: string; body: string; items: string[]; closing: string };
  contentDecisions: {
    intro: string;
    decisions: { title: string; description: string }[];
  };
  seoMigration: { title: string; body: string; areas: string[] };
  noGuarantee: { title: string; body: string; goals: string[] };
  analytics: { title: string; body: string; items: string[] };
  integrations: { title: string; body: string; items: string[] };
  ecommerce: { title: string; body: string; items: string[]; closing: string };
  cmsExperience: { title: string; body: string; considerations: string[] };
  designPlusMigration: { title: string; body: string; movingParts: string[] };
  domainMigration: { title: string; body: string; considerations: string[] };
  preLaunch: { title: string; items: string[] };
  launchDay: { title: string; steps: string[] };
  postLaunch: { title: string; body: string; monitor: string[] };
  recovery: { title: string; body: string; investigate: string[] };
  diagnoseNote: string;
  migrateVsImprove: {
    intro: string;
    migrate: ContrastColumn;
    improve: ContrastColumn;
  };
  platformNote: {
    title: string;
    body: string;
    factors: string[];
    platforms: string[];
  };
  freeReviewPrompt: string;
  relatedWorkHeading: string;
  urlMapVisual: {
    old: string[];
    decisions: string[];
    next: string[];
  };
};

export const websiteMigrationPage: MigrationSolutionPageContent = {
  kind: "migration",
  slug: "website-migration",
  systemsIntro: {
    title: "A Website Migration Is a Transfer of Systems, Not Just Design.",
    body: "A website contains more than visible pages. Migration planning starts by understanding what already exists and what must keep working after launch.",
    assets: [
      "URLs",
      "Content",
      "Metadata",
      "Internal links",
      "Images and files",
      "Forms",
      "Analytics",
      "Tracking",
      "CRM connections",
      "Booking systems",
      "Product data",
      "Redirect history",
      "Structured data",
    ],
  },
  lifecycleIntro:
    "A careful migration moves through planning, transfer and validation — not only design and go-live.",
  lifecycleStages: [
    {
      title: "Inventory",
      description: "Understand what exists.",
    },
    {
      title: "Map",
      description: "Decide what stays, changes, merges or redirects.",
    },
    {
      title: "Build",
      description: "Prepare the new structure and system.",
    },
    {
      title: "Migrate",
      description: "Move approved content, data and functionality.",
    },
    {
      title: "Validate",
      description: "Test URLs, SEO, forms, tracking and functionality.",
    },
    {
      title: "Launch",
      description: "Switch systems carefully.",
    },
    {
      title: "Monitor",
      description: "Check what happens after release.",
    },
  ],
  migrationTypes: {
    intro: "Not every website migration is the same. The scope and risk change with the type of move.",
    types: [
      {
        title: "Platform migration",
        description:
          "Moving between systems — for example WordPress to Webflow, or WooCommerce to Shopify.",
      },
      {
        title: "Design + rebuild",
        description:
          "A new website while keeping or restructuring existing content.",
      },
      {
        title: "Domain migration",
        description: "Moving from one domain to another.",
      },
      {
        title: "Structure migration",
        description: "A major URL or navigation change.",
      },
      {
        title: "Consolidation",
        description: "Combining multiple websites or sections.",
      },
      {
        title: "E-commerce migration",
        description:
          "Products, categories, customers, orders and integrations may be involved.",
      },
    ],
  },
  shouldMigrate: {
    intro:
      "Changing platforms is not always necessary. Migration should solve a real limitation — not become the default answer.",
    yes: {
      title: "Migration may make sense when",
      description: "The current foundation is genuinely limiting the business.",
      areas: [
        "Current CMS is difficult to manage",
        "Platform limits important functionality",
        "Commerce requirements changed",
        "Integrations are difficult",
        "Performance or maintenance burden is high",
        "Business model has changed",
        "Current system is no longer sustainable",
      ],
    },
    no: {
      title: "Reasons not to migrate may include",
      description: "The outcome may be achievable with less risk and disruption.",
      areas: [
        "Problems can be solved inside the existing platform",
        "The platform is not the real issue",
        "Migration risk outweighs benefit",
        "Team already manages the current system effectively",
        "Required functionality already works",
      ],
    },
  },
  riskModel: {
    intro: "A migration can affect more than the look of the site. These are common areas that need protection.",
    categories: [
      {
        title: "Search",
        areas: ["URLs", "Indexing", "Metadata", "Internal links", "Redirects"],
      },
      {
        title: "Content",
        areas: ["Pages", "Media", "Documents", "Products"],
      },
      {
        title: "Functionality",
        areas: ["Forms", "Booking", "Payments", "Search", "Accounts"],
      },
      {
        title: "Measurement",
        areas: ["Analytics", "Tags", "Conversion events"],
      },
      {
        title: "Operations",
        areas: ["CMS workflows", "Editing", "Integrations"],
      },
      {
        title: "User experience",
        areas: ["Navigation", "Journeys", "Mobile", "Accessibility"],
      },
    ],
  },
  urlsCritical: {
    title: "URLs Are One of the Most Important Parts of a Migration.",
    body: "Old URLs may already have search history, links, bookmarks, external references, analytics history and user familiarity. If a URL changes, the migration should determine where it should redirect.",
    reasons: [
      "Search history",
      "Links",
      "Bookmarks",
      "External references",
      "Analytics history",
      "User familiarity",
    ],
    closing:
      "Not every URL must remain unchanged. Sometimes restructuring is appropriate. The point is intentional mapping.",
  },
  redirectMapping: {
    title: "Redirect Planning Should Preserve Intent",
    body: "When a URL changes, the destination should remain relevant. These examples are conceptual — not live Smartlance redirects.",
    examples: [
      {
        from: "/services/web-design",
        to: "/services/website-design",
        note: "Old service page → new equivalent service page",
      },
      {
        from: "/products/old-category",
        to: "/collections/new-category",
        note: "Old product category → new category",
      },
      {
        from: "/old-service",
        to: "/services",
        note: "Removed page with replacement → most relevant new page",
      },
    ],
  },
  homepageDump: {
    title: "“Just Redirect Everything to the Homepage” Is Not a Migration Plan.",
    body: "Homepage dumping usually removes context that people and search engines relied on.",
    reasons: [
      "Users lose context",
      "Search engines lose page relationships",
      "Old links become less useful",
      "Important intent disappears",
    ],
  },
  contentInventory: {
    title: "Know What You’re Moving Before You Start Moving It.",
    body: "An inventory helps decide what should migrate, improve, merge or leave behind.",
    items: [
      "Pages",
      "Blog posts",
      "Products",
      "Categories",
      "Images",
      "PDFs and files",
      "Forms",
      "Downloads",
      "Metadata",
      "Structured data",
      "Campaign landing pages",
      "Legal content",
    ],
    closing: "Not all content should migrate by default.",
  },
  contentDecisions: {
    intro: "Every important URL or content item needs a clear decision.",
    decisions: [
      {
        title: "Keep",
        description: "Still useful and accurate.",
      },
      {
        title: "Improve",
        description: "Useful but needs rewriting or restructuring.",
      },
      {
        title: "Merge",
        description:
          "Several weak or overlapping pages can become one stronger destination.",
      },
      {
        title: "Remove",
        description: "No longer useful and has no meaningful replacement.",
      },
      {
        title: "Redirect",
        description: "Old URL needs a relevant destination.",
      },
    ],
  },
  seoMigration: {
    title: "SEO Should Be Part of the Migration Plan Before Launch.",
    body: "Search foundations should be planned into the move — not reviewed only after traffic changes.",
    areas: [
      "URL mapping",
      "Titles and meta",
      "Canonical handling",
      "Internal links",
      "Crawlability",
      "Indexing directives",
      "Sitemaps",
      "Structured data",
      "Content preservation",
      "Redirects",
    ],
  },
  noGuarantee: {
    title: "Can You Guarantee There Will Be No Ranking Changes?",
    body: "No responsible migration should promise that. Search performance can change during major site changes.",
    goals: [
      "Planning",
      "Preserving important signals",
      "Testing",
      "Monitoring",
      "Responding quickly to issues",
    ],
  },
  analytics: {
    title: "Don’t Launch the New Website Blind.",
    body: "Analytics and tracking should be reviewed before launch so important actions continue to be measurable.",
    items: [
      "GA4",
      "GTM",
      "Search Console",
      "Form events",
      "Checkout events",
      "Booking events",
      "Phone and email clicks",
      "Campaign tracking",
      "Consent configuration",
    ],
  },
  integrations: {
    title: "Forms and Integrations Need Their Own Checklist",
    body: "A visual migration can look successful while business-critical connections are broken.",
    items: [
      "Contact forms",
      "CRM",
      "Email marketing",
      "Booking",
      "Payments",
      "Calendar",
      "Inventory",
      "Reviews",
      "Live chat",
      "Marketing automation",
      "Webhooks",
    ],
  },
  ecommerce: {
    title: "E-commerce Migrations Add Extra Layers",
    body: "Commerce moves can involve more than pages and design. Capabilities depend on the source and destination systems.",
    items: [
      "Products",
      "Variants",
      "Categories",
      "Inventory",
      "Customers",
      "Orders and history where supported",
      "Payment methods",
      "Shipping",
      "Tax",
      "Discounts",
      "Reviews",
      "Product URLs",
      "Structured data",
      "Tracking",
    ],
    closing:
      "Not all historical data can always be moved between every platform.",
  },
  cmsExperience: {
    title: "Migration Should Improve the Experience Behind the Website Too.",
    body: "Visitor-facing design is only part of the outcome. Teams also need a manageable system after launch.",
    considerations: [
      "How pages are edited",
      "Who manages content",
      "Approval workflows",
      "Product management",
      "Media handling",
      "Permissions",
      "Future updates",
    ],
  },
  designPlusMigration: {
    title: "Redesign and Migration Can Happen Together — With More Moving Parts",
    body: "Combining redesign with migration increases planning requirements because several systems change at once.",
    movingParts: [
      "Design",
      "Structure",
      "Content",
      "URLs",
      "Platform",
      "Tracking",
      "Integrations",
    ],
  },
  domainMigration: {
    title: "Domain Changes Add Extra Considerations",
    body: "Moving domains involves more than swapping the homepage. Mapping and monitoring become especially important.",
    considerations: [
      "URL mapping",
      "Redirects",
      "Canonical references",
      "Search Console setup",
      "Internal links",
      "Email and brand implications",
      "External links that may still point to the old domain",
    ],
  },
  preLaunch: {
    title: "What Should Be Checked Before Launch?",
    items: [
      "Key URLs",
      "Redirect map",
      "Navigation",
      "Internal links",
      "Forms",
      "Booking or payment",
      "Analytics",
      "Search tracking",
      "Metadata",
      "Canonical URLs",
      "Robots directives",
      "Sitemap",
      "Mobile",
      "Performance",
      "Accessibility",
      "404 behavior",
      "Legal pages",
    ],
  },
  launchDay: {
    title: "What Happens at Launch?",
    steps: [
      "Final backup or export",
      "Deploy new site",
      "Domain or DNS change if required",
      "Verify redirects",
      "Submit or update sitemap",
      "Test critical journeys",
      "Confirm analytics",
      "Inspect key pages",
    ],
  },
  postLaunch: {
    title: "Migration Work Doesn’t End at Launch.",
    body: "After release, the important work is confirming what still works and catching issues early.",
    monitor: [
      "404s",
      "Redirect failures",
      "Indexing",
      "Crawl issues",
      "Analytics events",
      "Forms",
      "Checkout or booking",
      "Search visibility",
      "Performance",
      "User reports",
    ],
  },
  recovery: {
    title: "What If the Migration Already Happened?",
    body: "If a move already caused problems, investigation can still help identify what to repair. Not all lost rankings can be recovered.",
    investigate: [
      "Comparing old and new URLs",
      "Finding missing redirects",
      "Checking indexing",
      "Reviewing removed content",
      "Testing integrations",
      "Checking analytics continuity",
      "Reviewing sitemap, robots and canonicals",
    ],
  },
  diagnoseNote:
    "Smartlance reviews the current site, target environment and what must be protected before recommending a migration plan — or advising that improvement in place may be safer.",
  migrateVsImprove: {
    intro:
      "The right decision depends on whether the platform and foundation are the real constraint.",
    migrate: {
      title: "Migrate",
      description:
        "When the platform or foundation genuinely limits the business.",
      areas: [
        "CMS limits",
        "Unsustainable architecture",
        "Major commerce change",
        "Integration barriers",
      ],
    },
    improve: {
      title: "Improve in place",
      description:
        "When the current platform can support the desired outcome without the extra risk and cost of migration.",
      areas: [
        "Content and structure fixes",
        "Performance work",
        "UX improvements",
        "SEO improvements",
      ],
    },
  },
  platformNote: {
    title: "Changing Platforms Should Solve a Real Problem.",
    body: "Platform choice should consider how the business publishes, sells, edits and grows — not fashion alone. Smartlance does not claim verified historical migration work for every platform.",
    factors: [
      "Content",
      "Commerce",
      "Editing",
      "SEO",
      "Integrations",
      "Performance",
      "Team",
      "Growth",
    ],
    platforms: [
      "WordPress",
      "Webflow",
      "Shopify",
      "WooCommerce",
      "BigCommerce",
      "Wix Studio",
    ],
  },
  freeReviewPrompt:
    "Not sure whether you need to migrate or improve the current website?",
  relatedWorkHeading: "Related Website Rebuild Work",
  urlMapVisual: {
    old: [
      "/services/web-design",
      "/services/development",
      "/old-service",
      "/blog/article",
    ],
    decisions: ["KEEP", "KEEP", "MERGE", "REDIRECT"],
    next: [
      "/services/website-design",
      "/services/website-development",
      "/services",
      "/blog/article",
    ],
  },
};

/** New business website / planning-from-zero solution narrative */
export type NewBusinessSolutionPageContent = {
  kind: "new-business";
  slug: string;
  corePrinciple: { title: string; body: string; before: string[]; after: string[] };
  planningIntro: string;
  planningStages: VisibilityStage[];
  websiteJobs: {
    intro: string;
    jobs: string[];
    closing: string;
  };
  minimumUseful: {
    title: string;
    body: string;
    priorities: string[];
    closing: string;
  };
  phasedPlan: {
    intro: string;
    phases: DecisionLevel[];
  };
  pagesNeeded: {
    intro: string;
    pages: { title: string; description: string }[];
    closing: string;
  };
  architectures: {
    intro: string;
    examples: { title: string; description: string; pages: string[] }[];
  };
  contentBeforeDesign: {
    title: string;
    body: string;
    topics: string[];
    closing: string;
  };
  copy: { title: string; body: string; needs: string[] };
  branding: {
    title: string;
    body: string;
    minimum: string[];
    closing: string;
  };
  domain: { title: string; body: string; considerations: string[] };
  platforms: {
    intro: string;
    options: { title: string; description: string }[];
  };
  platformFirst: { title: string; body: string; factors: string[] };
  seoDayOne: { title: string; body: string; foundations: string[]; closing: string };
  seoBoltOn: { title: string; body: string; areas: string[] };
  conversion: { title: string; body: string; actions: string[]; influences: string[] };
  proof: { title: string; body: string; signals: string[]; closing: string };
  noClientsYet: { title: string; body: string; alternatives: string[] };
  photography: { title: string; body: string; examples: string[]; closing: string };
  forms: { title: string; body: string; principles: string[] };
  integrations: { title: string; body: string; items: string[]; closing: string };
  analytics: { title: string; body: string; items: string[] };
  performance: { title: string; body: string; stages: string[] };
  accessibility: { title: string; body: string; items: string[]; closing: string };
  afterLaunch: { title: string; body: string; needs: string[] };
  launchChecklist: { title: string; items: string[] };
  overbuild: { title: string; body: string; examples: string[]; closing: string };
  budget: { title: string; body: string; prioritize: string[]; later: string[] };
  growthPhases: VisibilityStage[];
  diagnoseNote: string;
  /** Optional future CTA — only render when enabled to avoid broken links */
  projectPlannerCta: {
    enabled: boolean;
    href: string;
    label: string;
    prompt: string;
  };
  servicesPrompt: string;
  relatedWorkHeading: string;
};

export const newBusinessWebsitePage: NewBusinessSolutionPageContent = {
  kind: "new-business",
  slug: "new-business-website",
  corePrinciple: {
    title: "A Website Should Begin With What the Business Needs to Achieve.",
    body: "Starting with colours, animations or templates before deciding who the website is for, what visitors need to understand, what action matters and what pages are required can produce a polished site with weak business foundations.",
    before: ["Colours", "Animations", "Templates"],
    after: [
      "Who the website is for",
      "What they need to understand",
      "What action matters",
      "What pages are required",
      "What content exists",
    ],
  },
  planningIntro:
    "A clear planning sequence keeps design and development connected to the business — not the other way around.",
  planningStages: [
    {
      title: "Goal",
      description: "What should the website help the business achieve?",
    },
    {
      title: "Audience",
      description: "Who is it primarily for?",
    },
    {
      title: "Message",
      description: "What should visitors understand?",
    },
    {
      title: "Structure",
      description: "What pages are needed?",
    },
    {
      title: "Content",
      description: "What proof, information and assets are required?",
    },
    {
      title: "Design",
      description: "How should the business be presented visually?",
    },
    {
      title: "Build",
      description: "Which platform and functionality make sense?",
    },
    {
      title: "Measure",
      description: "How will important actions be tracked after launch?",
    },
  ],
  websiteJobs: {
    intro:
      "A site may have more than one goal, but primary actions should still be clear.",
    jobs: [
      "Generate enquiries",
      "Take bookings",
      "Sell products",
      "Build credibility",
      "Explain services",
      "Show work",
      "Attract local customers",
      "Capture leads",
      "Support marketing campaigns",
      "Provide useful information",
    ],
    closing:
      "When the website job is unclear, pages, copy and calls to action compete instead of supporting one another.",
  },
  minimumUseful: {
    title: "Start With the Smallest Website That Can Do the Job Properly.",
    body: "This does not mean build cheap. It means avoid unnecessary complexity. Version one should prioritise what the business needs to operate and convert — not every future feature.",
    priorities: [
      "Critical pages",
      "Clear navigation",
      "Credible content",
      "Strong mobile experience",
      "SEO foundations",
      "Important integrations",
      "Measurement",
    ],
    closing:
      "You do not need every future feature on launch day. You need a website that can clearly explain the business and support the actions that matter now.",
  },
  phasedPlan: {
    intro:
      "Ambitious businesses still benefit from sequencing. Build what is essential first, then expand with evidence.",
    phases: [
      {
        title: "Launch now",
        description: "What is essential to operate and convert?",
        items: [
          "Core pages",
          "Clear offer",
          "Contact or purchase path",
          "Mobile-ready design",
          "Basic SEO foundations",
          "Essential integrations",
        ],
      },
      {
        title: "Add next",
        description:
          "What becomes useful after initial traffic or customer feedback?",
        items: [
          "Extra service pages",
          "Resources that answer real questions",
          "Improved proof",
          "Additional integrations",
          "Content expansion",
        ],
      },
      {
        title: "Later",
        description: "What can wait until there is evidence it is needed?",
        items: [
          "Advanced calculators",
          "Complex portals",
          "Large resource libraries",
          "Multiple integrations",
          "Automation",
        ],
      },
    ],
  },
  pagesNeeded: {
    intro:
      "The answer depends on the business. These are common building blocks — not a required list for every site.",
    pages: [
      {
        title: "Home",
        description: "Clear summary of the business and next step.",
      },
      {
        title: "About",
        description: "Why the business exists and what makes it credible.",
      },
      {
        title: "Services or Products",
        description: "What is actually offered.",
      },
      {
        title: "Individual service or product pages",
        description:
          "Where search intent or decision-making needs more detail.",
      },
      {
        title: "Work / case studies / gallery",
        description: "Where proof matters.",
      },
      {
        title: "FAQ",
        description: "Questions that commonly block decisions.",
      },
      {
        title: "Contact",
        description: "Clear path to enquiry.",
      },
      {
        title: "Legal",
        description:
          "Privacy, terms and required policies where applicable.",
      },
    ],
    closing: "Not every website must include every page type.",
  },
  architectures: {
    intro:
      "Different business models often need different starting structures. These examples are conceptual.",
    examples: [
      {
        title: "Service businesses",
        description:
          "A practical starting architecture for explaining offers and inviting contact.",
        pages: [
          "Home",
          "Services",
          "Service detail",
          "About",
          "Work / testimonials",
          "FAQ",
          "Contact",
        ],
      },
      {
        title: "Local businesses",
        description:
          "Structure that supports clarity for nearby customers and local search relevance — without replacing a dedicated local visibility plan.",
        pages: [
          "Home",
          "Services",
          "About",
          "Location / service area",
          "Reviews / work",
          "FAQ",
          "Contact",
        ],
      },
      {
        title: "E-commerce",
        description:
          "Commerce adds product, payment, shipping, tax, tracking and inventory considerations beyond page layout.",
        pages: [
          "Home",
          "Shop",
          "Categories",
          "Products",
          "About",
          "FAQ",
          "Shipping / returns",
          "Contact",
        ],
      },
    ],
  },
  contentBeforeDesign: {
    title: "Design Is Easier When the Content Has Direction.",
    body: "Businesses should think about the substance visitors need before visual design locks the structure.",
    topics: [
      "Services",
      "Audience questions",
      "Proof",
      "Benefits",
      "Process",
      "FAQs",
      "Photos",
      "Team or company information",
      "Location",
      "Contact methods",
      "Calls to action",
    ],
    closing:
      "Every sentence does not need to be final before design begins — enough clarity to inform structure does.",
  },
  copy: {
    title: "Your Website Needs More Than a Tagline.",
    body: "Visitors need enough information to understand the offer and take the next step with confidence.",
    needs: [
      "What you offer",
      "Who it is for",
      "Why you are credible",
      "How it works",
      "What to do next",
    ],
  },
  branding: {
    title: "Do You Need a Full Brand Before Building the Website?",
    body: "Not always. At minimum, the website benefits from a consistent visual foundation. A business should not delay indefinitely because a long brand guideline does not exist.",
    minimum: ["Logo", "Colours", "Type", "Image direction", "Tone"],
    closing:
      "Where branding is weak or inconsistent, a focused brand identity for the web can help without waiting for a complete brand system.",
  },
  domain: {
    title: "Choosing the Domain",
    body: "A domain should support clarity and recall. This is practical naming guidance — not trademark or legal advice.",
    considerations: [
      "Simple",
      "Easy to spell",
      "Aligned with brand",
      "Appropriate extension",
      "Avoid unnecessary complexity",
    ],
  },
  platforms: {
    intro:
      "Platform selection should follow requirements. No platform is universally best for every new business.",
    options: [
      {
        title: "WordPress",
        description: "Flexible content and business websites.",
      },
      {
        title: "Shopify",
        description: "Commerce-first businesses.",
      },
      {
        title: "WooCommerce",
        description: "Commerce within WordPress.",
      },
      {
        title: "Webflow",
        description:
          "Marketing-led sites with flexible visual development.",
      },
      {
        title: "Wix Studio / Squarespace",
        description:
          "Managed business sites where simpler editing and setup fit.",
      },
      {
        title: "Framer",
        description:
          "Modern marketing or product sites where its strengths fit.",
      },
      {
        title: "HubSpot CMS",
        description:
          "Businesses already centred around HubSpot marketing or CRM.",
      },
    ],
  },
  platformFirst: {
    title: "Choose the Requirements Before the Technology.",
    body: "The platform should support the business — not determine it. Choose technology after the requirements are clear.",
    factors: [
      "Content",
      "Commerce",
      "Integrations",
      "Editing",
      "SEO",
      "Performance",
      "Team workflow",
      "Growth",
    ],
  },
  seoDayOne: {
    title: "Should a New Website Think About SEO Before Launch?",
    body: "Yes, where search visibility matters. Foundations can be planned into the website even when rankings take time.",
    foundations: [
      "Site architecture",
      "Page topics",
      "URLs",
      "Titles and headings",
      "Internal links",
      "Crawlability",
      "Mobile",
      "Performance",
      "Local relevance",
      "Structured data where appropriate",
    ],
    closing:
      "Planning SEO into the launch does not mean rankings appear immediately.",
  },
  seoBoltOn: {
    title: "SEO Is Easier to Plan Into the Website Than Bolt On Later.",
    body: "Navigation, page structure, content planning, URLs and templates are easier to influence before launch than to retrofit afterwards.",
    areas: [
      "Navigation",
      "Page structure",
      "Content planning",
      "URLs",
      "Templates",
    ],
  },
  conversion: {
    title: "What Should Visitors Be Able to Do?",
    body: "Primary actions should influence page structure, CTA placement, forms and navigation from the start.",
    actions: [
      "Request a quote",
      "Call",
      "Book",
      "Buy",
      "Sign up",
      "Check availability",
      "Download",
      "Visit a location",
    ],
    influences: [
      "Page structure",
      "CTA placement",
      "Forms",
      "Navigation",
    ],
  },
  proof: {
    title: "New Businesses Still Need Ways to Build Trust.",
    body: "Trust can be built without inventing reviews or inventing a portfolio. Use genuine signals the business already has.",
    signals: [
      "Founder or business background",
      "Past experience",
      "Real testimonials",
      "Certifications",
      "Portfolio",
      "Process",
      "Policies",
      "Verified partners",
      "Real photos",
      "Clear contact details",
    ],
    closing:
      "Do not fabricate reviews when the business is new. If testimonials do not yet exist, use other genuine trust signals.",
  },
  noClientsYet: {
    title: "What If There Are No Clients Yet?",
    body: "A new business can still look credible without fake social proof.",
    alternatives: [
      "Show process",
      "Show expertise",
      "Show sample deliverables only if clearly labelled",
      "Explain business background",
      "Show real credentials",
      "Provide useful content",
      "Make the offer specific",
      "Be transparent about the company",
    ],
  },
  photography: {
    title: "Real Imagery Helps Where It Fits the Business",
    body: "Good real imagery is preferable where relevant — but photography is not mandatory for every type of business.",
    examples: [
      "Team or founder",
      "Location",
      "Products",
      "Property",
      "Completed work",
      "Service process",
    ],
    closing:
      "Avoid generic stock imagery where it weakens credibility.",
  },
  forms: {
    title: "Keep the First Conversion Path Simple.",
    body: "Ask for enough information to move the conversation forward — not every detail you might eventually want.",
    principles: [
      "Appropriate autocomplete",
      "Clear required and optional fields",
      "Good mobile UX",
      "Useful confirmation",
    ],
  },
  integrations: {
    title: "Identify Business-Critical Integrations Early",
    body: "Integrations should be identified before platform selection when they are essential to how the business operates.",
    items: [
      "CRM",
      "Booking",
      "Payments",
      "Email marketing",
      "Analytics",
      "Calendar",
      "Forms",
      "Live chat",
      "Inventory",
    ],
    closing:
      "If an existing platform or integration can reasonably solve a need, that is often more practical than custom development on day one.",
  },
  analytics: {
    title: "Launch With Measurement in Place.",
    body: "Basic measurement helps you understand whether the website is supporting the actions that matter.",
    items: [
      "Important CTA clicks",
      "Forms",
      "Bookings",
      "Purchases",
      "Calls and email clicks",
      "Search Console",
      "Analytics",
    ],
  },
  performance: {
    title: "Protect Performance While You Build",
    body: "Performance is easier to protect when considered during design, asset preparation, development and third-party integration — rather than after the site becomes heavy.",
    stages: [
      "Design",
      "Asset preparation",
      "Development",
      "Third-party integration",
    ],
  },
  accessibility: {
    title: "Accessibility Belongs in the Foundation",
    body: "Accessible foundations help more people use the website successfully. This is good practice — not a legal compliance guarantee.",
    items: [
      "Readable contrast",
      "Keyboard usability",
      "Labels",
      "Semantic structure",
      "Responsive layouts",
      "Descriptive content",
    ],
    closing:
      "Accessibility work should continue as the site grows — it is not only a launch checkbox.",
  },
  afterLaunch: {
    title: "What Happens After Launch?",
    body: "A website is not a one-time file. Ongoing care keeps it useful as the business changes.",
    needs: [
      "Updates",
      "Backups",
      "Security",
      "Content",
      "Analytics review",
      "Performance",
      "SEO",
      "New pages",
      "Testing",
    ],
  },
  launchChecklist: {
    title: "Before the Website Goes Live",
    items: [
      "Domain",
      "SSL",
      "Forms",
      "Email delivery",
      "Mobile",
      "Navigation",
      "Links",
      "Metadata",
      "Favicon",
      "Analytics",
      "Search Console",
      "Robots and sitemap",
      "Performance",
      "404 behaviour",
      "Legal pages",
      "Social previews",
      "Backups where relevant",
    ],
  },
  overbuild: {
    title: "Things New Websites Often Don’t Need on Day One",
    body: "These can become useful later. Build them when the business actually needs them.",
    examples: [
      "Complex customer portal",
      "Dozens of thin service pages",
      "Huge animation system",
      "Custom application when a simpler integration works",
      "Multiple chat and marketing widgets",
      "A large blog before launch",
      "Features with no confirmed business need",
    ],
    closing:
      "Ambitious plans belong in the roadmap — not necessarily in version one.",
  },
  budget: {
    title: "Where Should a New Business Prioritise Its Website Budget?",
    body: "Budget priorities usually belong to foundations that help the business operate clearly — not decorative complexity.",
    prioritize: [
      "Clarity",
      "Core pages",
      "Credible design",
      "Good development",
      "Mobile",
      "SEO foundation",
      "Essential integrations",
      "Measurement",
    ],
    later: [
      "Unnecessary complexity",
      "Decorative effects",
      "Features without evidence",
    ],
  },
  growthPhases: [
    {
      title: "Now",
      description: "Essential foundation",
    },
    {
      title: "Next",
      description: "Improve based on real use",
    },
    {
      title: "Grow",
      description: "Add content and features when justified",
    },
  ],
  diagnoseNote:
    "Smartlance helps clarify goals, structure, content, platform and launch requirements before design and development begin — so version one is useful, not overbuilt.",
  projectPlannerCta: {
    enabled: true,
    href: "/project-planner",
    label: "Plan Your Website Project",
    prompt:
      "Not sure what kind of website project you need yet? The Project Planner helps narrow the direction before you choose services or platforms.",
  },
  servicesPrompt:
    "Already have a temporary site or online presence worth reviewing? You can also explore website services or tell us about the project directly.",
  relatedWorkHeading: "Related Website Work",
};

/** E-commerce growth / commerce-system solution narrative */
export type EcommerceGrowthSolutionPageContent = {
  kind: "ecommerce";
  slug: string;
  trafficNotEnough: {
    title: string;
    body: string;
    limits: string[];
    system: string[];
    closing: string;
  };
  journeyIntro: string;
  journeyStages: VisibilityStage[];
  growthModel: {
    intro: string;
    stages: VisibilityStage[];
  };
  discovery: {
    title: string;
    body: string;
    areas: string[];
    closing: string;
  };
  categories: {
    title: string;
    body: string;
    problems: string[];
  };
  search: {
    title: string;
    body: string;
    considerations: string[];
  };
  filtering: {
    title: string;
    body: string;
    examples: string[];
    closing: string;
  };
  productPage: {
    title: string;
    body: string;
    information: string[];
    closing: string;
  };
  imagery: {
    title: string;
    body: string;
    points: string[];
  };
  copy: {
    title: string;
    body: string;
    points: string[];
  };
  trust: {
    title: string;
    body: string;
    signals: string[];
    avoid: string[];
  };
  cart: {
    title: string;
    body: string;
    problems: string[];
  };
  checkout: {
    title: string;
    body: string;
    areas: string[];
    closing: string;
  };
  ethical: {
    title: string;
    body: string;
    avoid: string[];
  };
  mobile: {
    title: string;
    body: string;
    issues: string[];
  };
  performance: {
    title: string;
    body: string;
    contributors: string[];
  };
  apps: {
    title: string;
    body: string;
    effects: string[];
  };
  seo: {
    title: string;
    body: string;
    areas: string[];
  };
  seoLayers: {
    intro: string;
    layers: ContrastColumn[];
  };
  duplicateContent: {
    title: string;
    body: string;
    challenges: string[];
    closing: string;
  };
  outOfStock: {
    title: string;
    body: string;
    depends: string[];
  };
  measurement: {
    title: string;
    body: string;
    events: string[];
    closing: string;
  };
  funnelStages: VisibilityStage[];
  analyticsQuestions: string[];
  trafficQuality: {
    title: string;
    body: string;
    intents: string[];
  };
  platforms: {
    intro: string;
    options: { title: string; description: string; href: string }[];
  };
  shouldMigrate: {
    intro: string;
    yes: ContrastColumn;
    no: ContrastColumn;
  };
  operations: {
    title: string;
    body: string;
    dependencies: string[];
    closing: string;
  };
  redesignLevels: DecisionLevel[];
  catalogueGrowth: {
    title: string;
    body: string;
    areas: string[];
    closing: string;
  };
  customerJourney: VisibilityStage[];
  postPurchase: {
    title: string;
    body: string;
    items: string[];
  };
  priorityFramework: VisibilityStage[];
  diagnoseNote: string;
  freeReviewPrompt: string;
  /** Explicit: no verified published e-commerce case studies yet */
  relatedWorkAvailable: boolean;
  relatedWorkHeading: string;
};

export const ecommerceGrowthPage: EcommerceGrowthSolutionPageContent = {
  kind: "ecommerce",
  slug: "ecommerce-growth",
  trafficNotEnough: {
    title: "More Traffic Won’t Fix a Weak Shopping Experience.",
    body: "Store growth may be limited by how shoppers move through the catalogue — not only by how many people arrive. Traffic acquisition still matters, but it cannot compensate for a weak shopping system.",
    limits: [
      "Poor product discovery",
      "Weak product pages",
      "Unclear shipping",
      "Lack of trust",
      "Slow performance",
      "Mobile friction",
      "Checkout issues",
      "Poor measurement",
      "Technical SEO",
    ],
    system: ["Traffic", "Experience", "Conversion", "Operations"],
    closing:
      "Help shoppers find, understand and purchase the right products with less unnecessary friction.",
  },
  journeyIntro:
    "A useful store supports the full shopping path — from finding products to completing and returning to the experience.",
  journeyStages: [
    {
      title: "Discover",
      description:
        "Can customers find the store and the relevant products?",
    },
    {
      title: "Browse",
      description:
        "Can they navigate categories, search and filters easily?",
    },
    {
      title: "Evaluate",
      description: "Do product pages provide enough useful information?",
    },
    {
      title: "Commit",
      description: "Is there enough confidence to add to cart?",
    },
    {
      title: "Check out",
      description:
        "Can the purchase be completed with minimal unnecessary friction?",
    },
    {
      title: "Return",
      description:
        "Does the experience make future purchasing and continued engagement possible?",
    },
  ],
  growthModel: {
    intro:
      "E-commerce growth is interconnected. Improving one stage often depends on the others working.",
    stages: [
      {
        title: "Visibility",
        description: "Can the store and its products be found?",
      },
      {
        title: "Discovery",
        description: "Can shoppers reach the right products once inside?",
      },
      {
        title: "Product experience",
        description: "Can they evaluate options with confidence?",
      },
      {
        title: "Conversion",
        description: "Can they complete the purchase smoothly?",
      },
      {
        title: "Measurement",
        description: "Can the journey be reviewed honestly?",
      },
      {
        title: "Improvement",
        description: "Can the store evolve from evidence?",
      },
    ],
  },
  discovery: {
    title: "Can Shoppers Find the Right Product?",
    body: "Discovery becomes more important as catalogues grow. Products that exist but cannot be found do not convert.",
    areas: [
      "Navigation",
      "Categories",
      "Collections",
      "Site search",
      "Filters",
      "Sorting",
      "Related products",
      "Internal linking",
      "Mobile browsing",
    ],
    closing:
      "Architecture that works for a small catalogue may not work as well once the range expands.",
  },
  categories: {
    title: "Category and Collection Structure",
    body: "There is no universal category structure. The structure should match how people shop — not how products were uploaded.",
    problems: [
      "Too many categories",
      "Categories that overlap",
      "Unclear naming",
      "Products buried too deeply",
      "Empty or thin category pages",
      "Filters that do not reflect how people shop",
    ],
  },
  search: {
    title: "Search Matters More When Customers Know What They Want.",
    body: "Useful product search helps determined shoppers move faster — especially on larger catalogues.",
    considerations: [
      "Useful product search",
      "Clear result states",
      "Misspellings and synonyms where supported",
      "No-results handling",
      "Mobile usability",
    ],
  },
  filtering: {
    title: "Filters Should Reflect How People Shop",
    body: "Filters help when they expose meaningful product attributes — without becoming overwhelming.",
    examples: [
      "Size",
      "Price",
      "Category",
      "Brand",
      "Availability",
      "Features",
    ],
    closing:
      "Faceted navigation can also affect SEO and crawl behaviour, so filtering choices should be intentional.",
  },
  productPage: {
    title: "Your Product Page Has to Answer the Buying Questions.",
    body: "Shoppers need enough information to evaluate the item — not a wall of keywords or a page that assumes they already know the product.",
    information: [
      "Clear product name",
      "Useful imagery",
      "Price",
      "Variants and options",
      "Availability",
      "Features",
      "Benefits",
      "Dimensions or specifications where relevant",
      "Delivery and shipping",
      "Returns",
      "Genuine reviews where available",
      "Related information",
      "Clear purchase action",
    ],
    closing: "Not every product needs long copy.",
  },
  imagery: {
    title: "Product Imagery Should Help Evaluation",
    body: "Clear, relevant imagery supports confidence. Decorative media that significantly slows the page can work against the sale.",
    points: [
      "Clear product imagery",
      "Multiple relevant views",
      "Consistent presentation",
      "Zoom or detail where useful",
      "Video only where useful",
    ],
  },
  copy: {
    title: "Product Descriptions Should Help Shoppers Decide",
    body: "Descriptions should help users evaluate the item rather than merely repeating manufacturer or keyword-heavy copy.",
    points: [
      "What it is",
      "Who it suits",
      "Key characteristics",
      "Important dimensions, materials or features",
      "Use or care",
      "Relevant differences between options",
    ],
  },
  trust: {
    title: "Customers Need Confidence Before They Commit.",
    body: "Trust information should be present before add-to-cart becomes the only next step.",
    signals: [
      "Real reviews",
      "Shipping information",
      "Returns policy",
      "Secure payment experience",
      "Company and contact details",
      "Product availability",
      "Warranties where real",
      "FAQs",
      "Clear pricing",
    ],
    avoid: [
      "Fake reviews",
      "Fake scarcity",
      "Fake viewer counts",
      "Fake stock warnings",
    ],
  },
  cart: {
    title: "The Cart Should Support Progress, Not Create Confusion",
    body: "Cart experience often reveals problems that product pages alone do not show.",
    problems: [
      "Unexpected charges",
      "Confusing quantities",
      "Hard-to-edit items",
      "Poor mobile layout",
      "Unclear delivery information",
      "Discount-code distractions",
      "Slow updates",
      "Cross-sells overwhelming checkout progress",
    ],
  },
  checkout: {
    title: "Checkout Should Finish the Decision, Not Restart It.",
    body: "Checkout capabilities vary by platform. Improvements should respect what the platform can support without promising unrestricted customisation.",
    areas: [
      "Unnecessary steps",
      "Unexpected information requirements",
      "Account creation",
      "Payment options",
      "Shipping context",
      "Errors",
      "Mobile fields",
      "Validation",
      "Page performance",
    ],
    closing:
      "Not every platform checkout can be customised equally.",
  },
  ethical: {
    title: "Conversion Should Come From Clarity, Not Pressure Tricks.",
    body: "Ethical commerce conversion reduces unnecessary friction. It does not manufacture urgency or hide important costs.",
    avoid: [
      "False scarcity",
      "Fake countdowns",
      "Hidden shipping fees",
      "Preselected paid extras",
      "Misleading subscription enrollment",
      "Difficult cancellation",
      "Fake customer activity",
      "Forced urgency",
    ],
  },
  mobile: {
    title: "Mobile Commerce Needs Its Own Attention",
    body: "Many shoppers browse and buy on phones. Mobile friction can interrupt discovery, evaluation and checkout even when desktop looks fine.",
    issues: [
      "Crowded product grids",
      "Tiny filters",
      "Awkward variant selectors",
      "Large sticky elements",
      "Slow galleries",
      "Poor cart controls",
      "Long checkout forms",
      "Buttons outside comfortable reach",
    ],
  },
  performance: {
    title: "A Store Can Become Heavy Quickly.",
    body: "Commerce stores often accumulate weight over time. Performance tradeoffs should be reviewed as part of the shopping experience.",
    contributors: [
      "Product images",
      "Apps and plugins",
      "Tracking scripts",
      "Reviews widgets",
      "Recommendation engines",
      "Chat",
      "Filters",
      "Animations",
      "Third-party tools",
    ],
  },
  apps: {
    title: "Every App Should Earn Its Place.",
    body: "Apps and plugins can be useful. They are not automatically bad — but each one can affect the store.",
    effects: [
      "Performance",
      "Complexity",
      "Maintenance",
      "Cost",
      "Customer experience",
    ],
  },
  seo: {
    title: "Can Search Engines Understand Your Catalogue?",
    body: "SEO can help customers discover categories, products and commercial content. It is not a substitute for improving the shopping experience.",
    areas: [
      "Product URLs",
      "Category and collection structure",
      "Titles and headings",
      "Product content",
      "Internal linking",
      "Canonical handling",
      "Duplicate variants or URLs",
      "Structured product data",
      "Indexation",
      "Faceted navigation",
      "Out-of-stock products",
      "Performance",
    ],
  },
  seoLayers: {
    intro:
      "Different page types support different search intent. Not every store needs a large blog.",
    layers: [
      {
        title: "Product pages",
        description: "Capture specific product or item intent.",
      },
      {
        title: "Category / collection pages",
        description: "Can address broader browsing or category intent.",
      },
      {
        title: "Content / guides",
        description: "May support informational discovery when useful.",
      },
    ],
  },
  duplicateContent: {
    title: "Similar Products Need Useful Differentiation",
    body: "Duplicate or near-duplicate product content can make pages less useful for shoppers and search engines. This is about usefulness — not an automatic penalty claim.",
    challenges: [
      "Many products use manufacturer copy",
      "Variants generate repeated content",
      "Similar products differ only slightly",
    ],
    closing:
      "Clear differences, options and attributes help shoppers and search engines understand what each page is for.",
  },
  outOfStock: {
    title: "Out-of-Stock Products Need Intentional Handling",
    body: "There is no single rule for every unavailable product. Handling depends on context.",
    depends: [
      "Temporary vs permanent stock status",
      "Replacement products",
      "Existing search visibility",
      "Customer usefulness",
    ],
  },
  measurement: {
    title: "Know Where the Shopping Journey Breaks.",
    body: "Useful commerce measurement supports better questions. Not every store needs every event.",
    events: [
      "Product view",
      "Search",
      "Filter use where useful",
      "Add to cart",
      "Remove from cart",
      "Checkout start",
      "Shipping step",
      "Payment step",
      "Purchase",
      "Coupon use",
      "Wishlist where relevant",
    ],
    closing:
      "Reliable tracking should come before confidently diagnosing every drop-off — and tracking is evidence, not perfect truth.",
  },
  funnelStages: [
    {
      title: "Product discovered",
      description: "Potential friction: navigation, search, filters",
    },
    {
      title: "Product viewed",
      description: "Potential friction: information, imagery, options",
    },
    {
      title: "Added to cart",
      description: "Potential friction: trust, shipping, pricing clarity",
    },
    {
      title: "Checkout started",
      description: "Potential friction: account, forms, payment options",
    },
    {
      title: "Purchase completed",
      description: "Potential friction: errors, performance, unexpected costs",
    },
  ],
  analyticsQuestions: [
    "Which product or category pages are used?",
    "Where do shoppers stop progressing?",
    "Are mobile journeys behaving differently?",
    "Do customers reach checkout?",
    "Are purchase events being measured correctly?",
  ],
  trafficQuality: {
    title: "Not All Store Traffic Has the Same Intent.",
    body: "Different visitors arrive with different readiness to buy. Understanding intent helps interpret conversion issues more carefully.",
    intents: [
      "Informational visitors",
      "Product researchers",
      "Comparison shoppers",
      "Returning customers",
      "Purchase-ready visitors",
    ],
  },
  platforms: {
    intro:
      "Platform choice should follow catalogue, integration, editing and growth requirements. No platform is universally best — and Smartlance does not claim official vendor partnerships.",
    options: [
      {
        title: "Shopify",
        description: "Commerce-first managed ecosystem.",
        href: "/platforms/shopify",
      },
      {
        title: "WooCommerce",
        description: "WordPress-based commerce flexibility.",
        href: "/platforms/woocommerce",
      },
      {
        title: "BigCommerce",
        description:
          "Dedicated commerce platform suited to certain catalogue and integration needs.",
        href: "/platforms/bigcommerce",
      },
    ],
  },
  shouldMigrate: {
    intro:
      "Changing platforms is not automatic. Migration should solve a real commerce limitation.",
    yes: {
      title: "Migration may make sense when",
      description: "The current foundation significantly limits the store.",
      areas: [
        "Platform limitations",
        "Maintenance burden",
        "Required integrations",
        "Commerce workflow",
        "Catalogue complexity",
        "Editing or team needs",
        "Performance limits that cannot reasonably be solved",
      ],
    },
    no: {
      title: "Reasons to remain may include",
      description: "The current platform can still support the required outcome.",
      areas: [
        "Existing platform supports requirements",
        "Migration would add unnecessary risk or cost",
        "Problems are primarily UX, content or SEO rather than platform",
      ],
    },
  },
  operations: {
    title: "The Website Is Only One Part of E-commerce.",
    body: "Website experience influences growth, but store results also depend on operational systems Smartlance does not replace.",
    dependencies: [
      "Inventory",
      "Shipping",
      "Fulfilment",
      "Returns",
      "Customer support",
      "Payments",
      "Tax configuration",
      "Product management",
    ],
    closing:
      "This page focuses on the website system Smartlance can influence — not logistics, tax or accounting consultancy.",
  },
  redesignLevels: [
    {
      title: "Targeted improvement",
      description: "Fix specific friction without rebuilding the store.",
      items: [
        "Product page",
        "Navigation",
        "Filter",
        "Checkout-related UX",
        "Performance",
      ],
    },
    {
      title: "Store experience redesign",
      description: "Rework broader shopping experience across templates.",
      items: [
        "Categories",
        "Product templates",
        "Mobile",
        "Trust",
        "Navigation",
        "Visual consistency",
      ],
    },
    {
      title: "Rebuild / migration",
      description:
        "When platform or technical foundations significantly limit the store.",
      items: [
        "Platform change",
        "Major architecture change",
        "Unsustainable technical debt",
      ],
    },
  ],
  catalogueGrowth: {
    title: "What Happens as the Catalogue Gets Larger?",
    body: "Architecture that works for a small range may not work as well once the catalogue expands. There is no fixed product count that determines platform choice.",
    areas: [
      "Navigation",
      "Category hierarchy",
      "Filters",
      "Search",
      "Content consistency",
      "Product data",
      "Performance",
      "Internal linking",
      "Maintenance",
    ],
    closing:
      "Growth planning should consider how discovery and operations scale with the catalogue.",
  },
  customerJourney: [
    {
      title: "Landing",
      description: "Entry from search, ads, email or direct visits",
    },
    {
      title: "Discovery",
      description: "Categories, search, filters and collections",
    },
    {
      title: "Product",
      description: "Evaluation and purchase decision",
    },
    {
      title: "Cart",
      description: "Review and confidence before checkout",
    },
    {
      title: "Checkout",
      description: "Complete the transaction",
    },
    {
      title: "Confirmation",
      description: "Clear next steps after purchase",
    },
    {
      title: "Return / support",
      description: "Order information and help when needed",
    },
  ],
  postPurchase: {
    title: "Post-Purchase Clarity Still Matters",
    body: "After purchase, shoppers need clear confirmation and access to useful next steps — without turning the page into retention marketing consultancy.",
    items: [
      "Clear confirmation",
      "Expected next steps",
      "Order information",
      "Support and contact access",
      "Account information where relevant",
    ],
  },
  priorityFramework: [
    {
      title: "Find",
      description: "Can customers find products?",
    },
    {
      title: "Understand",
      description: "Can they evaluate them?",
    },
    {
      title: "Trust",
      description: "Are key concerns answered?",
    },
    {
      title: "Buy",
      description: "Can they complete the transaction?",
    },
    {
      title: "Measure",
      description: "Can the journey be evaluated?",
    },
    {
      title: "Improve",
      description: "Can the store evolve from evidence?",
    },
  ],
  diagnoseNote:
    "Smartlance reviews the commerce system — discovery, product experience, trust, cart, checkout, performance, SEO, analytics and platform — before recommending a targeted fix, redesign or migration.",
  freeReviewPrompt:
    "Not sure whether the main issue is traffic, product discovery, conversion, performance or the platform?",
  relatedWorkAvailable: false,
  relatedWorkHeading: "Related Website Work",
};

/** Local business visibility / local-discovery solution narrative */
export type LocalVisibilitySolutionPageContent = {
  kind: "local-visibility";
  slug: string;
  corePrinciple: {
    title: string;
    body: string;
    surfaces: string[];
    reinforce: string[];
  };
  journeyIntro: string;
  journeyStages: VisibilityStage[];
  visibilitySystem: {
    intro: string;
    stages: VisibilityStage[];
  };
  whatLocalMeans: {
    intro: string;
    models: { title: string; description: string; examples: string[] }[];
  };
  searchPatterns: {
    title: string;
    body: string;
    patterns: string[];
  };
  gbp: {
    title: string;
    body: string;
    areas: string[];
    avoid: string[];
  };
  profileAccuracy: {
    title: string;
    body: string;
    avoid: string[];
  };
  websiteLocation: {
    title: string;
    body: string;
    shouldUnderstand: string[];
    closing: string;
  };
  serviceLocation: {
    title: string;
    body: string;
    good: string;
    bad: string;
  };
  thinPages: {
    title: string;
    body: string;
    whenUseful: string[];
  };
  serviceArea: {
    title: string;
    body: string;
    useful: string[];
    closing: string;
  };
  consistency: {
    title: string;
    body: string;
    places: string[];
    closing: string;
  };
  reviews: {
    title: string;
    body: string;
    helpWith: string[];
    avoid: string[];
    requests: string;
  };
  foundFirstStep: {
    title: string;
    body: string;
    lookFor: string[];
  };
  contactActions: {
    title: string;
    body: string;
    actions: string[];
  };
  mobile: {
    title: string;
    body: string;
    behaviours: string[];
    usefulActions: string[];
    closing: string;
  };
  localPlusWebsiteSeo: {
    title: string;
    body: string;
    foundations: string[];
  };
  schema: {
    title: string;
    body: string;
    canHelp: string[];
    closing: string;
  };
  localContent: {
    title: string;
    body: string;
    useful: string[];
    avoid: string[];
  };
  proof: {
    title: string;
    body: string;
    examples: string[];
  };
  multipleLocations: {
    title: string;
    body: string;
    mayNeed: string[];
    closing: string;
  };
  locationVsServiceArea: {
    intro: string;
    physical: ContrastColumn;
    serviceArea: ContrastColumn;
  };
  competitors: {
    title: string;
    body: string;
    reasons: string[];
    closing: string;
  };
  proximity: {
    title: string;
    body: string;
  };
  localVsOrganic: {
    intro: string;
    local: ContrastColumn;
    organic: ContrastColumn;
  };
  measurement: {
    title: string;
    body: string;
    metrics: string[];
    closing: string;
  };
  profileVsWebsite: {
    intro: string;
    profile: ContrastColumn;
    website: ContrastColumn;
    both: string;
  };
  needLocalSeo: {
    title: string;
    body: string;
    depends: string[];
  };
  diagnosticFramework: VisibilityStage[];
  redesignLevels: DecisionLevel[];
  diagnoseNote: string;
  freeReviewPrompt: string;
  industriesNote: string;
  relatedWorkHeading: string;
  ecosystemLabels: string[];
};

export const localBusinessVisibilityPage: LocalVisibilitySolutionPageContent = {
  kind: "local-visibility",
  slug: "local-business-visibility",
  corePrinciple: {
    title: "Local Visibility Is More Than Ranking a Website.",
    body: "A nearby customer may encounter the business through several surfaces. The experience should reinforce what the business does, where it operates, whether it is credible, and how to contact or visit.",
    surfaces: [
      "Search results",
      "Google Business Profile",
      "Map or local results",
      "Website",
      "Reviews",
      "Directories",
      "Social or business references",
      "Direct brand search",
    ],
    reinforce: [
      "What the business does",
      "Where it operates",
      "Whether it is credible",
      "How to contact or visit",
    ],
  },
  journeyIntro:
    "Local discovery is a journey from search to action — not a single ranking position.",
  journeyStages: [
    {
      title: "Search",
      description:
        "Someone looks for a service, product or business nearby.",
    },
    {
      title: "Discover",
      description: "The business appears somewhere useful.",
    },
    {
      title: "Verify",
      description:
        "They check location, services, reviews, website, photos and business information.",
    },
    {
      title: "Visit",
      description:
        "They visit the website, profile or location information.",
    },
    {
      title: "Contact",
      description:
        "They call, book, request a quote, get directions or submit an enquiry.",
    },
  ],
  visibilitySystem: {
    intro:
      "Local SEO and website conversion connect through a simple system: relevance, location, trust, experience and action.",
    stages: [
      {
        title: "Relevance",
        description: "What does the business offer?",
      },
      {
        title: "Location",
        description: "Where does it operate?",
      },
      {
        title: "Trust",
        description: "Does the information look credible and consistent?",
      },
      {
        title: "Experience",
        description: "Can the customer quickly find what they need?",
      },
      {
        title: "Action",
        description: "Can they call, book, visit or enquire easily?",
      },
    ],
  },
  whatLocalMeans: {
    intro:
      "“Local” does not mean the same thing for every business. The website and profile should match how customers actually reach you.",
    models: [
      {
        title: "Physical location",
        description: "Customers visit the business.",
        examples: ["Restaurant", "Salon", "Clinic", "Shop"],
      },
      {
        title: "Service area",
        description: "The business travels to customers.",
        examples: ["Contractor", "Repair service", "Cleaning company"],
      },
      {
        title: "Hybrid",
        description:
          "The business may serve people both on-site and across a wider area.",
        examples: ["Professional practice", "Training provider", "Hospitality"],
      },
    ],
  },
  searchPatterns: {
    title: "Local Search Is Not Just “Near Me”",
    body: "People may search in several ways — or rely on device location without naming the place at all.",
    patterns: [
      "Service + city",
      "Service + neighbourhood",
      "Service + area",
      "Business type + location",
      "Specific problem + location",
      "Device location without naming the place",
    ],
  },
  gbp: {
    title: "Your Google Business Profile and Website Should Support Each Other.",
    body: "An accurate profile helps nearby customers discover and verify the business. It should work with the website — not fight it with conflicting details.",
    areas: [
      "Business name",
      "Primary and secondary categories where appropriate",
      "Address or service area",
      "Phone",
      "Website",
      "Hours",
      "Services",
      "Photos",
      "Business information",
      "Reviews",
      "Updates where useful",
    ],
    avoid: [
      "Keyword-stuffed business names",
      "Fake locations",
      "Deceptive virtual offices",
      "Bought reviews",
      "Multiple profiles to manipulate visibility",
    ],
  },
  profileAccuracy: {
    title: "Business Information Should Reflect Reality",
    body: "Smartlance favours accurate local information. Profiles and listings should describe the real business — not an invented version designed only for search.",
    avoid: [
      "Fake branches",
      "Fake addresses",
      "Duplicate profiles",
      "Misleading service areas",
      "Keyword-stuffed business names",
    ],
  },
  websiteLocation: {
    title: "Can the Website Clearly Explain Where You Work?",
    body: "A visitor should be able to understand location and coverage without guessing.",
    shouldUnderstand: [
      "Where the business is based, when relevant",
      "Which areas are genuinely served",
      "Whether customers visit the business or the business travels to them",
      "How to contact or visit",
    ],
    closing:
      "Do not repeat city names unnaturally across every paragraph. Clear, useful location context is enough.",
  },
  serviceLocation: {
    title: "Useful Local Pages Connect What, Where and Why",
    body: "A meaningful page connects a real service with a genuinely served location and useful business-specific information.",
    good: "A meaningful page about a real service in a genuinely served location.",
    bad: "Dozens of city pages containing the same text with the place name swapped.",
  },
  thinPages: {
    title: "More Location Pages Do Not Automatically Mean More Local Visibility.",
    body: "Mass-producing near-identical city, town or neighbourhood pages can create a poor user experience and weak content architecture. A location page should exist when there is a legitimate reason to serve that place with useful unique information.",
    whenUseful: [
      "Real office, store or venue",
      "Meaningful service area",
      "Different availability or services",
      "Local project or work examples",
      "Location-specific process",
      "Location-specific practical information",
      "Real customer questions",
    ],
  },
  serviceArea: {
    title: "Service-Area Businesses Need Honest Coverage Information",
    body: "If the business travels to customers, the website should make coverage and contact clear — without inventing offices.",
    useful: [
      "Service areas",
      "Travel or coverage limitations",
      "Services offered",
      "Contact process",
      "Availability context where appropriate",
      "Proof of real work",
      "FAQs",
    ],
    closing: "Do not create fake offices for ranking purposes.",
  },
  consistency: {
    title: "Business Information Should Stay Consistent",
    body: "Name, address and phone details — often called NAP in local SEO — should match across the places customers and search engines check.",
    places: [
      "Website",
      "Google profile",
      "Relevant business directories",
      "Social profiles",
      "Industry directories",
    ],
    closing:
      "Prefer relevant, credible and accurate listings over submitting the business to hundreds of low-quality directories.",
  },
  reviews: {
    title: "Reviews Are Part of the Trust Journey.",
    body: "Genuine reviews can help customers evaluate the business. They do not guarantee rankings, and manipulated reviews undermine trust.",
    helpWith: ["Quality", "Reliability", "Service", "Experience"],
    avoid: [
      "Buying reviews",
      "Fake reviews",
      "Review swaps",
      "Review gating",
      "Incentives for positive-only reviews",
      "Suppressing legitimate negative feedback",
    ],
    requests:
      "Businesses can make it easier for real customers to leave honest feedback — without trying to manipulate rating outcomes.",
  },
  foundFirstStep: {
    title: "Getting Found Is Only the First Step.",
    body: "Once customers reach the site they still need enough clarity to choose and act.",
    lookFor: [
      "Services",
      "Location",
      "Hours",
      "Pricing context",
      "Work",
      "Testimonials",
      "Contact",
      "Booking",
      "Directions",
      "FAQs",
      "Policies where relevant",
    ],
  },
  contactActions: {
    title: "The Most Important Action Depends on the Business",
    body: "Local businesses convert through different actions. Do not force every business into the same enquiry form.",
    actions: [
      "Call",
      "Book",
      "Get directions",
      "Request a quote",
      "Message or enquire",
      "Visit",
    ],
  },
  mobile: {
    title: "Local Searches Often Lead to Immediate Actions.",
    body: "Someone searching locally may need information quickly. Mobile should make critical details easy to reach — without five competing sticky buttons.",
    behaviours: [
      "Walking nearby",
      "In a car before stopping",
      "Looking for today’s hours",
      "Trying to call",
      "Checking availability",
      "Looking for directions",
      "Comparing businesses quickly",
    ],
    usefulActions: [
      "Tap-to-call",
      "Directions",
      "Booking",
      "Availability",
      "Contact",
      "Hours",
    ],
    closing: "Use hierarchy. Not every action needs equal prominence.",
  },
  localPlusWebsiteSeo: {
    title: "Local SEO Still Depends on a Useful Website.",
    body: "A strong profile cannot compensate for every website problem. Local visibility and website foundations work together.",
    foundations: [
      "Clear service pages",
      "Logical architecture",
      "Crawlable content",
      "Mobile usability",
      "Performance",
      "Internal links",
      "Location context",
      "Structured data where appropriate",
    ],
  },
  schema: {
    title: "Structured Business Information Can Help Machines Understand You",
    body: "Appropriate structured data can help systems understand business type, contact and location information, and hours where relevant. It does not automatically improve rankings.",
    canHelp: [
      "Business type",
      "Contact and location information",
      "Hours where relevant",
    ],
    closing: "Do not fabricate business data for structured markup.",
  },
  localContent: {
    title: "Local Content Should Be Useful, Not Decorative.",
    body: "Useful local content answers real questions. Generic “Welcome to our service in [city]” pages rarely help.",
    useful: [
      "Service-area guidance",
      "Real local project examples",
      "Location-specific FAQs",
      "Local policies or process",
      "Real photos",
      "Directions or access information",
      "Local case studies",
      "Destination context for hospitality where relevant",
    ],
    avoid: [
      "Generic city welcome pages",
      "Near-identical neighbourhood pages",
      "Doorway pages created only to funnel traffic",
    ],
  },
  proof: {
    title: "Real Work Strengthens Credibility",
    body: "Verified examples of real work can help nearby customers trust the business — without inventing local projects.",
    examples: [
      "Completed project",
      "Property",
      "Venue",
      "Service result",
      "Case study",
      "Testimonial with location context where verified",
    ],
  },
  multipleLocations: {
    title: "What If the Business Has Multiple Locations?",
    body: "Each genuine location may need accurate information and clear presentation. Do not create duplicate content for each location.",
    mayNeed: [
      "Accurate information",
      "Unique contact details where applicable",
      "Hours",
      "Services",
      "Location page",
      "Directions or context",
      "Profile management",
    ],
    closing:
      "Physical locations and service areas should not be blurred merely for SEO.",
  },
  locationVsServiceArea: {
    intro:
      "Keep the distinction honest. A storefront customers can visit is not the same as a service area covered without one.",
    physical: {
      title: "Physical locations",
      description: "Real places customers can visit.",
      areas: [
        "Accurate address",
        "Hours",
        "Directions",
        "On-site services",
      ],
    },
    serviceArea: {
      title: "Service areas",
      description: "Places genuinely served without a storefront.",
      areas: [
        "Coverage clarity",
        "Travel limitations",
        "Contact process",
        "No fake offices",
      ],
    },
  },
  competitors: {
    title: "Why Do Competitors Appear When You Don’t?",
    body: "There may be multiple reasons. Smartlance cannot determine the cause without analysis — and local rankings are not reduced to one metric.",
    reasons: [
      "Stronger relevance",
      "Better local information",
      "More established visibility",
      "Better reviews or reputation",
      "Better website content",
      "Proximity or context",
      "More useful business profiles",
      "Stronger authority",
    ],
    closing:
      "A business cannot optimise away the physical reality of where a searcher is relative to relevant businesses. Local results can vary by location and context.",
  },
  proximity: {
    title: "Proximity Still Matters",
    body: "Local results can change based on where the searcher is. Do not expect promises such as “#1 across the entire city” — that is not how local discovery works.",
  },
  localVsOrganic: {
    intro:
      "A business may need both local presence and organic website visibility.",
    local: {
      title: "Local presence",
      description:
        "Business profile and map-oriented discovery that helps nearby customers find you.",
      areas: [
        "Google Business Profile",
        "Map or local results",
        "Consistent business information",
      ],
    },
    organic: {
      title: "Organic website visibility",
      description:
        "Normal search results from useful website pages about services and locations.",
      areas: [
        "Service pages",
        "Useful location content",
        "Technical SEO foundations",
      ],
    },
  },
  measurement: {
    title: "What Should a Local Business Measure?",
    body: "Useful measurement depends on the business. Not every action can be measured perfectly.",
    metrics: [
      "Calls",
      "Form submissions",
      "Bookings",
      "Directions interactions where data is available",
      "Website clicks",
      "Important service-page visits",
      "Email clicks",
      "Appointments",
    ],
    closing:
      "Analytics should measure useful actions — not collect unnecessary personal data or expose sensitive customer information.",
  },
  profileVsWebsite: {
    intro:
      "Local visibility problems often sit in the profile, the website, or both. Diagnosis should separate the surfaces before recommending a fix.",
    profile: {
      title: "Profile / local presence",
      description: "Issues in how the business appears in local discovery.",
      areas: [
        "Incorrect information",
        "Poor categories",
        "Missing details",
        "Weak review or reputation signals",
        "Duplicate profiles",
      ],
    },
    website: {
      title: "Website",
      description: "Issues that limit relevance, clarity or action after discovery.",
      areas: [
        "Weak service content",
        "Unclear locations",
        "Technical SEO",
        "Poor mobile UX",
        "Slow performance",
        "Weak internal structure",
      ],
    },
    both: "Many businesses require coordinated improvement across profile and website.",
  },
  needLocalSeo: {
    title: "Does Every Local Business Need the Same Local SEO Strategy?",
    body: "No. Strategy depends on how the business works and how customers search — not a universal checklist disguised as strategy.",
    depends: [
      "Business model",
      "Locations",
      "Service area",
      "Competition",
      "Customer behaviour",
      "Website",
      "Search demand",
      "Profile presence",
    ],
  },
  diagnosticFramework: [
    {
      title: "Can they find you?",
      description: "Does the business appear for useful local searches?",
    },
    {
      title: "Can they verify you?",
      description: "Is information consistent, credible and clear?",
    },
    {
      title: "Can they understand what you offer?",
      description: "Are services and fit easy to grasp?",
    },
    {
      title: "Can they confirm you serve them?",
      description: "Is location or coverage unambiguous?",
    },
    {
      title: "Can they contact, visit or book?",
      description: "Is the next step obvious on mobile and desktop?",
    },
  ],
  redesignLevels: [
    {
      title: "Local presence improvement",
      description:
        "Profile, information or reputation work may be the main issue.",
      items: [
        "Google Business Profile",
        "Accurate business information",
        "Reviews and reputation",
        "Directory consistency",
      ],
    },
    {
      title: "Website improvement",
      description:
        "Service, location, contact, mobile or technical foundations need work.",
      items: [
        "Service and location content",
        "Contact paths",
        "Mobile UX",
        "Technical SEO",
        "Performance",
      ],
    },
    {
      title: "Broader redesign",
      description:
        "Current site structure and experience significantly limit local discovery and conversion.",
      items: [
        "Structure",
        "Experience",
        "Content architecture",
        "Conversion paths",
      ],
    },
  ],
  diagnoseNote:
    "Smartlance reviews business model, locations, Google Business Profile, website structure, service pages, mobile experience, reputation signals and contact journeys before recommending a local visibility fix.",
  freeReviewPrompt:
    "Not sure whether the main problem is your local presence, the website or both?",
  industriesNote:
    "Local visibility matters across many business types — from hospitality and real estate to restaurants, home services, healthcare, beauty and professional services. Explore how Smartlance approaches different industries.",
  relatedWorkHeading: "Related Website Work",
  ecosystemLabels: [
    "Search",
    "Business profile",
    "Website",
    "Reviews / business information",
    "Customer action",
  ],
};

export type SolutionPageContent =
  | LeadsSolutionPageContent
  | RankingSolutionPageContent
  | PerformanceSolutionPageContent
  | OutdatedSolutionPageContent
  | ConversionsSolutionPageContent
  | MigrationSolutionPageContent
  | NewBusinessSolutionPageContent
  | EcommerceGrowthSolutionPageContent
  | LocalVisibilitySolutionPageContent;

export const solutionPageContentBySlug: Record<string, SolutionPageContent> = {
  [websiteNotGeneratingLeadsPage.slug]: websiteNotGeneratingLeadsPage,
  [websiteNotRankingPage.slug]: websiteNotRankingPage,
  [slowWebsitePage.slug]: slowWebsitePage,
  [outdatedWebsitePage.slug]: outdatedWebsitePage,
  [lowWebsiteConversionsPage.slug]: lowWebsiteConversionsPage,
  [websiteMigrationPage.slug]: websiteMigrationPage,
  [newBusinessWebsitePage.slug]: newBusinessWebsitePage,
  [ecommerceGrowthPage.slug]: ecommerceGrowthPage,
  [localBusinessVisibilityPage.slug]: localBusinessVisibilityPage,
};

export function getSolutionPageContent(slug: string) {
  return solutionPageContentBySlug[slug];
}

export function isLeadsSolutionContent(
  content: SolutionPageContent,
): content is LeadsSolutionPageContent {
  return content.kind === "leads";
}

export function isRankingSolutionContent(
  content: SolutionPageContent,
): content is RankingSolutionPageContent {
  return content.kind === "ranking";
}

export function isPerformanceSolutionContent(
  content: SolutionPageContent,
): content is PerformanceSolutionPageContent {
  return content.kind === "performance";
}

export function isOutdatedSolutionContent(
  content: SolutionPageContent,
): content is OutdatedSolutionPageContent {
  return content.kind === "outdated";
}

export function isConversionsSolutionContent(
  content: SolutionPageContent,
): content is ConversionsSolutionPageContent {
  return content.kind === "conversions";
}

export function isMigrationSolutionContent(
  content: SolutionPageContent,
): content is MigrationSolutionPageContent {
  return content.kind === "migration";
}

export function isNewBusinessSolutionContent(
  content: SolutionPageContent,
): content is NewBusinessSolutionPageContent {
  return content.kind === "new-business";
}

export function isEcommerceGrowthSolutionContent(
  content: SolutionPageContent,
): content is EcommerceGrowthSolutionPageContent {
  return content.kind === "ecommerce";
}

export function isLocalVisibilitySolutionContent(
  content: SolutionPageContent,
): content is LocalVisibilitySolutionPageContent {
  return content.kind === "local-visibility";
}
