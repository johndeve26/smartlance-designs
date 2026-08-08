import type { SeoService } from "@/types";

export const seoServices: SeoService[] = [
  {
    slug: "technical-seo",
    title: "Technical SEO",
    href: "/seo/technical-seo",
    summary:
      "Make sure search engines can crawl, index and understand your website.",
    description:
      "Technical SEO helps search engines crawl, understand and index your website while improving performance, structure and usability for the people using it.",
    tagline: "Build a stronger technical foundation for search visibility.",
    icon: "settings",
    visualVariant: "technical",
    topics: [
      "Crawlability",
      "Indexability",
      "Sitemaps",
      "Robots.txt",
      "Canonicals",
      "Redirects",
      "Duplicate content",
      "Broken links",
      "Schema",
      "Core Web Vitals",
      "Site architecture",
      "Mobile usability",
    ],
    topicGroups: [
      {
        title: "Crawling & Indexing",
        description:
          "Help search engines access and include the pages that matter.",
        items: ["Crawlability", "Indexability", "Robots.txt", "XML sitemaps"],
      },
      {
        title: "URL & Site Structure",
        description:
          "Keep architecture clean so content is not fragmented or duplicated.",
        items: [
          "Canonicals",
          "Redirects",
          "Duplicate content",
          "Site architecture",
        ],
      },
      {
        title: "Technical Quality",
        description:
          "Strengthen performance, markup and usability that support search and experience.",
        items: [
          "Broken links",
          "Schema",
          "Core Web Vitals",
          "Mobile usability",
        ],
      },
    ],
    whyTitle:
      "A Website Can't Rank Properly If Search Engines Struggle to Understand It.",
    whyBody:
      "Good content and design still underperform when technical barriers get in the way. Technical SEO removes those barriers so the rest of your website work can take effect.",
    whyPoints: [
      "Blocked or hard-to-crawl pages",
      "Duplicate URLs and weak canonicals",
      "Poor site architecture",
      "Slow performance",
      "Broken links and redirect chains",
      "Incorrect indexing behaviour",
    ],
    differentiatorTitle: "Technical SEO Is Often a Development Problem Too.",
    differentiatorBody:
      "Many SEO issues live inside templates, routing, rendering, navigation, CMS configuration, page speed and markup. Smartlance's website development and redesign capability means findings can be fixed — not just reported.",
    differentiatorLinks: [
      { label: "Website Development", href: "/services/website-development" },
      { label: "Website Redesign", href: "/services/website-redesign" },
    ],
    idealFor: [
      "Important pages are not being indexed",
      "Search visibility dropped after a redesign or migration",
      "The website has redirect or canonical problems",
      "Page speed is poor",
      "Search Console reports technical issues",
      "The website has grown without a clear architecture",
      "You are preparing for a redesign or migration",
    ],
    deliverables: [
      "Technical SEO audit",
      "Crawl and indexation review",
      "Prioritized issue list",
      "Redirect and canonical recommendations",
      "Sitemap and robots review",
      "Core Web Vitals observations",
      "Schema recommendations",
      "Internal architecture recommendations",
      "Implementation guidance",
      "Post-fix validation where included",
    ],
    process: [
      {
        title: "Crawl",
        description:
          "Review how search engines can access and interpret the site.",
      },
      {
        title: "Diagnose",
        description:
          "Identify technical issues affecting indexation, structure and performance.",
      },
      {
        title: "Prioritize",
        description:
          "Separate high-impact problems from low-value fixes.",
      },
      {
        title: "Implement",
        description:
          "Fix issues directly or provide clear implementation guidance.",
      },
      {
        title: "Validate",
        description:
          "Confirm fixes and monitor the technical foundation.",
      },
    ],
    relatedProjectSlugs: [
      "overlook-cabin-rentals",
      "gemini-corporate-relocations",
      "the-coast",
    ],
    proofTitle: "Related website work",
    relatedSeoSlugs: ["local-seo", "on-page-seo", "seo-audit"],
    relatedServiceSlugs: [
      "website-development",
      "website-maintenance",
      "website-performance-optimization",
      "website-migration",
    ],
    faqs: [
      {
        question: "What is technical SEO?",
        answer:
          "Technical SEO covers the foundations that help search engines crawl, index and understand your website — including architecture, redirects, sitemaps, performance, schema and mobile usability.",
      },
      {
        question: "Is technical SEO a one-time project?",
        answer:
          "Major issues can be fixed in a focused project, but websites change. Ongoing monitoring helps catch new problems as content, plugins and features evolve.",
      },
      {
        question: "Will technical SEO alone improve rankings?",
        answer:
          "No. Technical SEO removes barriers. Rankings still depend on relevance, content quality, authority and competition. Strong foundations make everything else more effective.",
      },
      {
        question: "Can you fix the issues you find?",
        answer:
          "Yes. Many clients ask us to implement technical fixes directly — especially where the problems live in development, CMS configuration or site structure.",
      },
      {
        question: "Do you work with existing websites?",
        answer:
          "Yes. Technical SEO work often starts with an existing live site, a recent redesign, or a migration that introduced crawl or indexing issues.",
      },
      {
        question: "Does technical SEO include page speed?",
        answer:
          "Yes. Performance and Core Web Vitals observations are part of the review because speed affects both experience and technical quality.",
      },
      {
        question: "Should technical SEO be done before a redesign?",
        answer:
          "Ideally yes — or at least as part of redesign planning. Fixing structure, redirects and technical foundations during a rebuild is far more efficient than cleaning up after launch.",
      },
    ],
    ctaTitle: "Not Sure What's Holding Your Search Visibility Back?",
    ctaDescription:
      "Start with a structured review and identify the technical issues worth fixing first.",
    primaryCtaLabel: "Explore SEO Audit",
    primaryCtaHref: "/seo/seo-audit",
    secondaryCtaLabel: "Tell Us About Your Project",
    secondaryCtaHref: "/contact",
    metaTitle: "Technical SEO",
    metaDescription:
      "Technical SEO for crawlability, indexability, Core Web Vitals, schema, redirects, sitemaps and site architecture.",
  },
  {
    slug: "local-seo",
    title: "Local SEO",
    href: "/seo/local-seo",
    summary:
      "Help nearby customers find your business when they're ready to act.",
    description:
      "Local SEO helps businesses that serve specific locations improve visibility through Google Business Profile, local keywords, location pages, reviews, citations and local schema — without promising #1 rankings.",
    tagline:
      "Help nearby customers find your business when they're ready to act.",
    icon: "map-pin",
    visualVariant: "local",
    topics: [
      "Google Business Profile",
      "Local keyword strategy",
      "Local pages",
      "Reviews",
      "Citations",
      "Maps visibility",
      "Local schema",
    ],
    topicGroups: [
      {
        title: "Local Presence",
        description:
          "Make business information clear, consistent and discoverable.",
        items: [
          "Google Business Profile",
          "Business information consistency",
          "Reviews strategy",
        ],
      },
      {
        title: "Local Relevance",
        description:
          "Align content and keywords with location-based search intent.",
        items: [
          "Local keyword targeting",
          "Service and location content",
          "On-page local optimization",
        ],
      },
      {
        title: "Website Foundation",
        description:
          "Support local discovery with clear pages, structure and mobile performance.",
        items: [
          "Location pages",
          "Internal linking",
          "Local schema",
          "Mobile performance",
        ],
      },
    ],
    whyTitle:
      "Local Search Matters When Customers Look for Service + Place.",
    whyBody:
      "Many customers search by service and city, or with near-me intent. Local SEO strengthens the signals that help those people find the right business — on the website and in local discovery surfaces.",
    whyPoints: [
      "Real estate and property businesses",
      "Hospitality and vacation rentals",
      "Local professional services",
      "Restaurants and hospitality venues",
      "Service businesses with a clear service area",
    ],
    differentiatorTitle: "Local Visibility Still Needs a Website That Converts.",
    differentiatorBody:
      "Getting found locally only helps if the website explains the offer clearly and makes the next step obvious. Smartlance connects local SEO with website structure, landing pages and conversion paths.",
    differentiatorLinks: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Digital Marketing", href: "/services/digital-marketing" },
    ],
    idealFor: [
      "Customers search for your service by city or near me",
      "Your Google Business Profile needs stronger management",
      "Location or service-area pages are weak or missing",
      "Reviews and business information are inconsistent",
      "You serve one or more clear geographic markets",
    ],
    deliverables: [
      "Local SEO review",
      "Google Business Profile recommendations",
      "Local keyword and page opportunities",
      "Location page guidance",
      "Citation and consistency recommendations",
      "Local schema recommendations",
      "Prioritized action plan",
    ],
    process: [
      {
        title: "Audit",
        description: "Review local presence, website pages and visibility gaps.",
      },
      {
        title: "Strategy",
        description: "Define markets, page priorities and profile opportunities.",
      },
      {
        title: "Optimize",
        description: "Improve profile, pages, content and local signals.",
      },
      {
        title: "Build relevance",
        description: "Support reviews, citations, consistency and content.",
      },
      {
        title: "Measure",
        description: "Track progress and refine what deserves attention next.",
      },
    ],
    relatedProjectSlugs: ["the-coast", "banyan-vacations", "kaerek-homes"],
    proofTitle: "Related website work",
    relatedSeoSlugs: ["technical-seo", "on-page-seo", "seo-audit"],
    relatedServiceSlugs: ["website-design", "digital-marketing"],
    faqs: [
      {
        question: "What businesses benefit from local SEO?",
        answer:
          "Businesses that serve customers in specific places — such as property, hospitality, professional services and local service companies — often benefit most from local SEO.",
      },
      {
        question: "Do you manage Google Business Profiles?",
        answer:
          "We can review and recommend improvements to Google Business Profile setup and local presence. Ongoing management scope is agreed based on your needs.",
      },
      {
        question: "How long does local SEO take?",
        answer:
          "Some profile and page improvements can help relatively quickly, but meaningful local visibility usually builds over time through consistent work.",
      },
      {
        question: "Do I need location pages?",
        answer:
          "Not always. Location pages should be useful and distinct. Thin or duplicated pages can hurt more than help. We recommend them only where there is a real service and content opportunity.",
      },
      {
        question: "Can local SEO help a business with multiple locations?",
        answer:
          "Yes — with careful structure. Multi-location work needs clear pages, consistent business information and a plan that avoids thin or duplicated content.",
      },
      {
        question: "Do you guarantee Google Maps rankings?",
        answer:
          "No. Local rankings depend on relevance, proximity, prominence and competition. We focus on practical improvements that strengthen your local presence over time.",
      },
    ],
    ctaTitle: "Ready to Improve How Nearby Customers Find You?",
    ctaDescription:
      "Tell us about your service area and current website. We will recommend a practical local SEO starting point.",
    primaryCtaLabel: "Tell Us About Your Project",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Get a Free Website Review",
    secondaryCtaHref: "/free-website-review",
    metaTitle: "Local SEO",
    metaDescription:
      "Local SEO for Google Business Profile, Maps visibility, local pages, reviews, citations and location-focused search.",
  },
  {
    slug: "on-page-seo",
    title: "On-Page SEO",
    href: "/seo/on-page-seo",
    summary:
      "Make every important page easier to understand, discover and act on.",
    description:
      "On-page SEO improves how clearly each page communicates its topic through titles, headings, content structure, internal links and search intent alignment — so pages are easier to discover and easier to use.",
    tagline:
      "Make every important page easier to understand, discover and act on.",
    icon: "file-text",
    visualVariant: "onpage",
    topics: [
      "Keyword and intent mapping",
      "Title tags and meta descriptions",
      "Heading structure",
      "Content clarity",
      "Internal linking",
      "Image optimization",
      "Content hierarchy",
    ],
    topicGroups: [
      {
        title: "Search Intent",
        description:
          "Align each page with what people are actually looking for.",
        items: [
          "Keyword and topic alignment",
          "Page purpose",
          "Content relevance",
        ],
      },
      {
        title: "Page Structure",
        description:
          "Organize titles, headings, metadata and links so pages are clear.",
        items: [
          "Title tags",
          "Headings",
          "Metadata",
          "Internal linking",
        ],
      },
      {
        title: "User Experience",
        description:
          "Help visitors scan, understand and take the next step.",
        items: [
          "Content clarity",
          "Content hierarchy",
          "Conversion paths",
        ],
      },
    ],
    whyTitle: "Pages Need to Be Clear to Search Engines and to People.",
    whyBody:
      "On-page SEO is not keyword stuffing. It is about matching intent, structuring content clearly and making important pages useful — so they can rank and convert.",
    whyPoints: [
      "Important pages lack a clear topic focus",
      "Titles and headings do not match search intent",
      "Content is hard to scan or poorly structured",
      "Internal links do not support key journeys",
      "Pages attract traffic but do not guide action",
    ],
    differentiatorTitle: "Ranking the Page Is Only Half the Job.",
    differentiatorBody:
      "A page can attract traffic and still fail commercially. Smartlance considers search intent, clarity, design, CTAs and conversion together — because Website, SEO and Conversion belong in one system.",
    differentiatorLinks: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Landing Page Design", href: "/services/landing-page-design" },
      {
        label: "Conversion Optimization",
        href: "/services/conversion-rate-optimization",
      },
    ],
    idealFor: [
      "Key service pages are unclear or under-optimized",
      "Titles and headings do not match how people search",
      "Content exists but lacks structure and hierarchy",
      "Internal linking does not support important journeys",
      "Pages get traffic but struggle to convert",
    ],
    deliverables: [
      "On-page SEO review",
      "Intent and page purpose mapping",
      "Title and metadata recommendations",
      "Heading and content hierarchy guidance",
      "Internal linking recommendations",
      "Conversion-minded content structure notes",
    ],
    process: [
      {
        title: "Map",
        description: "Clarify important pages, intent and commercial goals.",
      },
      {
        title: "Review",
        description: "Assess titles, content structure, links and clarity.",
      },
      {
        title: "Refine",
        description: "Improve hierarchy, messaging and on-page signals.",
      },
      {
        title: "Connect",
        description: "Strengthen internal links and conversion paths.",
      },
    ],
    relatedProjectSlugs: [
      "the-coast",
      "gemini-corporate-relocations",
      "zen-stays-rental",
    ],
    proofTitle: "Related website work",
    relatedSeoSlugs: ["technical-seo", "seo-audit", "local-seo"],
    relatedServiceSlugs: [
      "website-design",
      "landing-page-design",
      "seo-copywriting",
    ],
    faqs: [
      {
        question: "Is on-page SEO just adding keywords?",
        answer:
          "No. Effective on-page SEO is about matching search intent, organizing content clearly and making pages useful — not stuffing keywords into every sentence.",
      },
      {
        question: "Do you rewrite all page content?",
        answer:
          "Not always. Some pages need structural and metadata improvements. Others need clearer copy. Scope depends on what the review finds.",
      },
      {
        question: "Does on-page SEO include conversion?",
        answer:
          "We consider clarity and next steps as part of the work. A page that ranks but does not guide action is only half finished.",
      },
      {
        question: "Can on-page SEO help existing pages?",
        answer:
          "Yes. Many projects focus on improving important service, location or landing pages that already exist.",
      },
      {
        question: "How does this relate to technical SEO?",
        answer:
          "Technical SEO helps search engines access and understand the site. On-page SEO helps each page communicate its topic clearly. They work best together.",
      },
    ],
    ctaTitle: "Ready to Make Your Important Pages Clearer?",
    ctaDescription:
      "Tell us which pages matter most. We will help improve structure, clarity and search alignment.",
    primaryCtaLabel: "Tell Us About Your Project",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Get a Free Website Review",
    secondaryCtaHref: "/free-website-review",
    metaTitle: "On-Page SEO",
    metaDescription:
      "On-page SEO for titles, headings, content structure, internal linking and search intent alignment.",
  },
  {
    slug: "seo-audit",
    title: "SEO Audit",
    href: "/seo/seo-audit",
    summary:
      "Find what's limiting your visibility — and what deserves attention first.",
    description:
      "An SEO audit examines technical health, content, keywords, indexing, internal linking, speed and competitive context — then turns findings into a practical, prioritized action plan.",
    tagline:
      "Find what's limiting your visibility — and what deserves attention first.",
    icon: "clipboard-check",
    visualVariant: "audit",
    topics: [
      "Technical audit",
      "Content audit",
      "Keyword opportunities",
      "Indexing",
      "Internal linking",
      "Speed",
      "Competitor observations",
      "Prioritized recommendations",
    ],
    topicGroups: [
      {
        title: "Technical",
        description: "Crawl, indexation, redirects, structure and performance.",
        items: [
          "Technical health",
          "Indexing",
          "Site architecture",
          "Performance",
        ],
      },
      {
        title: "On-Page & Content",
        description: "Page clarity, relevance and internal linking.",
        items: [
          "On-page review",
          "Content opportunities",
          "Internal linking",
          "Keyword opportunities",
        ],
      },
      {
        title: "Priorities",
        description: "What to fix first — and what can wait.",
        items: [
          "Critical issues",
          "High-impact improvements",
          "Medium priorities",
          "Opportunities",
        ],
      },
    ],
    whyTitle: "An Audit Should Create Clarity, Not a Jargon Dump.",
    whyBody:
      "The value of an SEO audit is prioritization. You should understand what is holding visibility back, why it matters, and which actions deserve attention first.",
    whyPoints: [
      "Technical barriers to crawl and indexation",
      "Weak page structure or content clarity",
      "Internal linking gaps",
      "Performance issues",
      "Local visibility gaps where relevant",
      "Search opportunities worth pursuing",
    ],
    differentiatorTitle: "From Findings to Implementation.",
    differentiatorBody:
      "Smartlance can go beyond the report. Many clients ask us to implement technical fixes, content improvements or website changes after the audit — because Website, SEO and Conversion sit in one system.",
    differentiatorLinks: [
      { label: "Website Development", href: "/services/website-development" },
      { label: "Website Redesign", href: "/services/website-redesign" },
      { label: "Technical SEO", href: "/seo/technical-seo" },
    ],
    idealFor: [
      "You are not sure what is holding search visibility back",
      "Visibility dropped after a redesign or migration",
      "You need clearer priorities before investing in SEO work",
      "Search Console shows issues you need help interpreting",
      "You want a practical plan rather than a vague report",
    ],
    deliverables: [
      "Structured SEO findings",
      "Prioritized issue list",
      "Impact explanation for key findings",
      "Recommended actions",
      "Implementation guidance where included",
      "Optional follow-on implementation support",
    ],
    process: [
      {
        title: "Discover",
        description: "Clarify goals, market and current website context.",
      },
      {
        title: "Crawl",
        description: "Review technical access, indexing and site structure.",
      },
      {
        title: "Review",
        description: "Assess content, on-page signals and internal linking.",
      },
      {
        title: "Prioritize",
        description: "Separate critical issues from medium priorities and opportunities.",
      },
      {
        title: "Recommend",
        description: "Deliver a clear action plan and next-step guidance.",
      },
    ],
    relatedProjectSlugs: [
      "overlook-cabin-rentals",
      "gemini-corporate-relocations",
    ],
    proofTitle: "Related website work",
    relatedSeoSlugs: ["technical-seo", "on-page-seo", "local-seo"],
    relatedServiceSlugs: [
      "website-redesign",
      "website-development",
      "website-audit",
    ],
    faqs: [
      {
        question: "What do I receive after an SEO audit?",
        answer:
          "You receive clear findings, evidence where useful, and prioritized recommendations so you know what to fix first — not a vague report full of jargon.",
      },
      {
        question: "Can you implement the audit recommendations?",
        answer:
          "Yes. Many clients ask us to implement technical fixes, content improvements or broader website changes after the audit.",
      },
      {
        question: "Is an SEO audit the same as a free website review?",
        answer:
          "No. A free website review is a focused starting conversation. An SEO audit is a structured diagnostic with prioritized findings and recommended actions.",
      },
      {
        question: "Do you guarantee ranking improvements from an audit?",
        answer:
          "No. An audit creates clarity and priorities. Results depend on competition, implementation quality, content and ongoing work.",
      },
      {
        question: "Should I audit before a redesign?",
        answer:
          "Often yes. An audit helps identify technical, structural and content issues that should inform redesign decisions.",
      },
    ],
    ctaTitle: "Want Clearer Priorities for Your SEO?",
    ctaDescription:
      "Request an SEO audit and get a practical plan around what will actually move the needle.",
    primaryCtaLabel: "Request an SEO Audit",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Tell Us About Your Project",
    secondaryCtaHref: "/contact",
    metaTitle: "SEO Audit",
    metaDescription:
      "SEO audits covering technical issues, content, keywords, indexing, internal linking, speed and prioritized recommendations.",
  },
];

export function getSeoServiceBySlug(slug: string) {
  return seoServices.find((service) => service.slug === slug);
}

export function getRelatedSeoServices(slugs: string[] = []) {
  return slugs
    .map((slug) => seoServices.find((service) => service.slug === slug))
    .filter((service): service is SeoService => Boolean(service));
}

export const seoHubFaqs = [
  {
    question: "How long does SEO take?",
    answer:
      "Some technical fixes can help quickly, but meaningful organic growth usually takes consistent work over months — especially in competitive markets.",
  },
  {
    question: "Do you promise first-page rankings?",
    answer:
      "No. Rankings depend on competition, demand, content quality and authority. We improve the factors you can control and measure progress honestly.",
  },
  {
    question: "Should SEO start before the website is built?",
    answer:
      "Ideally yes. Keyword strategy, page structure, technical foundations and content planning are more effective when considered during design and development.",
  },
  {
    question: "Is SEO separate from website design?",
    answer:
      "It should not be. Design, development, SEO and conversion work best as one plan — because a polished site that nobody finds or converts on does not help the business.",
  },
];
