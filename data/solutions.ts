/** @migration-reference Phase 2 — runtime reads DB repositories; this file remains seed/reference source. */
import type { Solution, SolutionCategoryId } from "@/types";

export const solutionCategoryMeta: {
  id: SolutionCategoryId;
  title: string;
  description: string;
}[] = [
  {
    id: "growth-conversion",
    title: "Growth & Conversion",
    description:
      "When visitors arrive but enquiries, bookings or sales fall short.",
  },
  {
    id: "visibility",
    title: "Visibility",
    description:
      "When the people searching for what you offer struggle to find you.",
  },
  {
    id: "website-quality",
    title: "Website Quality",
    description:
      "When the site feels slow, outdated or no longer reflects the business.",
  },
  {
    id: "change-new",
    title: "Change & New Projects",
    description:
      "When you are planning a new website or moving an existing one carefully.",
  },
];

/**
 * Problem-first Solutions catalogue.
 * ORIGINAL SET COMPLETE — 9/9 published. Hub and routes use published: true only.
 */
export const solutions: Solution[] = [
  {
    name: "Website Not Generating Leads",
    title: "Your Website Gets Traffic but Not Enough Enquiries",
    slug: "website-not-generating-leads",
    shortDescription:
      "Your website gets visitors, but too few of them become enquiries, bookings or customers.",
    category: "growth-conversion",
    featured: true,
    published: true,
    icon: "trending-up",
    relatedServiceHrefs: [
      "/services/conversion-rate-optimization",
      "/services/website-audit",
      "/services/website-redesign",
      "/services/analytics-conversion-tracking",
      "/services/landing-page-design",
    ],
    eyebrow: "Website Lead Generation",
    heroStatement: "Getting Website Traffic but Not Enough Enquiries?",
    heroSupporting:
      "Traffic is only useful if visitors understand what you offer, trust the business and know what to do next. When enquiries are low, the issue may be the message, page structure, experience, speed, tracking — or several of them together.",
    possibleCauses: [
      {
        title: "The value proposition is unclear",
        description:
          "Visitors cannot quickly tell what you offer, who it is for, or why they should choose you.",
      },
      {
        title: "The page does not match visitor intent",
        description:
          "Someone arrives with a specific need and lands on a page that does not answer it.",
      },
      {
        title: "There is no obvious next step",
        description:
          "The primary action — enquire, call, book, request a quote or buy — is hard to find or weakly presented.",
      },
      {
        title: "The website does not build enough trust",
        description:
          "People hesitate when they cannot find credible proof, clear business information or useful detail.",
      },
      {
        title: "Forms create unnecessary friction",
        description:
          "Too many fields, unclear questions, poor mobile forms or weak expectations after submit reduce completions.",
      },
      {
        title: "The mobile experience is weak",
        description:
          "Awkward navigation, hard-to-scan text, missing CTAs or uncomfortable forms lose mobile visitors.",
      },
      {
        title: "The website is too slow",
        description:
          "Slow loading adds friction — especially on mobile — and makes every other issue harder to overcome.",
      },
      {
        title: "Important actions are not being measured",
        description:
          "Without tracking key actions, it is difficult to see where visitors drop off or what to improve first.",
      },
    ],
    process: [
      { title: "Visitor arrives" },
      { title: "Understands offer?" },
      { title: "Trusts business?" },
      { title: "Sees next step?" },
      { title: "Can complete action easily?" },
      { title: "Action is tracked?" },
    ],
    problemSymptoms: [
      "Traffic exists but enquiries remain low",
      "Visitors reach key pages but rarely act",
      "Forms are started but not completed",
      "Mobile engagement is noticeably weaker",
      "Visitors frequently leave important landing pages",
      "Users repeatedly ask questions the site is already supposed to answer",
    ],
    measurementPoints: [
      "Click important CTAs",
      "Start forms",
      "Submit forms",
      "Click phone or email links",
      "Reach booking or product pages",
      "Complete key actions",
    ],
    whatWeReview: [
      "Messaging",
      "Page structure",
      "Calls to action",
      "Trust",
      "Mobile UX",
      "Forms",
      "Performance",
      "Traffic and source context",
      "Analytics and tracking",
      "Search visibility where relevant",
    ],
    relatedServiceReasons: [
      {
        href: "/services/conversion-rate-optimization",
        title: "Conversion Rate Optimization",
        reason: "Improve how visitors move from interest to action.",
      },
      {
        href: "/services/website-audit",
        title: "Website Audit",
        reason:
          "Get a prioritized diagnosis across UX, SEO, performance and conversion.",
      },
      {
        href: "/services/website-redesign",
        title: "Website Redesign",
        reason:
          "Rebuild structure and experience when friction affects the whole site.",
      },
      {
        href: "/services/analytics-conversion-tracking",
        title: "Analytics & Conversion Tracking",
        reason: "Measure the actions that show where the journey breaks.",
      },
      {
        href: "/services/landing-page-design",
        title: "Landing Page Design",
        reason:
          "Focus high-intent pages around a clear offer and next step.",
      },
    ],
    relatedProjectSlugs: [
      "gemini-corporate-relocations",
      "the-coast",
      "nashville-home-viewer",
    ],
    relatedArticleSlugs: [
      "what-makes-a-website-convert",
      "website-redesign-checklist",
    ],
    relatedSolutions: [
      {
        slug: "website-not-ranking",
        prompt: "Not getting enough traffic in the first place?",
      },
      {
        slug: "slow-website",
        prompt: "Is speed adding friction?",
      },
      {
        slug: "low-website-conversions",
        prompt: "Looking at the wider journey and drop-offs?",
      },
    ],
    faqs: [
      {
        question: "Why am I getting website traffic but no enquiries?",
        answer:
          "Visitors may not understand the offer, trust the business, see a clear next step, or be able to complete an action easily. Messaging, page structure, forms, mobile experience, speed and tracking can all contribute — often together.",
      },
      {
        question:
          "How do I know whether traffic or conversion is the problem?",
        answer:
          "If few people reach the site, visibility or acquisition may be the main issue. If people already visit but rarely enquire, something in the experience may be blocking action. Many websites have both problems to some degree.",
      },
      {
        question: "Do I need to redesign my whole website?",
        answer:
          "Not necessarily. Some lead problems are fixed with clearer copy, stronger CTAs, better forms or targeted landing pages. A larger redesign makes sense when structure, UX, branding and technical foundations have broader issues.",
      },
      {
        question: "Can better SEO generate more leads?",
        answer:
          "SEO can bring more of the right visitors. If those visitors still cannot understand the offer or take action, more traffic alone may not create more enquiries. Visibility and conversion usually need to work together.",
      },
      {
        question:
          "Can you improve an existing website instead of rebuilding it?",
        answer:
          "Yes. Many engagements improve messaging, conversion paths, performance, tracking or selected pages on an existing site. A rebuild is recommended only when the current foundation is holding the business back.",
      },
      {
        question: "How do you know which pages are causing the problem?",
        answer:
          "We review key journeys, page clarity, CTAs, forms and — where available — analytics showing where visitors engage or drop off. The Free Website Review is a practical starting point; a Website Audit goes deeper.",
      },
      {
        question: "What should I track as a website conversion?",
        answer:
          "Track the actions that matter for your business: form submissions, calls, email clicks, booking starts, quote requests, purchases or other meaningful next steps. Vanity metrics alone rarely explain low leads.",
      },
      {
        question:
          "What is the difference between CRO and a website redesign?",
        answer:
          "Conversion rate optimization focuses on improving how visitors take action — often through messaging, UX, CTAs, forms and page flow. A redesign addresses broader design, structure and experience issues when they affect the whole site.",
      },
    ],
    ctaTitle: "Getting Traffic but Not Enough Enquiries?",
    ctaDescription:
      "Let us review the website, the journey and the actions you want visitors to take so you can understand where the biggest friction may be.",
    primaryCtaLabel: "Get a Free Website Review",
    primaryCtaHref: "/free-website-review",
    secondaryCtaLabel: "Tell Us About Your Website",
    secondaryCtaHref: "/contact",
    seoTitle: "Website Getting Traffic but No Leads?",
    seoDescription:
      "Getting website traffic but not enough enquiries or customers? Explore the common issues that can prevent visitors from taking action and how to identify what needs improving.",
  },
  {
    name: "Website Not Ranking",
    title: "Customers Can’t Find You in Search",
    slug: "website-not-ranking",
    shortDescription:
      "Your website exists, but the people searching for your services are struggling to find it.",
    category: "visibility",
    featured: true,
    published: true,
    icon: "search",
    relatedServiceHrefs: [
      "/seo",
      "/seo/seo-audit",
      "/seo/technical-seo",
      "/seo/on-page-seo",
      "/services/seo-copywriting",
      "/services/website-performance-optimization",
      "/seo/local-seo",
    ],
    eyebrow: "Search Visibility",
    heroStatement: "Your Website Is Live. Why Can’t Customers Find It?",
    heroSupporting:
      "Poor search visibility rarely comes down to one missing keyword. Search engines need to discover the site, understand its pages, trust the structure and find content that matches what people are actually searching for.",
    possibleCauses: [
      {
        title: "Search engines cannot properly crawl important pages",
        description:
          "Technical barriers, robots rules, broken paths or weak internal links can stop important pages from being accessed properly.",
      },
      {
        title: "Important pages are not being indexed",
        description:
          "A page can exist and even be crawlable without being included in the search index in a useful way.",
      },
      {
        title: "The website structure is unclear",
        description:
          "When services, categories and relationships are hard to follow, both people and search engines struggle to understand priority.",
      },
      {
        title: "Pages target topics people are not actually searching for",
        description:
          "Content may describe the business well internally while missing the language and needs of real search queries.",
      },
      {
        title: "Content does not satisfy search intent",
        description:
          "Pages may rank poorly when they do not answer the question or job the searcher is trying to complete.",
      },
      {
        title: "On-page signals are weak or inconsistent",
        description:
          "Titles, headings, URLs, internal links and related signals may not make the topic and purpose clear enough.",
      },
      {
        title: "The site is slow or technically poor",
        description:
          "Performance, mobile usability and technical quality can weaken competitiveness as part of a broader search system.",
      },
      {
        title:
          "The website lacks enough credibility to compete for useful searches",
        description:
          "Even relevant pages may struggle when competing results are clearer, more complete or better established — without reducing SEO to a single score.",
      },
    ],
    process: [
      { title: "Discovery", description: "Can search engines find the page?" },
      { title: "Crawling", description: "Can they access important content?" },
      { title: "Indexing", description: "Is the page in the search index?" },
      {
        title: "Understanding",
        description: "Is the topic and offer clear?",
      },
      {
        title: "Relevance",
        description: "Does it match real search needs?",
      },
      {
        title: "Competitiveness",
        description: "Is it strong enough to compete?",
      },
    ],
    problemSymptoms: [
      "Only ranks when someone searches the exact brand name",
      "Important services do not appear for relevant searches",
      "Many pages are missing from search",
      "Organic traffic remains extremely limited",
      "Competitors consistently appear for searches directly related to the business",
      "New pages are rarely discovered or indexed",
      "Previously visible pages have disappeared",
    ],
    whatWeReview: [
      "Crawlability",
      "Indexing",
      "Site architecture",
      "Technical quality",
      "Search intent",
      "On-page optimization",
      "Content",
      "Internal linking",
      "Performance",
      "Local search where relevant",
      "Analytics and Search Console data if available",
    ],
    relatedServiceReasons: [
      {
        href: "/seo",
        title: "SEO",
        reason:
          "Search visibility built into structure, content and technical foundations.",
      },
      {
        href: "/seo/seo-audit",
        title: "SEO Audit",
        reason:
          "A deeper review of technical, on-page, indexing and visibility issues when the cause is unclear.",
      },
      {
        href: "/seo/technical-seo",
        title: "Technical SEO",
        reason:
          "Improve crawlability, indexability and technical foundations that support discovery.",
      },
      {
        href: "/seo/on-page-seo",
        title: "On-Page SEO",
        reason:
          "Strengthen titles, structure, internal links and page clarity around real search intent.",
      },
      {
        href: "/services/seo-copywriting",
        title: "SEO Copywriting",
        reason:
          "Write clearer pages that answer useful searches without keyword stuffing.",
      },
    ],
    relatedProjectSlugs: [
      "gemini-corporate-relocations",
      "the-coast",
      "nashville-home-viewer",
    ],
    relatedArticleSlugs: [
      "technical-seo-foundations",
      "website-redesign-checklist",
      "tools-to-test-wordpress-website",
    ],
    relatedSolutions: [
      {
        slug: "website-not-generating-leads",
        prompt: "Getting found but still not getting enquiries?",
      },
      {
        slug: "slow-website",
        prompt: "Could performance be part of the problem?",
      },
      {
        slug: "website-migration",
        prompt:
          "Did visibility change after a redesign or platform move?",
      },
    ],
    faqs: [
      {
        question: "Why isn’t my website showing up on Google?",
        answer:
          "Search engines may not be discovering, crawling, indexing or understanding the important pages — or the pages may not match the searches that matter. Visibility problems often involve structure, technical access, content relevance and competitiveness together.",
      },
      {
        question: "Why does my website only rank for my business name?",
        answer:
          "Brand searches are usually easier because people already know you. Ranking for service or problem searches requires clearer pages, stronger relevance and enough quality to compete with other useful results.",
      },
      {
        question: "Can a website be indexed but still not rank?",
        answer:
          "Yes. Being indexed only means a page can potentially appear. It does not mean the page is relevant, useful or competitive enough for the searches you care about.",
      },
      {
        question: "Do I need more content to rank?",
        answer:
          "Not necessarily. More pages help only when they are useful, distinct and aligned with real search needs. Thin or repetitive pages can create noise rather than visibility.",
      },
      {
        question: "How long does it take a new website to appear in search?",
        answer:
          "A new site may take time to be discovered, indexed and evaluated. There is no fixed timeline that applies to every business. Technical accessibility, useful structure and ongoing improvement still matter from day one.",
      },
      {
        question: "Can website speed affect SEO?",
        answer:
          "Performance and page experience can contribute to overall quality and should be reviewed alongside content, structure and technical SEO. Speed alone rarely explains every ranking problem.",
      },
      {
        question: "Do I need a new website to improve rankings?",
        answer:
          "Not always. Many visibility issues are improved with SEO, technical fixes, better page structure or clearer content. A redesign or rebuild is more relevant when broader foundations are holding the site back.",
      },
      {
        question:
          "How do I know whether I need Technical SEO or On-Page SEO?",
        answer:
          "Technical SEO focuses on crawlability, indexability and technical health. On-Page SEO focuses on how clearly pages communicate topic, structure and intent. Many sites need both — an SEO Audit can help prioritize.",
      },
    ],
    ctaTitle: "Not Sure What’s Limiting Your Search Visibility?",
    ctaDescription:
      "We can review the website’s structure, technical foundations and search setup to help identify what may be preventing the right pages from being found.",
    primaryCtaLabel: "Get a Free Website Review",
    primaryCtaHref: "/free-website-review",
    secondaryCtaLabel: "Tell Us About Your Website",
    secondaryCtaHref: "/contact",
    seoTitle: "Why Isn’t My Website Ranking on Google?",
    seoDescription:
      "Not getting enough visibility from Google? Explore the technical, content, site-structure and search-intent issues that may be preventing your website from ranking effectively.",
  },
  {
    name: "Slow Website",
    title: "Your Website Is Too Slow",
    slug: "slow-website",
    shortDescription:
      "Pages load slowly, interactions feel heavy or performance is affecting the experience on mobile and desktop.",
    category: "website-quality",
    featured: true,
    published: true,
    icon: "gauge",
    relatedServiceHrefs: [
      "/services/website-performance-optimization",
      "/seo/technical-seo",
      "/services/website-development",
      "/services/website-maintenance",
      "/services/website-redesign",
      "/services/website-audit",
    ],
    eyebrow: "Website Performance",
    heroStatement: "Your Website Shouldn’t Make Visitors Wait.",
    heroSupporting:
      "A slow website is rarely caused by one thing. Images, scripts, hosting, frontend code, fonts, third-party tools and page structure can all contribute to an experience that feels heavy or unresponsive.",
    possibleCauses: [
      {
        title: "Images are larger than they need to be",
        description:
          "Oversized, uncompressed or poorly delivered images can delay the moment useful content appears.",
      },
      {
        title: "Too much JavaScript runs before the page becomes usable",
        description:
          "Scripts can delay interactivity even when the design looks ready on screen.",
      },
      {
        title: "Third-party scripts add unnecessary weight",
        description:
          "Useful tools can still slow the experience when too many load too early or are poorly implemented.",
      },
      {
        title: "Fonts and styles delay rendering",
        description:
          "Heavy font and CSS delivery can leave the page blank or unstable longer than it should.",
      },
      {
        title: "The site sends too much code to the browser",
        description:
          "Themes, builders and accumulated frontend code can make even simple pages feel heavy.",
      },
      {
        title: "Caching and delivery are poorly configured",
        description:
          "Weak caching or inefficient delivery can force the browser to repeat work that should be faster.",
      },
      {
        title: "Hosting or server response is slow",
        description:
          "If the server takes too long to respond, everything else on the page waits longer to start.",
      },
      {
        title:
          "The website has accumulated years of plugins, scripts or legacy code",
        description:
          "Older setups can grow heavier over time without one dramatic failure — especially when features keep being added.",
      },
    ],
    process: [
      { title: "Request" },
      { title: "Load" },
      { title: "Render" },
      { title: "Stabilize" },
      { title: "Interact" },
    ],
    problemSymptoms: [
      "Pages take noticeably long before useful content appears",
      "Mobile feels much worse than desktop",
      "Content jumps while loading",
      "Buttons respond slowly",
      "Visitors regularly complain the site is slow",
      "Large pages feel heavier over time",
      "Performance tools consistently flag major issues",
      "The site became slower after adding plugins, scripts or features",
    ],
    whatWeReview: [
      "Page weight",
      "Images",
      "Fonts",
      "JavaScript",
      "Third-party scripts",
      "Rendering",
      "Core Web Vitals",
      "Caching",
      "Server response",
      "Mobile behavior",
      "Theme or plugin architecture where relevant",
      "Critical pages",
    ],
    relatedServiceReasons: [
      {
        href: "/services/website-performance-optimization",
        title: "Website Performance Optimization",
        reason:
          "Identify and reduce the technical and frontend issues making important pages slower or less responsive.",
      },
      {
        href: "/seo/technical-seo",
        title: "Technical SEO",
        reason:
          "Review broader technical search foundations that can overlap with performance work.",
      },
      {
        href: "/services/website-development",
        title: "Website Development",
        reason:
          "Fix template, frontend or integration bottlenecks that optimization alone cannot remove.",
      },
      {
        href: "/services/website-maintenance",
        title: "Website Maintenance",
        reason:
          "Keep updates, plugins and ongoing technical health from quietly adding weight over time.",
      },
      {
        href: "/services/website-audit",
        title: "Website Audit",
        reason:
          "Diagnose performance alongside UX, SEO, content and conversion when several problems overlap.",
      },
    ],
    relatedProjectSlugs: [
      "gemini-corporate-relocations",
      "the-coast",
      "nashville-home-viewer",
    ],
    relatedArticleSlugs: [
      "tools-to-test-wordpress-website",
      "technical-seo-foundations",
      "website-redesign-checklist",
    ],
    relatedSolutions: [
      {
        slug: "website-not-ranking",
        prompt: "Slow and also struggling to rank?",
      },
      {
        slug: "website-not-generating-leads",
        prompt: "Getting traffic but visitors still don’t act?",
      },
      {
        slug: "outdated-website",
        prompt:
          "If the site is also difficult to maintain or structurally dated…",
      },
    ],
    faqs: [
      {
        question: "Why is my website so slow?",
        answer:
          "Slow websites usually involve more than one factor — images, scripts, third-party tools, fonts, caching, hosting or accumulated frontend code. The right fix depends on where the bottleneck actually sits.",
      },
      {
        question: "Why is my website slower on mobile?",
        answer:
          "Mobile devices often have less power, less memory and more variable connections. A site that feels acceptable on a fast desktop can still feel frustrating on mobile.",
      },
      {
        question: "Can large images slow down a website?",
        answer:
          "Yes. Oversized or uncompressed images are a common cause of delay. They are rarely the only cause, but they are often one of the first areas worth reviewing.",
      },
      {
        question: "Do too many plugins make websites slow?",
        answer:
          "They can — especially when plugins add scripts, styles or third-party requests. Not every plugin is a problem, and not every slow site is caused by plugins alone.",
      },
      {
        question: "Will changing hosting make my website faster?",
        answer:
          "It may help when the server is slow, but it will not remove heavy scripts or oversized assets from the page. Hosting and frontend issues often need to be reviewed together.",
      },
      {
        question: "Can website speed affect Google rankings?",
        answer:
          "Performance can contribute to page experience and technical quality, but rankings are not determined by speed alone. Relevance, content, architecture and other search factors still matter.",
      },
      {
        question: "What are Core Web Vitals?",
        answer:
          "Core Web Vitals describe how quickly main content appears, how stable the layout stays, and how quickly the page responds to interaction. They are useful clues, not a complete performance diagnosis.",
      },
      {
        question: "Do I need to rebuild my website to improve performance?",
        answer:
          "Not necessarily. Many sites improve with optimization or targeted development. A rebuild is more relevant when performance problems are deeply tied to outdated architecture, bloated themes or broader site issues.",
      },
    ],
    ctaTitle: "Is Your Website Making Visitors Wait?",
    ctaDescription:
      "We can review the pages, frontend, third-party tools and technical setup to help identify where the biggest performance bottlenecks may be.",
    primaryCtaLabel: "Get a Free Website Review",
    primaryCtaHref: "/free-website-review",
    secondaryCtaLabel: "Tell Us About Your Website",
    secondaryCtaHref: "/contact",
    seoTitle: "Why Is My Website So Slow?",
    seoDescription:
      "A slow website can affect usability, mobile experience and search performance. Explore the common causes of slow loading and what may need to be improved.",
  },
  {
    name: "Outdated Website",
    title: "Your Business Has Changed but Your Website Hasn’t",
    slug: "outdated-website",
    shortDescription:
      "Your current website no longer reflects the business, works poorly on modern devices or makes the company feel behind competitors.",
    category: "website-quality",
    featured: true,
    published: true,
    icon: "refresh-cw",
    relatedServiceHrefs: [
      "/services/website-redesign",
      "/services/website-strategy",
      "/services/website-design",
      "/services/ui-ux-design",
      "/services/website-development",
      "/services/website-migration",
      "/services/seo-copywriting",
      "/services/website-audit",
    ],
    eyebrow: "Outdated Website",
    heroStatement: "Your Business Has Changed. Has Your Website?",
    heroSupporting:
      "A website can become outdated long before it stops working. The business changes, services evolve, customers expect more and new pages get added — while the website underneath stays largely the same.",
    possibleCauses: [
      {
        title: "Your current services are difficult to find",
        description:
          "The navigation and page structure still reflect an older set of offers.",
      },
      {
        title: "The homepage describes an older version of the business",
        description:
          "First impressions still explain who you used to be rather than who you are now.",
      },
      {
        title: "You avoid sending prospects to the website",
        description:
          "The site is no longer a confident representation of the company’s current quality.",
      },
      {
        title: "Most updates require awkward workarounds",
        description:
          "Simple content or structural changes are harder than they should be.",
      },
      {
        title: "The website feels inconsistent from page to page",
        description:
          "Templates, layouts and messaging have drifted as pages were added over time.",
      },
      {
        title: "Mobile feels like a reduced desktop experience",
        description:
          "The site may collapse into smaller screens without feeling designed for them.",
      },
      {
        title: "Important content has been added without clear structure",
        description:
          "New services, locations or pages were layered on without revisiting hierarchy.",
      },
      {
        title: "The website is slow or technically fragile",
        description:
          "Accumulated patches, scripts and components make the site harder to maintain and improve.",
      },
      {
        title: "SEO was added later rather than planned into the structure",
        description:
          "Search foundations were patched onto an older information architecture.",
      },
      {
        title:
          "Visitors frequently need clarification after reading the site",
        description:
          "People still ask questions the website is supposed to answer clearly.",
      },
    ],
    process: [
      { title: "Refresh", description: "Targeted" },
      { title: "Redesign", description: "Structural" },
      { title: "Rebuild", description: "Foundational" },
    ],
    problemSymptoms: [
      "Your current services are difficult to find",
      "The homepage describes an older version of the business",
      "You avoid sending prospects to the website",
      "Most updates require awkward workarounds",
      "The website feels inconsistent from page to page",
      "Mobile feels like a reduced desktop experience",
      "Important content has been added without clear structure",
      "The website is slow or technically fragile",
      "SEO was added later rather than planned into the structure",
      "Visitors frequently need clarification after reading the site",
    ],
    whatWeReview: [
      "Business goals",
      "Current services and offers",
      "Website structure",
      "Brand consistency",
      "Content",
      "User journeys",
      "Mobile experience",
      "Performance",
      "SEO",
      "CMS and platform",
      "Integrations",
      "Analytics",
      "Maintainability",
    ],
    relatedServiceReasons: [
      {
        href: "/services/website-redesign",
        title: "Website Redesign",
        reason:
          "Rework the structure, visual system and user experience when targeted updates are no longer enough.",
      },
      {
        href: "/services/website-strategy",
        title: "Website Strategy",
        reason:
          "Clarify what the new website needs to communicate, contain and help visitors do before redesign begins.",
      },
      {
        href: "/services/website-audit",
        title: "Website Audit",
        reason:
          "Review design, UX, SEO, performance and conversion foundations before deciding how much change is necessary.",
      },
      {
        href: "/services/website-design",
        title: "Website Design",
        reason:
          "Create clearer layouts and visual systems that support the current brand and journeys.",
      },
      {
        href: "/services/website-migration",
        title: "Website Migration",
        reason:
          "Move carefully when redesign also involves platform or URL changes that must protect existing value.",
      },
    ],
    relatedProjectSlugs: [
      "overlook-cabin-rentals",
      "banyan-vacations",
      "the-coast",
    ],
    relatedArticleSlugs: [
      "website-redesign-checklist",
      "what-makes-a-website-convert",
      "technical-seo-foundations",
    ],
    relatedSolutions: [
      {
        slug: "website-migration",
        prompt: "Changing platforms as part of the redesign?",
      },
      {
        slug: "slow-website",
        prompt: "Website also feels slow?",
      },
      {
        slug: "website-not-ranking",
        prompt: "Not getting found in search?",
      },
    ],
    faqs: [
      {
        question: "How do I know if my website is outdated?",
        answer:
          "Signs include content that no longer matches the business, crowded or unclear structure, awkward mobile use, inconsistent pages, difficult updates, or a site you hesitate to send prospects to. Visual age alone is only one possible indicator.",
      },
      {
        question: "How often should a website be redesigned?",
        answer:
          "There is no fixed schedule. Redesign becomes relevant when the business, content, structure or experience has changed enough that targeted updates are no longer enough — not simply because a certain number of years have passed.",
      },
      {
        question: "Does an outdated website hurt SEO?",
        answer:
          "A dated visual design alone does not cause poor rankings. Structural issues, thin or unclear content, weak internal linking, technical problems and migration mistakes can affect search. SEO should be considered during redesign, not only afterward.",
      },
      {
        question:
          "Can you refresh my existing website without rebuilding it?",
        answer:
          "Yes. When the foundation is still sound, a refresh can update imagery, typography, copy, selected layouts and UX without a full rebuild.",
      },
      {
        question:
          "What is the difference between a website refresh and redesign?",
        answer:
          "A refresh improves selected areas of a still-sound foundation. A redesign addresses broader structure, visual system, messaging, mobile UX and journeys when the current website needs more than surface updates.",
      },
      {
        question: "When should a website be rebuilt completely?",
        answer:
          "A rebuild is more appropriate when obsolete technology, fragile architecture, CMS limits, severe performance issues, major structural change or complex website debt significantly limit progress.",
      },
      {
        question: "Can I keep my existing content during a redesign?",
        answer:
          "Often yes — especially valuable pages, URLs and content that still serve customers or search. An inventory helps decide what to keep, improve, consolidate or retire.",
      },
      {
        question: "Should I change platforms when redesigning my website?",
        answer:
          "Not necessarily. Redesign can happen on the current platform or alongside migration, depending on CMS limits, editing needs, commerce, performance, integrations and future growth.",
      },
    ],
    ctaTitle: "Has Your Business Outgrown Its Website?",
    ctaDescription:
      "We can review the current site, how the business has changed and what the website now needs to do before recommending whether a refresh, redesign or larger rebuild makes sense.",
    primaryCtaLabel: "Get a Free Website Review",
    primaryCtaHref: "/free-website-review",
    secondaryCtaLabel: "Tell Us About Your Website",
    secondaryCtaHref: "/contact",
    seoTitle: "Has Your Business Outgrown Its Website?",
    seoDescription:
      "An outdated website can affect credibility, usability, content, SEO and conversion. Learn how to identify whether your site needs a refresh, redesign or larger rebuild.",
  },
  {
    name: "Low Website Conversions",
    title: "People Visit but Don’t Take Action",
    slug: "low-website-conversions",
    shortDescription:
      "People reach the website but struggle to understand what to do next or leave before taking meaningful action.",
    category: "growth-conversion",
    featured: false,
    published: true,
    icon: "mouse-pointer-click",
    relatedServiceHrefs: [
      "/services/conversion-rate-optimization",
      "/services/analytics-conversion-tracking",
      "/services/website-audit",
      "/services/ui-ux-design",
      "/services/landing-page-design",
      "/services/website-redesign",
      "/services/website-performance-optimization",
    ],
    eyebrow: "Website Conversion",
    heroStatement: "Visitors Are Arriving. What’s Stopping the Next Step?",
    heroSupporting:
      "A conversion problem often appears somewhere between interest and action. The offer may be unclear, the journey may ask too much, important information may arrive too late, or the website may make the next step harder than it needs to be.",
    possibleCauses: [
      {
        title: "The page does not match why the visitor arrived",
        description:
          "Intent and landing content are out of sync, so the next step never feels relevant.",
      },
      {
        title: "The offer takes too long to understand",
        description:
          "Visitors cannot quickly tell what is being offered, who it is for or why it matters.",
      },
      {
        title: "Important information is missing",
        description:
          "People hesitate when pricing context, process, policies or next-step details are unclear.",
      },
      {
        title: "The website asks for commitment too early",
        description:
          "Forms, accounts or purchase pressure arrive before the visitor has enough confidence.",
      },
      {
        title: "Trust has not been established",
        description:
          "Credible proof, clarity and business information arrive too late — or not at all.",
      },
      {
        title: "The next step creates too much friction",
        description:
          "Competing CTAs, long forms, awkward booking tools or unclear options interrupt progress.",
      },
      {
        title: "Mobile or performance problems interrupt the journey",
        description:
          "Delayed interactions, unstable layouts or heavy mobile experiences break momentum.",
      },
      {
        title: "The website is not measuring where users drop off",
        description:
          "Without meaningful events, teams guess at the problem instead of seeing where journeys stop.",
      },
    ],
    process: [
      { title: "Arrive" },
      { title: "Understand" },
      { title: "Trust" },
      { title: "Evaluate" },
      { title: "Decide" },
      { title: "Act" },
    ],
    problemSymptoms: [
      "Visitors reach important pages but rarely continue",
      "Users start forms but abandon them",
      "Products are viewed but rarely added to cart",
      "Checkout or booking begins but is rarely completed",
      "Visitors repeatedly ask for information that should already be clear",
      "Mobile users struggle with important actions",
      "Multiple CTAs compete for attention",
      "Traffic grows while meaningful actions do not",
    ],
    whatWeReview: [
      "Traffic intent",
      "Offer clarity",
      "Page structure",
      "Information hierarchy",
      "Trust",
      "CTA hierarchy",
      "Forms",
      "Mobile UX",
      "Performance",
      "Checkout or booking flow",
      "Analytics",
      "User journey",
    ],
    relatedServiceReasons: [
      {
        href: "/services/conversion-rate-optimization",
        title: "Conversion Rate Optimization",
        reason:
          "Use evidence from the existing journey to identify and reduce friction between visitor intent and meaningful action.",
      },
      {
        href: "/services/analytics-conversion-tracking",
        title: "Analytics & Conversion Tracking",
        reason:
          "Set up meaningful website events so important actions and drop-off points can actually be measured.",
      },
      {
        href: "/services/website-audit",
        title: "Website Audit",
        reason:
          "Review conversion alongside UX, SEO, performance, content and structure when several issues overlap.",
      },
      {
        href: "/services/ui-ux-design",
        title: "UI/UX Design",
        reason:
          "Improve journey clarity, hierarchy and interaction where experience creates friction.",
      },
      {
        href: "/services/landing-page-design",
        title: "Landing Page Design",
        reason:
          "Focus one campaign, offer or traffic source when the conversion problem is concentrated.",
      },
    ],
    relatedProjectSlugs: [
      "the-coast",
      "nashville-home-viewer",
      "gemini-corporate-relocations",
    ],
    relatedArticleSlugs: [
      "what-makes-a-website-convert",
      "website-redesign-checklist",
      "tools-to-test-wordpress-website",
    ],
    relatedSolutions: [
      {
        slug: "website-not-generating-leads",
        prompt: "Is the main problem specifically that enquiries are too low?",
      },
      {
        slug: "ecommerce-growth",
        prompt:
          "If the journey is specifically an online store…",
      },
      {
        slug: "slow-website",
        prompt:
          "If the journey feels sluggish or interactions are delayed…",
      },
    ],
    faqs: [
      {
        question: "What counts as a website conversion?",
        answer:
          "A conversion is a meaningful action the website is meant to help someone complete — such as a purchase, booking, quote request, sign-up, download or call. It is not only a sale.",
      },
      {
        question: "Why do people visit my website but not take action?",
        answer:
          "They may have landed on the wrong page, not understood the offer, lacked key information or confidence, faced too much commitment too soon, or struggled with forms, booking tools, mobile UX or performance.",
      },
      {
        question: "How do I know where visitors are dropping off?",
        answer:
          "Meaningful analytics events — such as CTA clicks, form starts, form completions, add-to-cart, checkout or booking starts — help show where journeys stop. Qualitative feedback can also reveal friction.",
      },
      {
        question:
          "Does a low conversion rate mean my website needs redesigning?",
        answer:
          "Not necessarily. Some issues need a targeted fix or journey improvement. Broader redesign is more relevant when structural, UX or content problems exist across the site.",
      },
      {
        question: "Can website speed affect conversion?",
        answer:
          "Yes. Slow pages, delayed interactions or unstable layouts can interrupt intent. Speed alone rarely explains every conversion problem, but it can make other friction worse.",
      },
      {
        question: "What is conversion rate optimization?",
        answer:
          "CRO uses evidence from the existing journey to identify and reduce friction between visitor intent and meaningful action. It is not the same as changing colours or adding manipulative tactics.",
      },
      {
        question: "Do I need analytics before doing CRO?",
        answer:
          "Useful measurement makes CRO far more reliable. Without events and context, optimization can become guesswork. Analytics and CRO work best together.",
      },
      {
        question: "Can changing the CTA improve conversions?",
        answer:
          "Sometimes — especially when the next step is unclear. Many conversion problems start earlier in the journey with intent, clarity, trust, information or friction before the button.",
      },
    ],
    ctaTitle: "Visitors Are Reaching the Website. What Happens Next?",
    ctaDescription:
      "We can review the journey, important actions and measurement setup to help identify where unnecessary friction may be getting between interest and completion.",
    primaryCtaLabel: "Get a Free Website Review",
    primaryCtaHref: "/free-website-review",
    secondaryCtaLabel: "Tell Us About Your Website",
    secondaryCtaHref: "/contact",
    seoTitle: "Why Is My Website Conversion Rate Low?",
    seoDescription:
      "Visitors reaching your website but not completing important actions? Explore the messaging, UX, trust, performance and journey issues that can create conversion friction.",
  },
  {
    name: "Planning a Website Migration",
    title: "You’re Planning a Website Move or Rebuild",
    slug: "website-migration",
    shortDescription:
      "You need to move or rebuild a website while protecting important content, URLs, SEO foundations and functionality.",
    category: "change-new",
    featured: true,
    published: true,
    icon: "layers",
    relatedServiceHrefs: [
      "/services/website-migration",
      "/services/website-strategy",
      "/seo/technical-seo",
      "/services/website-development",
      "/services/website-redesign",
    ],
    relatedPlatformSlugs: [
      "wordpress",
      "webflow",
      "shopify",
      "woocommerce",
      "bigcommerce",
      "wix-studio",
    ],
    eyebrow: "Website Migration",
    heroStatement: "Moving a Website Means Protecting What Already Works.",
    heroSupporting:
      "A migration can affect URLs, search visibility, content, analytics, integrations and customer journeys. The safest approach is to understand what must be preserved before the new website goes live.",
    possibleCauses: [
      {
        title: "Current CMS is difficult to manage",
        description:
          "Editing, publishing or maintaining the site has become slower or riskier than the business needs.",
      },
      {
        title: "Platform limits important functionality",
        description:
          "Required features, commerce needs or integrations are hard to support on the current system.",
      },
      {
        title: "Structure and URLs no longer match the business",
        description:
          "Navigation, content and destinations need a deliberate remap — not only a visual refresh.",
      },
      {
        title: "Multiple sites or sections need consolidating",
        description:
          "Content, brands or products are spread across systems that should become one clearer destination.",
      },
      {
        title: "Domain or platform change is already decided",
        description:
          "A move is underway, but URLs, SEO, tracking and integrations still need protection planning.",
      },
      {
        title: "A previous redesign or move disrupted visibility",
        description:
          "Traffic, rankings, forms or analytics changed after launch and need investigation.",
      },
      {
        title: "It is unclear whether migration is even necessary",
        description:
          "Problems may be solvable in place — migration should not be the default answer.",
      },
    ],
    process: [
      { title: "Inventory" },
      { title: "Map" },
      { title: "Build" },
      { title: "Migrate" },
      { title: "Validate" },
      { title: "Launch" },
      { title: "Monitor" },
    ],
    problemSymptoms: [
      "Old links return 404",
      "Traffic drops unexpectedly after a redesign or move",
      "Important pages disappear from search",
      "Forms stop delivering",
      "Analytics stops recording expected actions",
      "Internal links point to old URLs",
      "Images or assets are missing",
      "Booking or checkout paths fail",
    ],
    whatWeReview: [
      "Current platform",
      "Target platform",
      "Site architecture",
      "URL inventory",
      "Content",
      "SEO",
      "Analytics",
      "Forms",
      "Integrations",
      "CMS needs",
      "E-commerce data",
      "Performance",
      "Internal workflows",
      "Business goals",
    ],
    relatedServiceReasons: [
      {
        href: "/services/website-migration",
        title: "Website Migration",
        reason:
          "Plan and carry out the transfer of content, URLs, technical foundations and critical functionality from the current site to the new environment.",
      },
      {
        href: "/services/website-strategy",
        title: "Website Strategy",
        reason:
          "Decide what should stay, what should change, new structure, platform requirements, content priorities and user journeys before migration begins.",
      },
      {
        href: "/seo/technical-seo",
        title: "Technical SEO",
        reason:
          "Support redirects, crawlability, indexing, canonical handling, sitemaps and technical validation around the move.",
      },
      {
        href: "/services/website-development",
        title: "Website Development",
        reason:
          "Build the new environment so approved content, structure and functionality can land safely.",
      },
      {
        href: "/services/website-redesign",
        title: "Website Redesign",
        reason:
          "Combine design change with migration carefully when structure, journeys and presentation need to evolve together.",
      },
    ],
    relatedProjectSlugs: [
      "the-coast",
      "nashville-home-viewer",
      "gemini-corporate-relocations",
    ],
    relatedArticleSlugs: [
      "website-redesign-checklist",
      "technical-seo-foundations",
      "tools-to-test-wordpress-website",
    ],
    relatedSolutions: [
      {
        slug: "outdated-website",
        prompt:
          "Redesigning because the current site has become difficult to manage?",
      },
      {
        slug: "website-not-ranking",
        prompt: "Worried about search visibility?",
      },
      {
        slug: "ecommerce-growth",
        prompt: "Migrating an online store?",
      },
    ],
    faqs: [
      {
        question: "What is a website migration?",
        answer:
          "A website migration is the planned transfer of a site — or important parts of it — to a new platform, domain, structure or rebuilt environment. It involves more than copying pages: URLs, content, SEO foundations, analytics, forms and integrations may all need protecting.",
      },
      {
        question: "Can I migrate my website without losing SEO?",
        answer:
          "You can reduce unnecessary risk by inventorying important URLs, mapping redirects intentionally, preserving useful content and metadata, validating crawlability and monitoring after launch. No responsible migration should promise zero ranking change.",
      },
      {
        question: "Do I have to keep the same URLs?",
        answer:
          "Not always. Keeping stable URLs can reduce disruption, but restructuring is sometimes appropriate. What matters is intentional mapping so changed URLs redirect to relevant destinations.",
      },
      {
        question: "Should I redesign and migrate at the same time?",
        answer:
          "You can, but combining redesign with migration increases the number of moving parts — design, structure, content, URLs, platform, tracking and integrations. Planning becomes especially important.",
      },
      {
        question: "How do you decide what content should move?",
        answer:
          "An inventory helps classify content as keep, improve, merge, remove or redirect. Not every page should migrate by default — only what remains useful, accurate or strategically important.",
      },
      {
        question: "Can you migrate from one platform to another?",
        answer:
          "Many businesses move between platforms such as WordPress, Webflow, Shopify or WooCommerce. Exact scope depends on the source and destination systems, content types, commerce data and integrations involved.",
      },
      {
        question: "What happens to analytics and tracking?",
        answer:
          "Analytics, tags and conversion events should be reviewed before launch so important actions continue to be measurable. Launching blind makes it harder to know whether the migration protected what mattered.",
      },
      {
        question: "Can a website migration cause rankings to drop?",
        answer:
          "Yes. Major site changes can affect search performance. The goal is to reduce unnecessary risk through planning, preserving important signals, testing, monitoring and responding quickly if issues appear.",
      },
      {
        question: "What if my previous migration already caused problems?",
        answer:
          "Investigation can compare old and new URLs, find missing redirects, check indexing, review removed content, test integrations and confirm analytics continuity. Not all lost rankings can be recovered, but many practical issues can still be repaired.",
      },
    ],
    ctaTitle: "Planning a Website Move or Rebuild?",
    ctaDescription:
      "Tell us what you are moving from, what you are considering moving to and what needs to be protected. We can help you determine the safest practical next step.",
    primaryCtaLabel: "Tell Us About Your Migration",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Get a Free Website Review",
    secondaryCtaHref: "/free-website-review",
    seoTitle: "Planning a Website Migration?",
    seoDescription:
      "Planning a website rebuild or platform move? Learn what should be protected, mapped and tested across URLs, SEO, content, analytics and integrations before launch.",
  },
  {
    name: "New Business Website",
    title: "You Need a Clear New Business Website",
    slug: "new-business-website",
    shortDescription:
      "Your business needs a clear, credible website foundation built around the right structure from the beginning.",
    category: "change-new",
    featured: false,
    published: true,
    icon: "rocket",
    relatedServiceHrefs: [
      "/services/website-strategy",
      "/services/website-design",
      "/services/website-development",
      "/services/branding",
      "/seo",
      "/services/seo-copywriting",
      "/services/analytics-conversion-tracking",
      "/services/website-maintenance",
    ],
    relatedPlatformSlugs: [
      "wordpress",
      "webflow",
      "shopify",
      "woocommerce",
      "wix-studio",
      "squarespace",
    ],
    eyebrow: "New Business Website",
    heroStatement: "Start With the Business. Then Build the Website.",
    heroSupporting:
      "A new website is easier to build well when the goals, audience, content, structure and next steps are clear before design begins.",
    possibleCauses: [
      {
        title: "Starting a company or brand from scratch",
        description:
          "There is no existing website foundation — only a business idea that needs a clear online presence.",
      },
      {
        title: "Moving beyond social media alone",
        description:
          "Instagram, Facebook or LinkedIn are useful, but customers still need a credible destination that explains the business.",
      },
      {
        title: "Replacing a temporary one-page site",
        description:
          "A holding page or basic template got you started, but the business now needs structure, content and conversion paths.",
      },
      {
        title: "Unsure which pages are actually required",
        description:
          "It is easy to overbuild or underbuild when the website job and audience are still undefined.",
      },
      {
        title: "Unsure which platform to use",
        description:
          "WordPress, Webflow, Shopify, Wix and others can all work — the right choice follows requirements, not trends.",
      },
      {
        title: "Unsure how much to build in version one",
        description:
          "Ambition is useful, but launching every future feature on day one often delays a useful website.",
      },
      {
        title: "Unsure whether SEO should start immediately",
        description:
          "Search foundations are easier to plan into architecture and content before launch than to bolt on later.",
      },
    ],
    process: [
      { title: "Goal" },
      { title: "Audience" },
      { title: "Message" },
      { title: "Structure" },
      { title: "Content" },
      { title: "Design" },
      { title: "Build" },
      { title: "Measure" },
    ],
    problemSymptoms: [
      "Starting with a template instead of goals",
      "Writing vague homepage copy",
      "Trying to speak to everyone",
      "Creating too many pages too early",
      "Ignoring mobile",
      "Adding SEO after the build",
      "Choosing platform before requirements",
      "Using fake or generic proof",
      "Launching without tracking",
      "Overloading the site with tools",
    ],
    whatWeReview: [
      "Business goals",
      "Audience",
      "Website goals",
      "Primary actions",
      "Pages",
      "Content",
      "Branding",
      "Platform",
      "SEO",
      "Functionality",
      "Integrations",
      "Analytics",
      "Launch requirements",
    ],
    relatedServiceReasons: [
      {
        href: "/services/website-strategy",
        title: "Website Strategy",
        reason:
          "Define the audience, structure, content priorities and conversion paths before design and development begin.",
      },
      {
        href: "/services/website-design",
        title: "Website Design",
        reason:
          "Turn the strategy and content hierarchy into a clear, credible and responsive visual experience.",
      },
      {
        href: "/services/website-development",
        title: "Website Development",
        reason:
          "Build the website on a platform and technical foundation appropriate for the business.",
      },
      {
        href: "/services/branding",
        title: "Brand Identity & Web Branding",
        reason:
          "Establish a consistent visual foundation when logo, colour, type or tone are still incomplete — without requiring a full brand book first.",
      },
      {
        href: "/seo",
        title: "SEO",
        reason:
          "Plan site architecture, page topics and technical foundations where search visibility matters from launch.",
      },
    ],
    relatedProjectSlugs: [
      "the-coast",
      "gemini-corporate-relocations",
      "nashville-home-viewer",
    ],
    relatedArticleSlugs: [
      "website-redesign-checklist",
      "technical-seo-foundations",
      "what-makes-a-website-convert",
    ],
    relatedSolutions: [
      {
        slug: "outdated-website",
        prompt: "Replacing an older existing site?",
      },
      {
        slug: "website-migration",
        prompt: "Moving from an existing platform?",
      },
      {
        slug: "website-not-ranking",
        prompt: "Already launched but struggling to rank?",
      },
    ],
    faqs: [
      {
        question: "What pages does a new business website need?",
        answer:
          "It depends on the business. Many service businesses start with Home, About, Services (and key service pages), proof or FAQ where useful, Contact and required legal pages. Commerce and local businesses may need additional shop, location or shipping pages. Not every site needs every page type.",
      },
      {
        question: "How much content do I need before website design starts?",
        answer:
          "You do not need every sentence finalised. You do need enough clarity about services, audience questions, proof, process, contact methods and calls to action so structure and design decisions have direction.",
      },
      {
        question: "Which website platform should I choose?",
        answer:
          "Choose based on requirements — content, commerce, editing, SEO, integrations, performance, team workflow and growth — not on which tool is currently fashionable. WordPress, Webflow, Shopify, WooCommerce, Wix Studio, Squarespace, Framer and HubSpot CMS each suit different needs.",
      },
      {
        question: "Do I need SEO when launching a new website?",
        answer:
          "Where search visibility matters, yes — plan architecture, topics, URLs, titles, internal links, crawlability, mobile and performance into the build. SEO does not guarantee immediate rankings, but foundations are easier before launch than afterwards.",
      },
      {
        question: "Do I need branding before building the website?",
        answer:
          "Not always a full brand system. A consistent visual foundation — logo, colours, type, image direction and tone — helps. You should not delay indefinitely waiting for a complete brand guideline if the business is ready to launch a clear website.",
      },
      {
        question: "Can I start with a small website and expand later?",
        answer:
          "Yes. Version one should do the job properly — critical pages, clear navigation, credible content, strong mobile experience, SEO foundations, essential integrations and measurement — then grow based on real use.",
      },
      {
        question: "How long does it take to build a business website?",
        answer:
          "Timing depends on scope: number of pages, content readiness, branding, platform, integrations and review cycles. There is no universal timeframe that fits every business.",
      },
      {
        question: "What should I prepare before contacting a web designer?",
        answer:
          "Helpful starting points include business goals, primary audience, what the website should help people do, a rough list of pages, available content or assets, brand materials if they exist, and any must-have integrations.",
      },
    ],
    ctaTitle: "Planning Your First Business Website?",
    ctaDescription:
      "Tell us what you are launching, who it is for and what you need the website to help the business achieve. We can help you define the right starting point.",
    primaryCtaLabel: "Tell Us About Your Project",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Explore Website Services",
    secondaryCtaHref: "/services",
    seoTitle: "Need a Website for a New Business?",
    seoDescription:
      "Starting a new business? Learn how to plan the right website structure, content, platform, SEO and conversion foundations before design and launch.",
  },
  {
    name: "E-commerce Growth",
    title: "Your Online Store Isn’t Growing as It Should",
    slug: "ecommerce-growth",
    shortDescription:
      "Your store needs stronger product discovery, usability, performance and conversion across the buying journey.",
    category: "growth-conversion",
    featured: false,
    published: true,
    icon: "shopping-bag",
    relatedServiceHrefs: [
      "/services/ecommerce-development",
      "/services/conversion-rate-optimization",
      "/services/analytics-conversion-tracking",
      "/seo",
      "/services/website-performance-optimization",
    ],
    relatedPlatformSlugs: ["shopify", "woocommerce", "bigcommerce"],
    eyebrow: "E-commerce Growth",
    heroStatement: "More Store Traffic Doesn’t Automatically Mean More Sales.",
    heroSupporting:
      "E-commerce growth depends on how easily shoppers can discover products, understand their options, trust the store and complete a purchase across desktop and mobile.",
    possibleCauses: [
      {
        title: "Products are difficult to discover",
        description:
          "Navigation, categories, search or filters make it hard for shoppers to reach the right items.",
      },
      {
        title: "Product pages leave buying questions unanswered",
        description:
          "Imagery, options, shipping, returns or key details are unclear when shoppers need to decide.",
      },
      {
        title: "Trust information arrives too late — or not at all",
        description:
          "Shipping, returns, contact details, availability or payment clarity are missing when commitment matters.",
      },
      {
        title: "Cart or checkout adds unnecessary friction",
        description:
          "Unexpected costs, awkward mobile fields, account requirements or errors interrupt purchase completion.",
      },
      {
        title: "The store feels difficult on mobile",
        description:
          "Crowded grids, tiny filters, awkward variants or long checkout forms interrupt shopping on phones.",
      },
      {
        title: "Performance has become heavy",
        description:
          "Images, apps, scripts and widgets slow browsing, product viewing and checkout.",
      },
      {
        title: "Search engines struggle with the catalogue",
        description:
          "Category structure, product content, duplicates, indexing or faceted navigation limit organic discovery.",
      },
      {
        title: "Measurement cannot show where journeys break",
        description:
          "Without useful commerce events, teams guess at drop-offs instead of reviewing the shopping path.",
      },
    ],
    process: [
      { title: "Discover" },
      { title: "Browse" },
      { title: "Evaluate" },
      { title: "Commit" },
      { title: "Check out" },
      { title: "Return" },
    ],
    problemSymptoms: [
      "Visitors reach product pages but rarely buy",
      "Customers struggle to find the right products",
      "Add-to-cart activity is higher than checkout completion",
      "Mobile shopping feels awkward or slow",
      "Category or collection pages feel thin or confusing",
      "The store has accumulated many apps or plugins",
      "Shipping, delivery or returns information is unclear",
      "Organic product or category visibility is weak",
    ],
    whatWeReview: [
      "Traffic sources",
      "Navigation",
      "Categories",
      "Search and filtering",
      "Product pages",
      "Mobile UX",
      "Trust",
      "Cart",
      "Checkout",
      "Performance",
      "SEO",
      "Analytics",
      "Platform",
      "Apps and plugins",
      "Integrations",
    ],
    relatedServiceReasons: [
      {
        href: "/services/ecommerce-development",
        title: "E-commerce Development",
        reason:
          "Build or improve the store structure, product experience and technical commerce foundation around how customers need to shop.",
      },
      {
        href: "/services/conversion-rate-optimization",
        title: "Conversion Rate Optimization",
        reason:
          "Investigate friction across product, cart, checkout and campaign journeys when there is enough behaviour to review.",
      },
      {
        href: "/services/analytics-conversion-tracking",
        title: "Analytics & Conversion Tracking",
        reason:
          "Set up reliable commerce events so drop-offs can be reviewed before guessing at every cause.",
      },
      {
        href: "/seo",
        title: "SEO",
        reason:
          "Help customers discover categories, products and commercial content — without treating SEO as a substitute for the shopping experience.",
      },
      {
        href: "/services/website-performance-optimization",
        title: "Website Performance Optimization",
        reason:
          "Reduce the weight of images, apps, scripts and third-party tools that slow browsing and checkout.",
      },
    ],
    // No verified published e-commerce case studies — Related Work stays hidden.
    relatedProjectSlugs: [],
    relatedArticleSlugs: [
      "what-makes-a-website-convert",
      "technical-seo-foundations",
      "tools-to-test-wordpress-website",
    ],
    relatedSolutions: [
      {
        slug: "low-website-conversions",
        prompt:
          "Shoppers arrive but fail to complete important actions?",
      },
      {
        slug: "slow-website",
        prompt: "Is store performance creating friction?",
      },
      {
        slug: "website-migration",
        prompt: "Considering moving the store to another platform?",
      },
    ],
    faqs: [
      {
        question:
          "Why is my online store getting traffic but not enough sales?",
        answer:
          "Traffic alone does not create sales. Shoppers may struggle to find products, evaluate options, trust shipping or returns, complete checkout, or use the store comfortably on mobile. Growth depends on visibility, discovery, product experience, conversion and measurement together.",
      },
      {
        question: "How can I improve product discovery?",
        answer:
          "Review navigation, category naming, collection structure, site search, filters, sorting, related products and mobile browsing. Discovery becomes more important as catalogues grow — products that exist but cannot be found do not convert.",
      },
      {
        question: "What makes a good e-commerce product page?",
        answer:
          "A useful product page answers buying questions: clear name, relevant imagery, price, options, availability, key features, shipping and returns context, genuine reviews where available, and a clear purchase action. Not every product needs long copy.",
      },
      {
        question: "Can a slow store reduce sales?",
        answer:
          "Yes. Heavy images, apps, scripts and widgets can interrupt browsing, product viewing and checkout. Performance should be reviewed as part of the shopping experience — not only after complaints.",
      },
      {
        question: "Should I use Shopify, WooCommerce or BigCommerce?",
        answer:
          "It depends on catalogue needs, integrations, editing workflows, team skills and growth plans. Shopify is commerce-first and managed; WooCommerce offers WordPress-based flexibility; BigCommerce suits certain catalogue and integration needs. No platform is universally best.",
      },
      {
        question: "Do I need to redesign my entire store?",
        answer:
          "Not always. Some stores need targeted improvements to product pages, navigation, filters, checkout UX or performance. Broader redesign or migration becomes relevant when templates, structure or platform foundations significantly limit progress.",
      },
      {
        question: "How do I know where shoppers are dropping off?",
        answer:
          "Meaningful commerce events — such as product views, add to cart, checkout start and purchase — help show where journeys stop. Tracking is useful evidence, not perfect truth, and should support questions about mobile and desktop behaviour.",
      },
      {
        question: "Can you improve an existing online store?",
        answer:
          "Yes. Many stores improve through discovery, product experience, trust, cart/checkout, performance, SEO and measurement work on the current platform — without an automatic rebuild.",
      },
    ],
    ctaTitle: "Not Sure What’s Limiting Your Store?",
    ctaDescription:
      "We can review the shopping journey, product discovery, performance, measurement and platform setup to help identify where the most important opportunities may be.",
    primaryCtaLabel: "Tell Us About Your Store",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Get a Free Website Review",
    secondaryCtaHref: "/free-website-review",
    seoTitle: "Why Isn’t Your Online Store Growing?",
    seoDescription:
      "Explore the website, product discovery, SEO, performance, cart and checkout issues that may be limiting the growth of your online store.",
  },
  {
    name: "Local Business Visibility",
    title: "Nearby Customers Can’t Find or Contact You",
    slug: "local-business-visibility",
    shortDescription:
      "Customers nearby are searching for what you offer, but your website and local search presence are not helping them find or contact you.",
    category: "visibility",
    featured: false,
    published: true,
    icon: "map-pin",
    relatedServiceHrefs: [
      "/seo/local-seo",
      "/seo",
      "/services/website-audit",
      "/services/seo-copywriting",
      "/services/website-design",
    ],
    eyebrow: "Local Business Visibility",
    heroStatement: "Nearby Customers Are Searching. Can They Find You?",
    heroSupporting:
      "Local visibility depends on whether search engines understand what you do, where you operate and whether your business appears useful and credible to people searching nearby.",
    possibleCauses: [
      {
        title: "The business category or service is unclear",
        description:
          "People and search engines struggle to understand what the business actually offers.",
      },
      {
        title: "Google Business Profile information is incomplete or inconsistent",
        description:
          "Categories, hours, contact details, services or location information do not clearly reflect the real business.",
      },
      {
        title: "The website does not clearly explain where the business operates",
        description:
          "Visitors cannot tell whether the business is nearby, serves their area, or travels to customers.",
      },
      {
        title: "Important services do not have enough useful page content",
        description:
          "Service pages are thin, vague or missing, so local relevance is hard to establish.",
      },
      {
        title: "Location information conflicts across the web",
        description:
          "Name, address or phone details differ between the website, profile and other listings.",
      },
      {
        title: "The website provides weak local relevance signals",
        description:
          "Architecture, content and location context do not help search engines connect the business to real local needs.",
      },
      {
        title: "Reviews and reputation are limited or poorly managed",
        description:
          "Customers have little genuine feedback to evaluate quality, reliability or experience.",
      },
      {
        title: "The business is found, but the website makes contact difficult",
        description:
          "Calls, bookings, directions or enquiries are hard to complete once someone arrives.",
      },
    ],
    process: [
      { title: "Search" },
      { title: "Discover" },
      { title: "Verify" },
      { title: "Visit" },
      { title: "Contact" },
    ],
    problemSymptoms: [
      "The business appears only when searching the exact brand name",
      "Important local service searches rarely surface the business",
      "Website pages do not clearly mention real service areas",
      "Google profile information differs from the website",
      "Customers regularly ask whether the business serves their area",
      "Mobile visitors struggle to call, book or find directions",
      "Competitors consistently appear for highly relevant local searches",
      "Multiple location or service pages contain nearly identical content",
    ],
    whatWeReview: [
      "Business model",
      "Locations and service areas",
      "Google Business Profile",
      "Website structure",
      "Service pages",
      "Location information",
      "Mobile experience",
      "Reviews and reputation signals",
      "Business information consistency",
      "Search visibility",
      "Technical SEO",
      "Performance",
      "Contact journey",
      "Analytics",
    ],
    relatedServiceReasons: [
      {
        href: "/seo/local-seo",
        title: "Local SEO",
        reason:
          "Improve the website and local search foundations that help relevant nearby customers discover and understand the business.",
      },
      {
        href: "/seo",
        title: "SEO",
        reason:
          "Strengthen broader organic visibility when important service pages need to be discoverable beyond local profile results.",
      },
      {
        href: "/services/website-audit",
        title: "Website Audit",
        reason:
          "Review local visibility alongside UX, performance, SEO, content and conversion when several issues overlap.",
      },
      {
        href: "/services/seo-copywriting",
        title: "SEO Copywriting",
        reason:
          "Help pages clearly communicate services, real locations and customer needs — without city-name stuffing.",
      },
      {
        href: "/services/website-design",
        title: "Website Design",
        reason:
          "Improve clarity, location context and contact paths when the experience makes local discovery less useful.",
      },
    ],
    relatedProjectSlugs: [
      "the-coast",
      "overlook-cabin-rentals",
      "gemini-corporate-relocations",
    ],
    relatedArticleSlugs: [
      "technical-seo-foundations",
      "what-makes-a-website-convert",
      "website-redesign-checklist",
    ],
    relatedSolutions: [
      {
        slug: "website-not-generating-leads",
        prompt: "Visible locally, but enquiries are still low?",
      },
      {
        slug: "website-not-ranking",
        prompt: "Your website itself is struggling in organic search?",
      },
      {
        slug: "slow-website",
        prompt: "Mobile visitors are waiting too long?",
      },
    ],
    faqs: [
      {
        question: "Why doesn’t my business show up in local searches?",
        answer:
          "Nearby customers may struggle because the business category is unclear, the Google Business Profile is incomplete or inconsistent, the website does not explain where you operate, service content is weak, location information conflicts across the web, or contact is difficult after discovery. Multiple factors often combine.",
      },
      {
        question: "Do I need a Google Business Profile?",
        answer:
          "Many local businesses benefit from an accurate Google Business Profile that reflects real business information and works alongside the website. It should support discovery and trust — not replace a useful website.",
      },
      {
        question: "Does my website need to mention every area I serve?",
        answer:
          "No. The website should clearly explain where the business is based, which areas are genuinely served, and how customers contact or visit. Repeating place names unnaturally across every paragraph does not create useful local relevance.",
      },
      {
        question:
          "Should I create a page for every city or neighbourhood?",
        answer:
          "Not automatically. Mass-producing near-identical city or neighbourhood pages often creates weak content. A location page should exist when there is a legitimate reason to serve that place with useful unique information.",
      },
      {
        question: "Do reviews affect local visibility?",
        answer:
          "Genuine reviews are part of the trust journey and can help customers evaluate quality and reliability. They do not guarantee rankings, and buying or fabricating reviews is not recommended.",
      },
      {
        question: "Can Local SEO help a service-area business?",
        answer:
          "Yes, when handled honestly. Service-area businesses should explain coverage, services, contact process and proof of real work — without creating fake offices or misleading addresses.",
      },
      {
        question: "Do I need a new website to improve local visibility?",
        answer:
          "Not automatically. Some businesses mainly need profile and information improvements. Others need clearer service or location content, stronger contact paths or technical foundations. Redesign becomes relevant when structure and experience significantly limit discovery and conversion.",
      },
      {
        question: "Why does my competitor appear above me locally?",
        answer:
          "There may be several reasons — stronger relevance, better local information, reviews, website content, proximity or a more useful business profile. Local results also vary by searcher location and context. Analysis is needed before assuming a single cause.",
      },
    ],
    ctaTitle: "Can Nearby Customers Find and Choose Your Business?",
    ctaDescription:
      "We can review your website, local search presence and contact journey to help identify where customers may be struggling to discover or act on your business.",
    primaryCtaLabel: "Get a Free Website Review",
    primaryCtaHref: "/free-website-review",
    secondaryCtaLabel: "Tell Us About Your Business",
    secondaryCtaHref: "/contact",
    seoTitle: "Why Can’t Local Customers Find Your Business?",
    seoDescription:
      "Struggling to get found by nearby customers? Explore the website, Google Business Profile, location relevance, reputation and contact issues that may be limiting local visibility.",
  },
];

