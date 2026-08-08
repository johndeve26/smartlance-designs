import type { Service } from "@/types";

/**
 * Expanded service catalogue entries (2026).
 * Distinct intents — do not duplicate Website Design, Technical SEO, CRO, etc.
 */
export const additionalServices: Service[] = [
  {
    slug: "website-strategy",
    title: "Website Strategy",
    href: "/services/website-strategy",
    category: "design",
    group: "websites",
    summary:
      "Plan structure, content and conversion journeys before design or development begins.",
    description:
      "Website Strategy defines what the site needs to achieve, who it must serve and how pages should be organised — so design and development start from a clear plan rather than guesswork.",
    tagline:
      "Plan the structure, content and conversion journey before the website is designed or built.",
    visualVariant: "strategy",
    audience:
      "Businesses planning a new website, redesign or major content restructure",
    icon: "layers",
    featured: true,
    capabilities: [
      {
        title: "Business & Audience Goals",
        description:
          "Clarify what success looks like and who the website must persuade.",
        icon: "target",
      },
      {
        title: "Sitemap & Information Architecture",
        description:
          "Organise pages so visitors and search engines can find what matters.",
        icon: "layers",
      },
      {
        title: "User Journeys & Conversion Paths",
        description:
          "Map how people move from discovery to enquiry, booking or purchase.",
        icon: "mouse-pointer-click",
      },
      {
        title: "Content Priorities",
        description:
          "Decide which messages, proof and pages need to exist first.",
        icon: "file-text",
      },
      {
        title: "SEO & Platform Recommendations",
        description:
          "Plan structure and platform choices with discoverability and maintainability in mind.",
        icon: "search",
      },
    ],
    narrativeTitle: "Decide What to Build Before You Design It",
    narrative:
      "Many website projects jump straight into visuals. That often produces polished pages that still confuse visitors or miss the actions that matter. Strategy work defines goals, audience, sitemap, content priorities and conversion paths first — so design and development execute a clear plan.",
    seoConnection:
      "Page planning and information architecture shape how search engines understand your site. Strategy includes SEO considerations such as topic coverage, URL structure and content priorities — without replacing a full technical SEO engagement.",
    problems: [
      "You are unsure what pages the website actually needs",
      "Stakeholders disagree on priorities before design starts",
      "Previous redesigns looked better but still underperformed",
      "Content exists, but the structure does not support conversion",
      "SEO and conversion were never planned into the sitemap",
    ],
    deliverables: [
      "Website goals and success criteria",
      "Audience and journey overview",
      "Recommended sitemap / IA",
      "Page and content priorities",
      "Conversion-path recommendations",
      "Platform and next-step guidance",
    ],
    idealFor: [
      "You are planning a new website or major redesign",
      "The current site feels disorganised or incomplete",
      "You need alignment before commissioning design",
      "You want SEO and conversion considered in the structure",
      "You need a clear brief for design and development",
    ],
    process: [
      {
        title: "Discover",
        description: "Review business goals, audience, offer and current site.",
      },
      {
        title: "Prioritize",
        description: "Define objectives, content needs and conversion actions.",
      },
      {
        title: "Structure",
        description: "Map sitemap, journeys and page responsibilities.",
      },
      {
        title: "Recommend",
        description: "Document the plan and the right next implementation step.",
      },
    ],
    faqs: [
      {
        question: "Do I need strategy before redesigning?",
        answer:
          "If the current site is confusing, incomplete or unclear on goals, strategy first usually saves time and budget. If scope is already tightly defined, we can move more quickly into design.",
      },
      {
        question: "What do I receive?",
        answer:
          "A practical plan covering goals, audience, recommended structure, content priorities and conversion paths — enough for design and development to proceed with clarity.",
      },
      {
        question: "Can you work with an existing site?",
        answer:
          "Yes. Strategy often starts with reviewing what already exists, what to keep and what needs restructuring.",
      },
      {
        question: "Is this the same as Website Design?",
        answer:
          "No. Strategy answers what to build and how it should be structured. Website Design answers how the experience should look and feel.",
      },
      {
        question: "Does strategy include SEO?",
        answer:
          "It includes SEO considerations that affect structure and content priorities. Detailed technical SEO or ongoing SEO programmes are separate services.",
      },
    ],
    relatedServiceSlugs: [
      "website-design",
      "website-development",
      "conversion-rate-optimization",
      "website-audit",
    ],
    relatedSeoSlugs: ["on-page-seo"],
    ctaTitle: "Need Clarity Before You Redesign or Rebuild?",
    ctaDescription:
      "Tell us about your business and current website. We will help define the structure and priorities that should guide design and development.",
    metaTitle: "Website Strategy Services",
    metaDescription:
      "Website strategy for businesses that need clear goals, sitemap, content priorities and conversion journeys before design or development begins.",
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    href: "/services/ui-ux-design",
    category: "design",
    group: "websites",
    summary:
      "Clear digital experiences designed around how people browse, understand and take action.",
    description:
      "UI/UX Design focuses on information architecture, user flows, wireframes, interface design and usability — so visitors can move through your website without friction.",
    tagline:
      "Clear digital experiences designed around how people actually browse, understand and take action.",
    visualVariant: "uiux",
    audience:
      "Teams that need deeper interface and usability work beyond a visual refresh",
    icon: "layout-template",
    capabilities: [
      {
        title: "User Flows & Wireframes",
        description:
          "Map journeys and low-fidelity layouts before polishing the interface.",
        icon: "layers",
      },
      {
        title: "Interface Design",
        description:
          "Design screens that are clear, consistent and conversion-aware.",
        icon: "palette",
      },
      {
        title: "Responsive & Interaction Design",
        description:
          "Plan usable layouts and interactions across devices.",
        icon: "smartphone",
      },
      {
        title: "Usability Improvements",
        description:
          "Reduce confusion in navigation, forms, CTAs and key journeys.",
        icon: "mouse-pointer-click",
      },
      {
        title: "Design System Foundations",
        description:
          "Reusable components and patterns for consistent future pages.",
        icon: "settings",
      },
    ],
    narrativeTitle: "Design the Experience People Move Through",
    narrative:
      "Website Design covers the broader visual and website presentation. UI/UX Design goes deeper into how people navigate, scan, interact and complete actions. The work focuses on flows, wireframes, interface clarity and usability — so the experience is easier to use, not just nicer to look at.",
    seoConnection:
      "Clear hierarchy, readable structure and sensible journeys support both users and search engines. UI/UX decisions often improve on-page clarity that SEO depends on.",
    problems: [
      "Visitors get lost between pages",
      "Forms and booking flows create drop-off",
      "The interface looks fine but feels hard to use",
      "Mobile journeys are awkward or incomplete",
      "Designers and developers lack a shared interaction plan",
    ],
    deliverables: [
      "User-flow mapping for key journeys",
      "Wireframes for priority screens",
      "High-fidelity UI designs",
      "Responsive layout planning",
      "Interaction and usability recommendations",
      "Component / design-system foundations where useful",
    ],
    idealFor: [
      "You need wireframes before visual polish",
      "Conversion paths feel confusing",
      "You are building a more complex multi-page experience",
      "You need reusable UI patterns across the site",
      "Usability issues remain after a visual redesign",
    ],
    process: [
      {
        title: "Map",
        description: "Clarify journeys, tasks and friction points.",
      },
      {
        title: "Wireframe",
        description: "Shape structure and hierarchy without premature polish.",
      },
      {
        title: "Design",
        description: "Create clear interface designs for key screens.",
      },
      {
        title: "Refine",
        description: "Improve usability, consistency and handoff readiness.",
      },
    ],
    faqs: [
      {
        question: "How is UI/UX different from Website Design?",
        answer:
          "Website Design focuses on the overall visual website experience. UI/UX Design goes deeper into flows, wireframes, interface behaviour and usability.",
      },
      {
        question: "Do you always start with wireframes?",
        answer:
          "For complex journeys or redesigns, yes. For simpler marketing sites, we may move more quickly while still defining structure and hierarchy.",
      },
      {
        question: "Can UI/UX support an existing product or website?",
        answer:
          "Yes. We can improve specific journeys — such as enquiry, booking or product discovery — without redesigning every page.",
      },
      {
        question: "Do you deliver prototypes?",
        answer:
          "Where useful, yes — especially for validating flows before development. Scope depends on the project.",
      },
      {
        question: "Does this include branding?",
        answer:
          "UI/UX can apply an existing brand system. Full brand identity work is a separate Branding service when needed.",
      },
    ],
    relatedServiceSlugs: [
      "website-design",
      "landing-page-design",
      "conversion-rate-optimization",
      "website-development",
    ],
    relatedSeoSlugs: ["on-page-seo"],
    ctaTitle: "Need a Clearer Interface and Journey?",
    ctaDescription:
      "Tell us where visitors get stuck. We will recommend whether UX, redesign, development or conversion work is the right next step.",
    metaTitle: "UI/UX Design Services",
    metaDescription:
      "UI/UX design for websites — user flows, wireframes, interface design and usability focused on clarity and conversion.",
  },
  {
    slug: "website-performance-optimization",
    title: "Website Performance Optimization",
    shortTitle: "Website Performance",
    href: "/services/website-performance-optimization",
    category: "development",
    group: "seo-growth",
    navigationFeatured: true,
    summary:
      "Make your website faster, smoother and easier to use across devices.",
    description:
      "Website Performance Optimization improves page speed, Core Web Vitals, media loading, frontend efficiency and mobile responsiveness — so visitors experience a site that feels quick and reliable.",
    tagline: "Make your website faster, smoother and easier to use across devices.",
    visualVariant: "performance",
    audience:
      "Businesses with slow pages, weak Core Web Vitals or heavy frontend performance issues",
    icon: "gauge",
    featured: true,
    capabilities: [
      {
        title: "Page Speed & Core Web Vitals",
        description:
          "Diagnose and improve loading, interactivity and visual stability.",
        icon: "gauge",
      },
      {
        title: "Image & Asset Optimization",
        description:
          "Reduce weight from images, fonts and unnecessary assets.",
        icon: "zap",
      },
      {
        title: "Frontend Efficiency",
        description:
          "Reduce JavaScript bloat, improve rendering and cut layout shift.",
        icon: "code",
      },
      {
        title: "Caching & Delivery Foundations",
        description:
          "Improve caching, delivery patterns and mobile performance basics.",
        icon: "settings",
      },
      {
        title: "Measurement & Validation",
        description:
          "Check results with practical tools — without chasing vanity scores.",
        icon: "clipboard-check",
      },
    ],
    narrativeTitle: "Speed Is Part of Usability and Trust",
    narrative:
      "Slow pages frustrate visitors and can undermine both conversion and search performance. Performance work focuses on what users feel — load time, responsiveness and stability — while connecting to Technical SEO, development and maintenance where those issues overlap.",
    seoConnection:
      "Performance and Core Web Vitals matter for user experience and can influence search outcomes. This service focuses on making the site faster for people. Technical SEO covers crawlability, indexability and broader search infrastructure.",
    problems: [
      "Pages feel slow on mobile",
      "Core Web Vitals need improvement",
      "Large images or scripts are weighing the site down",
      "Layout shifts make the experience feel unstable",
      "A redesign or migration introduced performance regressions",
    ],
    deliverables: [
      "Performance diagnosis and priority list",
      "Image and media optimization plan",
      "Frontend / asset recommendations",
      "Core Web Vitals-focused improvements",
      "Caching and delivery guidance where applicable",
      "Before/after validation notes",
    ],
    idealFor: [
      "Your site feels slow on real devices",
      "Search Console flags Core Web Vitals issues",
      "You are preparing a redesign or migration",
      "Paid or organic traffic is landing on sluggish pages",
      "You need performance work without a full rebuild",
    ],
    process: [
      {
        title: "Measure",
        description: "Review real-user and lab signals for key templates.",
      },
      {
        title: "Prioritize",
        description: "Identify the highest-impact performance bottlenecks.",
      },
      {
        title: "Optimize",
        description: "Implement improvements across assets, code and delivery.",
      },
      {
        title: "Validate",
        description: "Recheck key pages and document remaining recommendations.",
      },
    ],
    faqs: [
      {
        question: "Will this improve my Google rankings?",
        answer:
          "Faster pages can support better user experience and may help search performance, but rankings depend on many factors. We do not promise ranking improvements from performance work alone.",
      },
      {
        question: "Can you optimize an existing site?",
        answer:
          "Yes. Most performance engagements improve an existing website rather than starting from scratch.",
      },
      {
        question: "What are Core Web Vitals?",
        answer:
          "They are Google metrics related to loading, interactivity and visual stability. We use them as practical signals — not as the only definition of a good experience.",
      },
      {
        question: "Do you guarantee perfect Lighthouse scores?",
        answer:
          "No. Scores are useful diagnostics, but real-user experience and business priorities matter more than chasing a perfect number.",
      },
      {
        question: "How is this different from Technical SEO?",
        answer:
          "Performance Optimization focuses on making the site faster and smoother for users. Technical SEO focuses on whether search engines can crawl, understand and index the site effectively. The two often work together.",
      },
    ],
    relatedServiceSlugs: [
      "website-development",
      "website-maintenance",
      "website-redesign",
      "website-migration",
    ],
    relatedSeoSlugs: ["technical-seo"],
    relatedPlatformSlugs: ["wordpress", "shopify", "woocommerce", "bigcommerce"],
    ctaTitle: "Is Your Website Slower Than It Should Be?",
    ctaDescription:
      "Share your URL and the pages that matter most. We will help identify practical performance improvements.",
    metaTitle: "Website Performance Optimization",
    metaDescription:
      "Website performance optimization for page speed, Core Web Vitals, media and frontend efficiency — without guaranteed ranking promises.",
  },
  {
    slug: "website-audit",
    title: "Website Audit",
    href: "/services/website-audit",
    category: "growth",
    group: "conversion-measurement",
    navigationFeatured: true,
    summary:
      "Find what is limiting your website before spending money fixing the wrong things.",
    description:
      "A Website Audit reviews design, UX, SEO, performance, mobile usability, content structure and conversion paths — then prioritizes what to fix first. It is a professional assessment, not the Free Website Review lead magnet.",
    tagline:
      "Find what is limiting your website before spending money fixing the wrong things.",
    visualVariant: "audit",
    audience:
      "Businesses that need a prioritized diagnosis across design, SEO, performance and conversion",
    icon: "clipboard-check",
    featured: true,
    capabilities: [
      {
        title: "Design & UX Review",
        description:
          "Assess clarity, trust, navigation and usability across key pages.",
        icon: "layout-template",
      },
      {
        title: "SEO & Structure Check",
        description:
          "Review foundations that affect discoverability and page intent.",
        icon: "search",
      },
      {
        title: "Performance & Mobile",
        description:
          "Identify speed, responsiveness and mobile friction issues.",
        icon: "gauge",
      },
      {
        title: "Conversion Path Review",
        description:
          "Evaluate CTAs, forms, hierarchy and enquiry or booking journeys.",
        icon: "mouse-pointer-click",
      },
      {
        title: "Prioritized Recommendations",
        description:
          "Separate quick wins from larger redesign or development work.",
        icon: "clipboard-check",
      },
    ],
    narrativeTitle: "Diagnose Before You Rebuild",
    narrative:
      "The Free Website Review is a useful starting conversation. A full Website Audit goes deeper — reviewing design, UX, SEO, performance, content structure, conversion paths and analytics foundations, then prioritizing recommendations. An SEO Audit stays focused on search-specific issues. A Website Audit looks at the whole experience.",
    seoConnection:
      "SEO findings are part of the audit when relevant, but the scope is broader than search alone. For a search-specific deep dive, see the SEO Audit service.",
    problems: [
      "You do not know whether to redesign, optimize or rebuild",
      "Multiple issues exist and priorities are unclear",
      "Traffic is not converting and the cause is uncertain",
      "Previous fixes addressed symptoms rather than root problems",
      "Stakeholders need an evidence-based plan before investing",
    ],
    deliverables: [
      "Whole-site diagnostic across key areas",
      "Issue list with practical priority",
      "UX / conversion observations",
      "SEO and performance highlights",
      "Recommended next-step roadmap",
      "Clarification of free-review vs audit scope",
    ],
    idealFor: [
      "You need a serious assessment before a redesign budget",
      "The free review is not enough depth for your decisions",
      "Several teams disagree on what to fix first",
      "You want design, SEO and conversion reviewed together",
      "You need a roadmap rather than isolated tips",
    ],
    process: [
      {
        title: "Collect",
        description: "Review the site, goals, analytics access and key journeys.",
      },
      {
        title: "Evaluate",
        description: "Assess design, UX, SEO, performance and conversion paths.",
      },
      {
        title: "Prioritize",
        description: "Rank issues by impact and effort.",
      },
      {
        title: "Recommend",
        description: "Deliver a clear roadmap for what to do next.",
      },
    ],
    faqs: [
      {
        question: "How is this different from the Free Website Review?",
        answer:
          "The Free Website Review is a lead-generation starting point with practical observations. The Website Audit is a deeper paid professional assessment with broader coverage and prioritized recommendations.",
      },
      {
        question: "Do you fix the issues as part of the audit?",
        answer:
          "The audit diagnoses and prioritizes. Implementation can follow as redesign, development, SEO, performance or CRO work once priorities are clear.",
      },
      {
        question: "What does the audit include?",
        answer:
          "Typically design/UX, SEO foundations, performance, mobile usability, content structure, conversion paths and high-level analytics observations — scoped to your site and goals.",
      },
      {
        question: "How is this different from an SEO Audit?",
        answer:
          "An SEO Audit focuses on search: technical SEO, on-page, indexing and opportunities. A Website Audit covers the wider experience including design, UX, conversion and performance.",
      },
      {
        question: "Do you publish pricing on the page?",
        answer:
          "No. Scope varies by site size and complexity. We recommend the right depth after understanding your website and goals.",
      },
    ],
    relatedServiceSlugs: [
      "website-redesign",
      "website-performance-optimization",
      "conversion-rate-optimization",
      "website-strategy",
    ],
    relatedSeoSlugs: ["seo-audit"],
    ctaTitle: "Need a Detailed Website Assessment?",
    ctaDescription:
      "Need a quick starting point? Request a Free Website Review. Need a deeper prioritized diagnosis? Ask about a Website Audit.",
    primaryCtaLabel: "Ask About a Website Audit",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Get a Free Website Review",
    secondaryCtaHref: "/free-website-review",
    metaTitle: "Website Audit Services",
    metaDescription:
      "Professional website audit covering design, UX, SEO, performance and conversion — distinct from Smartlance’s Free Website Review.",
  },
  {
    slug: "seo-copywriting",
    title: "SEO Copywriting",
    href: "/services/seo-copywriting",
    category: "seo",
    group: "seo-growth",
    summary:
      "Website copy written to be clear to customers and useful to search engines.",
    description:
      "SEO Copywriting creates or rewrites website and landing-page content around clarity, search intent and conversion — not keyword stuffing or generic blog outsourcing.",
    tagline:
      "Website copy written to be clear to customers and useful to search engines.",
    visualVariant: "copywriting",
    audience:
      "Businesses that need stronger service-page, landing-page or website copy",
    icon: "pen-tool",
    capabilities: [
      {
        title: "Service & Landing Page Copy",
        description:
          "Write clear pages that explain the offer and invite action.",
        icon: "file-text",
      },
      {
        title: "Search Intent Alignment",
        description:
          "Match headings and content to what people are actually looking for.",
        icon: "search",
      },
      {
        title: "Page Rewrites",
        description:
          "Improve weak pages without losing brand voice or useful content.",
        icon: "refresh-cw",
      },
      {
        title: "Headings, Metadata & CTAs",
        description:
          "Strengthen page titles, descriptions, hierarchy and calls to action.",
        icon: "pen-tool",
      },
      {
        title: "Internal Linking Support",
        description:
          "Connect related pages so visitors and search engines can move usefully.",
        icon: "layers",
      },
    ],
    narrativeTitle: "Write for People First — With Search in Mind",
    narrative:
      "On-Page SEO optimizes the whole page around structure, relevance and technical on-page factors. SEO Copywriting focuses on creating or rewriting the words themselves — service pages, landing pages and key website copy that customers can understand and search engines can interpret.",
    seoConnection:
      "Copy and On-Page SEO work best together. We write with intent and clarity, then align headings, metadata and internal links as part of a coherent page.",
    problems: [
      "Service pages are thin or generic",
      "Landing pages do not explain the offer clearly",
      "Copy is keyword-heavy and hard to read",
      "CTAs and messaging feel weak",
      "Pages rank poorly because content does not match intent",
    ],
    deliverables: [
      "Website or landing-page copy drafts",
      "Heading structure recommendations",
      "Meta title and description suggestions",
      "CTA and messaging improvements",
      "Internal linking notes where useful",
      "Revision round based on agreed scope",
    ],
    idealFor: [
      "You need better service or landing-page copy",
      "Existing content is unclear or incomplete",
      "You are launching pages that need both clarity and SEO value",
      "A redesign needs stronger messaging, not just new visuals",
      "You want copy support without a full content marketing retainer",
    ],
    process: [
      {
        title: "Brief",
        description: "Confirm audience, offer, keywords/topics and page goals.",
      },
      {
        title: "Outline",
        description: "Structure headings and message order.",
      },
      {
        title: "Write",
        description: "Draft clear, conversion-minded copy.",
      },
      {
        title: "Refine",
        description: "Revise for voice, accuracy and on-page alignment.",
      },
    ],
    faqs: [
      {
        question: "Is this just blog writing?",
        answer:
          "No. The primary focus is website and landing-page content — service pages, key site copy and conversion-focused rewrites.",
      },
      {
        question: "How is this different from On-Page SEO?",
        answer:
          "SEO Copywriting creates or rewrites the content. On-Page SEO optimizes the broader page for search intent, structure, metadata and relevance. They often work together.",
      },
      {
        question: "Do you keyword stuff?",
        answer:
          "No. We write for clarity and intent. Forced keyword repetition usually hurts both readers and results.",
      },
      {
        question: "Can you rewrite existing pages?",
        answer:
          "Yes. Many engagements improve pages that already exist but underperform.",
      },
      {
        question: "Do you need access to keyword research?",
        answer:
          "Helpful when available. We can also work from your offer, audience and known search themes, then refine with research as needed.",
      },
    ],
    relatedServiceSlugs: [
      "landing-page-design",
      "website-design",
      "website-strategy",
    ],
    relatedSeoSlugs: ["on-page-seo"],
    ctaTitle: "Need Website Copy That Is Clear and Search-Aware?",
    ctaDescription:
      "Tell us which pages need work. We will recommend copy, on-page SEO or both.",
    metaTitle: "SEO Copywriting Services",
    metaDescription:
      "SEO copywriting for websites and landing pages — clear customer-facing content aligned with search intent and conversion.",
  },
  {
    slug: "analytics-conversion-tracking",
    title: "Analytics & Conversion Tracking",
    shortTitle: "Analytics & Tracking",
    href: "/services/analytics-conversion-tracking",
    category: "growth",
    group: "conversion-measurement",
    summary:
      "Know what visitors actually do on your website — and which actions matter.",
    description:
      "Analytics & Conversion Tracking sets up measurement foundations such as GA4, Tag Manager, Search Console connections and conversion events — so decisions are based on real behaviour rather than guesses.",
    tagline:
      "Know what visitors actually do on your website — and which actions matter.",
    visualVariant: "analytics",
    audience:
      "Businesses that need reliable tracking before CRO, marketing or redesign decisions",
    icon: "line-chart",
    capabilities: [
      {
        title: "GA4 & Tag Manager Setup",
        description:
          "Configure analytics foundations without exposing sensitive credentials in the website.",
        icon: "settings",
      },
      {
        title: "Conversion Events",
        description:
          "Track form submissions, CTA clicks, phone/email clicks and key actions.",
        icon: "mouse-pointer-click",
      },
      {
        title: "Search Console Foundations",
        description:
          "Connect search visibility signals to website measurement where useful.",
        icon: "search",
      },
      {
        title: "Funnel Measurement Basics",
        description:
          "Define the steps that matter from visit to enquiry, booking or purchase.",
        icon: "trending-up",
      },
      {
        title: "Reporting Foundations",
        description:
          "Create a practical view of what to monitor — not an enterprise BI programme.",
        icon: "line-chart",
      },
    ],
    narrativeTitle: "Measure Before You Optimize",
    narrative:
      "Conversion Rate Optimization improves the experience using evidence. Analytics & Conversion Tracking builds the measurement infrastructure that makes that evidence trustworthy — events, key actions and reporting foundations. Without tracking, CRO and marketing decisions stay speculative.",
    seoConnection:
      "Search Console and analytics together help show how search traffic behaves after it arrives. Tracking does not replace SEO strategy, but it informs priorities.",
    problems: [
      "You cannot tell which pages generate enquiries",
      "Forms submit but nothing is recorded reliably",
      "GA4 is installed but events are incomplete",
      "Marketing spend cannot be evaluated against outcomes",
      "CRO decisions lack trustworthy data",
    ],
    deliverables: [
      "Analytics / tag setup review or configuration",
      "Defined conversion events",
      "Key CTA and form tracking",
      "Search Console connection guidance where relevant",
      "Measurement plan for priority journeys",
      "Handover notes for your team",
    ],
    idealFor: [
      "You need clean conversion tracking before CRO",
      "GA4 or Tag Manager is incomplete",
      "You are launching a redesigned site and need continuity",
      "Campaigns cannot be evaluated properly",
      "Stakeholders need clearer reporting foundations",
    ],
    process: [
      {
        title: "Define",
        description: "Agree the actions that count as conversion.",
      },
      {
        title: "Implement",
        description: "Configure tags, events and key measurement points.",
      },
      {
        title: "Validate",
        description: "Test that events fire correctly.",
      },
      {
        title: "Handover",
        description: "Document what is tracked and how to monitor it.",
      },
    ],
    faqs: [
      {
        question: "Is this the same as CRO?",
        answer:
          "No. Analytics builds the measurement system. CRO uses behaviour and evidence to improve conversion. They work best together.",
      },
      {
        question: "Do you provide enterprise BI dashboards?",
        answer:
          "No. We focus on practical website analytics and conversion tracking foundations — not large-scale business intelligence programmes.",
      },
      {
        question: "Can you track phone and email clicks?",
        answer:
          "Yes, where those actions are important conversion signals for your business.",
      },
      {
        question: "Will you need access to our accounts?",
        answer:
          "Usually yes, with appropriate permissions. Credentials are handled carefully and never exposed in public website code or documentation.",
      },
      {
        question: "Do you support e-commerce events?",
        answer:
          "Where relevant, yes — product and purchase events can be included as part of the measurement plan.",
      },
    ],
    relatedServiceSlugs: [
      "conversion-rate-optimization",
      "digital-marketing",
      "website-audit",
      "website-development",
    ],
    relatedSeoSlugs: ["seo-audit"],
    relatedPlatformSlugs: ["hubspot-cms", "salesforce"],
    ctaTitle: "Unsure What Your Website Tracking Is Capturing?",
    ctaDescription:
      "Tell us which actions matter most. We will help put practical conversion tracking in place.",
    metaTitle: "Analytics & Conversion Tracking",
    metaDescription:
      "Analytics and conversion tracking setup for GA4, Tag Manager, events and funnel measurement foundations.",
  },
  {
    slug: "website-migration",
    title: "Website Migration",
    href: "/services/website-migration",
    category: "development",
    group: "websites",
    summary:
      "Move or rebuild your website while protecting the structure, content and search value that matter.",
    description:
      "Website Migration covers CMS or platform moves, redesign migrations, content transfer, redirects, metadata and launch checks — with a focus on reducing migration risk rather than promising zero SEO impact.",
    tagline:
      "Move or rebuild your website without losing the structure, content and search value that matters.",
    visualVariant: "migration",
    audience:
      "Businesses changing platform, redesigning or rebuilding an established website",
    icon: "refresh-cw",
    featured: true,
    capabilities: [
      {
        title: "URL Inventory & Redirect Mapping",
        description:
          "Preserve important URLs and plan redirects where addresses must change.",
        icon: "layers",
      },
      {
        title: "Content & Asset Migration",
        description:
          "Transfer pages, media and metadata with a clear QA process.",
        icon: "file-text",
      },
      {
        title: "SEO Preservation Planning",
        description:
          "Protect titles, canonicals, sitemaps and indexation signals where possible.",
        icon: "search",
      },
      {
        title: "Platform / CMS Moves",
        description:
          "Support migrations across WordPress, Shopify, BigCommerce and related setups.",
        icon: "code",
      },
      {
        title: "Launch QA",
        description:
          "Check redirects, forms, analytics continuity and critical journeys before go-live.",
        icon: "clipboard-check",
      },
    ],
    narrativeTitle: "Migrations Are Business Risks — Plan Them",
    narrative:
      "A redesign or platform change can improve the website — or quietly break rankings, bookmarks and conversions if URLs, redirects and content are mishandled. Migration work focuses on inventory, redirects, content transfer, metadata, analytics continuity and launch checks to reduce that risk.",
    seoConnection:
      "Technical SEO and migration planning overlap heavily around redirects, canonicals, sitemaps and indexation. We coordinate those concerns explicitly during rebuilds and platform moves.",
    platformsNote:
      "Migrations commonly involve WordPress, Shopify or BigCommerce — chosen based on content, commerce and operational needs.",
    problems: [
      "You are changing CMS or website platform",
      "A redesign will change URLs or information architecture",
      "Previous migrations caused ranking or traffic losses",
      "Content and metadata need careful transfer",
      "Analytics and forms must keep working after launch",
    ],
    deliverables: [
      "URL inventory and redirect plan",
      "Content / asset migration checklist",
      "Metadata and canonical handling notes",
      "Sitemap and robots review",
      "Analytics continuity checks",
      "Launch QA pass on critical journeys",
    ],
    idealFor: [
      "You are redesigning an established site",
      "You are moving from one CMS to another",
      "Search traffic matters and risk must be reduced",
      "You need structured launch checks",
      "Content volume makes a casual cutover unsafe",
    ],
    process: [
      {
        title: "Inventory",
        description: "Catalogue URLs, content, metadata and tracking.",
      },
      {
        title: "Map",
        description: "Plan redirects, destination structure and migration scope.",
      },
      {
        title: "Migrate",
        description: "Transfer content, assets and technical signals.",
      },
      {
        title: "Launch & Monitor",
        description: "QA critical paths and watch post-launch signals.",
      },
    ],
    faqs: [
      {
        question: "Will my URLs change?",
        answer:
          "Not always. Where URLs can stay stable, that usually reduces risk. When they must change, we plan redirects carefully.",
      },
      {
        question: "Can SEO be preserved?",
        answer:
          "We work to reduce migration risk through redirects, metadata, sitemaps and QA. No migration can honestly guarantee zero ranking movement.",
      },
      {
        question: "Can you migrate WordPress or Shopify?",
        answer:
          "Yes. Platform migrations are a common part of this service, scoped to the source and destination setup.",
      },
      {
        question: "Is migration included in every redesign?",
        answer:
          "Basic launch care is part of redesign projects. Dedicated migration planning is especially important for larger sites, platform changes or significant URL changes.",
      },
      {
        question: "What about analytics after launch?",
        answer:
          "We include analytics continuity checks so key tracking does not silently break during cutover.",
      },
    ],
    relatedServiceSlugs: [
      "website-development",
      "website-redesign",
      "website-maintenance",
      "website-performance-optimization",
    ],
    relatedSeoSlugs: ["technical-seo"],
    relatedPlatformSlugs: [
      "wordpress",
      "shopify",
      "woocommerce",
      "bigcommerce",
      "webflow",
      "wix-studio",
      "squarespace",
    ],
    ctaTitle: "Planning a Redesign or Platform Move?",
    ctaDescription:
      "Tell us what is changing. We will help plan a migration approach that reduces unnecessary risk.",
    metaTitle: "Website Migration Services",
    metaDescription:
      "Website migration services for CMS and redesign moves — redirects, content transfer, SEO preservation planning and launch QA.",
  },
  {
    slug: "branding",
    title: "Brand Identity & Web Branding",
    shortTitle: "Branding",
    href: "/services/branding",
    category: "design",
    group: "support",
    summary:
      "Build a visual identity that gives your website a clear and consistent foundation.",
    description:
      "Brand Identity & Web Branding focuses on logo refinement, color, typography and digital identity systems that support website projects — not packaging, broadcast or global brand consultancy claims.",
    tagline:
      "Build a visual identity that gives your website a clear and consistent foundation.",
    visualVariant: "branding",
    audience:
      "Businesses that need a clearer digital identity before or during a website project",
    icon: "sparkles",
    capabilities: [
      {
        title: "Logo Direction & Refinement",
        description:
          "Strengthen or refine the mark that leads your digital presence.",
        icon: "sparkles",
      },
      {
        title: "Color & Typography Systems",
        description:
          "Define usable palettes and type choices for web consistency.",
        icon: "palette",
      },
      {
        title: "Web Brand Direction",
        description:
          "Translate identity into website-ready visual guidance.",
        icon: "monitor",
      },
      {
        title: "Digital Consistency",
        description:
          "Keep pages, CTAs and UI patterns aligned with the brand.",
        icon: "layout-template",
      },
      {
        title: "Asset Foundations",
        description:
          "Prepare core brand assets for website and digital use.",
        icon: "pen-tool",
      },
    ],
    narrativeTitle: "Identity That Supports the Website",
    narrative:
      "Branding here is practical and web-connected. The goal is a clear visual foundation — logo refinement, color, typography and digital consistency — so Website Design, UI/UX and landing pages share one coherent identity.",
    problems: [
      "The website looks inconsistent across pages",
      "The logo or colors feel outdated online",
      "Designers lack a usable brand system",
      "Marketing pages do not feel like the same company",
      "You need brand direction as part of a website project",
    ],
    deliverables: [
      "Logo direction or refinement",
      "Color system",
      "Typography recommendations",
      "Web visual direction",
      "Basic usage guidance",
      "Website-ready brand asset foundations",
    ],
    idealFor: [
      "You are starting a website project without a clear digital identity",
      "Existing branding is inconsistent online",
      "You need refinement rather than a global rebrand programme",
      "Landing pages and site UI need shared visual rules",
      "Stakeholders want brand clarity before design polish",
    ],
    process: [
      {
        title: "Review",
        description: "Assess current identity, audience and website needs.",
      },
      {
        title: "Define",
        description: "Establish direction for logo, color and type.",
      },
      {
        title: "Systematize",
        description: "Turn choices into practical web brand guidance.",
      },
      {
        title: "Apply",
        description: "Connect branding into website or landing-page design.",
      },
    ],
    faqs: [
      {
        question: "Do you only design logos?",
        answer:
          "Logo work can be part of the engagement, but the focus is a usable digital identity system for the website — color, type and visual direction included.",
      },
      {
        question: "Can branding be part of a website project?",
        answer:
          "Yes. Branding often runs ahead of or alongside Website Design and UI/UX so the interface has a clear foundation.",
      },
      {
        question: "Do you offer packaging or environmental branding?",
        answer:
          "No. This service stays tied to digital and website-ready identity work.",
      },
      {
        question: "What if we already have a brand guide?",
        answer:
          "We can adapt an existing guide for web use and improve consistency across pages and components.",
      },
      {
        question: "Is this a full corporate rebrand?",
        answer:
          "Not by default. Scope stays practical and website-connected unless a broader engagement is explicitly agreed.",
      },
    ],
    relatedServiceSlugs: [
      "website-design",
      "ui-ux-design",
      "landing-page-design",
      "digital-marketing",
    ],
    ctaTitle: "Need a Clearer Digital Identity for Your Website?",
    ctaDescription:
      "Tell us what feels inconsistent today. We will recommend branding, website design or both.",
    metaTitle: "Brand Identity & Web Branding",
    metaDescription:
      "Brand identity and web branding for websites — logo refinement, color, typography and digital visual foundations.",
  },
];