export const solutionsHubFaqs = [
  {
    question: "What if I’m not sure what my website needs?",
    answer:
      "Start with the situation that sounds closest on the Solutions page, use the Project Planner to describe the goals, or request a Free Website Review. You don’t need a technical diagnosis before the first conversation.",
  },
  {
    question: "Do I need a redesign to fix website problems?",
    answer:
      "Not always. Some issues improve with SEO, performance, conversion, content or tracking work. A redesign makes sense when structure, design and usability are fundamentally holding the site back — not by default.",
  },
  {
    question: "Can SEO and website improvements be handled together?",
    answer:
      "Yes. Ranking, clarity, performance and conversion often overlap. Smartlance plans those areas together when the problem spans more than one discipline.",
  },
  {
    question: "Can you work with my existing website?",
    answer:
      "Yes. Many engagements improve an existing site rather than starting from scratch — including audits, SEO, performance, conversion work and selective redesigns.",
  },
  {
    question: "What is the difference between a Solution and a Service?",
    answer:
      "Solutions start with the business problem — for example, low enquiries, weak search visibility or a slow site. Services are the capabilities used to solve it, such as design, development, SEO, performance or conversion work. One solution often draws on more than one service.",
  },
  {
    question: "Do you only work on complete website rebuilds?",
    answer:
      "No. Some projects are targeted improvements. Others are full redesigns or migrations. The right scope depends on what is actually limiting the website — the answer is not always a redesign.",
  },
] as const;

export const solutionsSelectedWorkSlugs = [
  "gemini-corporate-relocations",
  "the-coast",
  "nashville-home-viewer",
] as const;

export function getSolutionBySlug(slug: string) {
  return solutions.find((solution) => solution.slug === slug);
}

export function getPublishedSolutions() {
  return solutions.filter((solution) => solution.published);
}

export function getFeaturedSolutions() {
  return getPublishedSolutions().filter((solution) => solution.featured);
}

export function getSolutionsByCategory(category: SolutionCategoryId) {
  return getPublishedSolutions().filter(
    (solution) => solution.category === category,
  );
}

/** Safe href — only published solutions expose detail routes */
export function getSolutionHref(solution: Solution) {
  return solution.published ? `/solutions/${solution.slug}` : undefined;
}
