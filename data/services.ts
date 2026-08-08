/** @migration-reference Phase 2 — runtime reads DB repositories; this file remains seed/reference source. */
import type { Service, ServiceGroupId } from "@/types";
import { additionalServices } from "@/data/additional-services";

/**
 * Service catalogue + service-detail presentation fields.
 * Routes, metadata fields and core service identity are preserved.
 */
export const services: Service[] = [
  {
    slug: "website-design",
    title: "Website Design",
    href: "/services/website-design",
    category: "design",
    group: "websites",
    navigationFeatured: true,
    summary:
      "Modern websites built around user experience and business goals.",
    description:
      "We design responsive websites around your customers, your brand and the actions that matter — from first impression to enquiry, booking or purchase.",
    tagline: "Clear experiences that build trust and guide action.",
    visualVariant: "design",
    audience:
      "Businesses that need a clearer, more trustworthy website experience",
    capabilities: [
      {
        title: "UX & Information Architecture",
        description:
          "Structure pages and journeys so visitors understand your offer quickly.",
        icon: "layers",
      },
      {
        title: "Visual Interface Design",
        description:
          "Polished UI that reflects your brand without sacrificing usability.",
        icon: "palette",
      },
      {
        title: "Conversion-Focused Layouts",
        description:
          "Hierarchy, CTAs and content blocks designed to support enquiries and sales.",
        icon: "mouse-pointer-click",
      },
      {
        title: "Responsive Design Systems",
        description:
          "Consistent layouts across mobile, tablet and desktop from the start.",
        icon: "smartphone",
      },
      {
        title: "Content Hierarchy",
        description:
          "Headings, sections and messaging order that support scanning and SEO.",
        icon: "pen-tool",
      },
    ],
    narrativeTitle: "Design Decisions With a Business Purpose",
    narrative:
      "Strong websites start with clarity. We design experiences that explain what you do, feel professional on every device and guide visitors toward the next step — whether that is an enquiry, booking or purchase. Design decisions stay tied to business goals, brand consistency and the practical realities of development and SEO.",
    seoConnection:
      "Good design improves clarity and action. Structure, headings and page intent are planned with discoverability in mind — so the experience supports SEO rather than fighting it.",
    idealFor: [
      "You are launching something new and need a clear first impression",
      "Your website does not reflect the quality of the business",
      "Users struggle to understand what you offer",
      "The current experience feels inconsistent across pages or devices",
      "Your team needs reusable design foundations for future pages",
    ],
    ctaTitle: "Ready to Improve How Your Website Looks and Works?",
    ctaDescription:
      "Tell us about your goals and current site. We will recommend a clear next step for design, development or both.",
    relatedProjectSlugs: [
      "the-coast",
      "zen-stays-rental",
      "gemini-corporate-relocations",
    ],
    icon: "palette",
    featured: true,
    problems: [
      "Visitors cannot quickly understand the offer",
      "The website feels dated or untrustworthy",
      "Mobile users struggle with navigation",
      "Pages do not guide visitors toward action",
      "Branding feels inconsistent across the site",
    ],
    deliverables: [
      "UX research and information architecture",
      "Wireframes for key pages",
      "High-fidelity UI design",
      "Responsive layouts for mobile, tablet and desktop",
      "Conversion-focused page structure",
      "Design system foundations for consistency",
    ],
    process: [
      {
        title: "Understand",
        description: "Clarify goals, audience, offer and competitive context.",
      },
      {
        title: "Structure",
        description: "Map page hierarchy, user journeys and content priorities.",
      },
      {
        title: "Design",
        description: "Create polished interfaces with clear hierarchy and CTAs.",
      },
      {
        title: "Refine",
        description: "Iterate based on feedback before development begins.",
      },
    ],
    faqs: [
      {
        question: "Do you design from scratch or use templates?",
        answer:
          "We design around your brand, audience and conversion goals. Templates can be a starting point when appropriate, but the final experience should feel purpose-built for your business.",
      },
      {
        question: "Will the design work on mobile?",
        answer:
          "Yes. Responsive behaviour is planned from the start — not treated as an afterthought once the desktop layout is finished.",
      },
      {
        question: "Can you redesign an existing website?",
        answer:
          "Absolutely. Many projects begin with an audit of what is working, what is confusing and what needs to change before redesigning.",
      },
      {
        question: "Do you also develop the website?",
        answer:
          "Yes. Design and development are often delivered together so the finished site matches the intended experience, performance and SEO foundations.",
      },
      {
        question: "Is SEO considered during design?",
        answer:
          "Yes. Structure, headings, content hierarchy and page intent are planned with discoverability and clarity in mind from the start.",
      },
      {
        question: "How long does the design process take?",
        answer:
          "It depends on scope, content readiness and feedback speed. A focused marketing-site design often takes several weeks. Larger redesigns take longer. We confirm timelines during discovery.",
      },
    ],
    relatedServiceSlugs: [
      "website-development",
      "website-redesign",
      "ui-ux-design",
      "website-strategy",
      "branding",
    ],
    relatedSeoSlugs: ["on-page-seo"],
    relatedPlatformSlugs: [
      "wordpress",
      "webflow",
      "wix-studio",
      "squarespace",
      "framer",
    ],
    metaTitle: "Website Design",
    metaDescription:
      "Professional website design focused on user experience, brand clarity and conversion — built to support SEO and business growth.",
  },
  {
    slug: "website-development",
    title: "Website Development",
    href: "/services/website-development",
    category: "development",
    group: "websites",
    navigationFeatured: true,
    summary:
      "Fast, responsive and reliable websites built for performance.",
    description:
      "We develop websites that load quickly, work across devices, remain maintainable over time and support the SEO and conversion foundations your business needs.",
    tagline: "Fast, maintainable builds with SEO-ready foundations.",
    visualVariant: "development",
    audience:
      "Businesses that need a reliable, performant website they can grow on",
    capabilities: [
      {
        title: "Responsive Front-End Builds",
        description:
          "Clean, reliable implementations that match the designed experience across devices.",
        icon: "monitor",
      },
      {
        title: "CMS & Content Setup",
        description:
          "Platform choices guided by your content, catalogue and long-term operations.",
        icon: "layers",
      },
      {
        title: "Integrations & Forms",
        description:
          "Forms, analytics, bookings and third-party tools connected into one reliable experience.",
        icon: "plug",
      },
      {
        title: "Performance & Accessibility",
        description:
          "Speed, accessibility and maintainable structure built into the development process.",
        icon: "gauge",
      },
      {
        title: "SEO Technical Foundations",
        description:
          "Clean markup, sensible URLs, metadata and crawl-friendly structure from day one.",
        icon: "search",
      },
    ],
    narrativeTitle: "Built for Performance, Clarity and Growth",
    narrative:
      "Development should protect the experience — not compromise it. We build responsive sites with performance, accessibility and SEO foundations included, whether the right stack is a modern framework or WordPress for day-to-day content management.",
    seoConnection:
      "Development affects speed, crawlability and usability. Technical SEO foundations — markup, URLs, metadata and performance — are part of the build, not a cleanup job after launch.",
    idealFor: [
      "You need a new website built properly from an approved design",
      "Your current site is slow, fragile or hard to update",
      "You need CMS setup so your team can manage content",
      "Forms, analytics or bookings need reliable integration",
      "You want SEO and performance built into the technical foundations",
    ],
    ctaTitle: "Ready to Build Your Website Properly?",
    ctaDescription:
      "Share your goals, current site and preferred platform. We will recommend a practical build approach.",
    relatedProjectSlugs: [
      "gemini-corporate-relocations",
      "banyan-vacations",
      "zen-stays-rental",
    ],
    icon: "code",
    featured: true,
    problems: [
      "Your website is slow or unstable",
      "Updates are difficult or expensive",
      "Mobile experience is unreliable",
      "Technical SEO foundations are weak",
      "Integrations and forms are fragile",
    ],
    deliverables: [
      "Responsive front-end development",
      "Performance-focused implementation",
      "Accessibility best practices",
      "SEO technical foundations",
      "CMS or content editing setup where needed",
      "Forms, analytics and essential integrations",
    ],
    process: [
      {
        title: "Plan",
        description: "Define technical approach, content model and integrations.",
      },
      {
        title: "Build",
        description: "Develop clean, responsive pages with performance in mind.",
      },
      {
        title: "Test",
        description: "Check devices, forms, accessibility and technical quality.",
      },
      {
        title: "Launch",
        description: "Deploy carefully with tracking and monitoring in place.",
      },
    ],
    faqs: [
      {
        question: "What technologies do you use?",
        answer:
          "We choose technology based on the project. Modern frameworks are often a strong fit for performance and SEO, and WordPress remains a practical choice when content management and editor workflows matter most.",
      },
      {
        question: "Will I be able to update content myself?",
        answer:
          "Where needed, we set up a content management approach so you can update pages, blog posts or key sections without developer involvement for every change.",
      },
      {
        question: "Do you build with SEO in mind?",
        answer:
          "Yes. Clean markup, sensible URLs, metadata, performance, mobile usability and internal linking foundations are part of the development process.",
      },
      {
        question: "Can you develop from an existing design?",
        answer:
          "Yes. We can implement approved designs — from Smartlance or another designer — with attention to fidelity, responsiveness and technical quality.",
      },
      {
        question: "Do you provide support after launch?",
        answer:
          "Yes. Website maintenance, updates and ongoing improvements can continue after go-live when you need ongoing support.",
      },
    ],
    relatedServiceSlugs: [
      "website-design",
      "website-maintenance",
      "website-redesign",
      "website-performance-optimization",
      "website-migration",
      "analytics-conversion-tracking",
    ],
    relatedSeoSlugs: ["technical-seo"],
    relatedPlatformSlugs: ["wordpress"],
    metaTitle: "Website Development",
    metaDescription:
      "Fast, responsive website development with performance, accessibility and SEO foundations built in.",
  },
  {
    slug: "website-redesign",
    title: "Website Redesign",
    href: "/services/website-redesign",
    category: "design",
    group: "websites",
    navigationFeatured: true,
    summary: "Transform outdated or underperforming websites.",
    description:
      "If your website looks old, loads slowly, confuses visitors or fails to generate enquiries, a focused redesign can improve clarity, trust, usability and conversion — without guessing what needs to change.",
    tagline:
      "Refresh underperforming websites without losing what already works.",
    visualVariant: "redesign",
    audience:
      "Businesses with outdated, slow or underperforming websites",
    evaluationItems: [
      "Design and brand consistency",
      "Information architecture and navigation",
      "Mobile usability",
      "Page speed and technical performance",
      "SEO foundations and URL structure",
      "Conversion paths and CTAs",
      "Content clarity and trust signals",
      "CMS and update workflow",
    ],
    capabilities: [
      {
        title: "Site Evaluation",
        description:
          "Diagnose design, usability, speed, SEO and conversion issues before redesigning.",
        icon: "clipboard-check",
      },
      {
        title: "Modern UX Redesign",
        description:
          "Update structure and visuals so the site feels current, clear and trustworthy.",
        icon: "refresh-cw",
      },
      {
        title: "Migration Planning",
        description:
          "Protect URLs, content and SEO foundations during the transition.",
        icon: "shield",
      },
      {
        title: "Conversion Improvements",
        description:
          "Strengthen journeys, CTAs and page clarity as part of the redesign.",
        icon: "target",
      },
    ],
    narrativeTitle: "A Redesign Should Start With Diagnosis",
    narrative:
      "We evaluate what is working, what is confusing and what is holding the site back, then rebuild clarity, trust and performance around your real business goals. The aim is a website that looks current and converts better, while protecting the SEO and operational foundations you already rely on.",
    seoConnection:
      "A redesign is an opportunity to fix structure and SEO problems — URLs, redirects, content hierarchy and technical foundations — not just refresh the look.",
    idealFor: [
      "Your website looks dated compared with competitors",
      "Navigation and messaging confuse first-time visitors",
      "Mobile experience is poor or inconsistent",
      "Pages are not converting despite traffic",
      "Search visibility has stalled after years of patchwork changes",
    ],
    ctaTitle: "Is Your Current Website Holding You Back?",
    ctaDescription:
      "Request a free review or book a call — we will help you see what needs redesigning and what should be kept.",
    relatedProjectSlugs: [
      "overlook-cabin-rentals",
      "the-coast",
      "banyan-vacations",
    ],
    icon: "refresh-cw",
    featured: true,
    problems: [
      "Your website looks dated compared with competitors",
      "Navigation is confusing",
      "Mobile experience is poor",
      "Pages are not converting",
      "Search visibility has stalled",
      "Content is hard to update",
    ],
    deliverables: [
      "Current-site evaluation",
      "UX and conversion recommendations",
      "Updated information architecture",
      "Modern responsive redesign",
      "Improved page speed foundations",
      "SEO-aware migration planning",
    ],
    process: [
      {
        title: "Evaluate",
        description:
          "Review design, usability, SEO, speed, content and conversion paths.",
      },
      {
        title: "Prioritize",
        description: "Identify what to keep, improve, rebuild or remove.",
      },
      {
        title: "Redesign",
        description: "Create a clearer, more trustworthy experience.",
      },
      {
        title: "Rebuild & Launch",
        description: "Develop, migrate carefully and launch with tracking in place.",
      },
    ],
    faqs: [
      {
        question: "Do I need a full rebuild or just a visual refresh?",
        answer:
          "That depends on what we find. Some sites need a visual update; others need structural, technical and conversion changes. We evaluate before recommending the right level of work.",
      },
      {
        question: "Will redesigning hurt my SEO?",
        answer:
          "A redesign can support SEO when planned carefully. We consider URLs, redirects, metadata, content structure and technical foundations so visibility is protected during the transition.",
      },
      {
        question: "Can you work with my current platform?",
        answer:
          "Often yes. Many redesigns stay on WordPress or another established platform when it remains the right fit for content and operations.",
      },
      {
        question: "How do you decide what to keep?",
        answer:
          "We review analytics, content quality, brand assets and technical constraints — then prioritize changes that improve clarity, trust and conversion without discarding what already works.",
      },
    ],
    relatedServiceSlugs: [
      "website-design",
      "website-development",
      "website-audit",
      "website-migration",
      "website-performance-optimization",
    ],
    relatedSeoSlugs: ["seo-audit", "technical-seo"],
    relatedPlatformSlugs: ["wordpress"],
    metaTitle: "Website Redesign",
    metaDescription:
      "Redesign outdated or underperforming websites to improve clarity, speed, trust, SEO foundations and conversion.",
  },
  {
    slug: "ecommerce-development",
    title: "E-commerce Development",
    shortTitle: "E-commerce",
    href: "/services/ecommerce-development",
    category: "development",
    group: "websites",
    navigationFeatured: true,
    summary:
      "Build high-performing online stores that make buying easy.",
    description:
      "We help businesses create online stores focused on product discovery, trust, mobile commerce, performance and conversion — with platform choices guided by your catalogue, operations and growth goals.",
    tagline:
      "Online stores built for discovery, trust and smoother checkout.",
    visualVariant: "ecommerce",
    audience:
      "Businesses that need clearer product journeys and a better buying experience",
    platformsNote:
      "Platform recommendations depend on your catalogue, budget, integrations and team. Smartlance works with Shopify and BigCommerce where they are the right fit — and discusses options openly rather than forcing one system.",
    capabilities: [
      {
        title: "Store Experience Design",
        description:
          "Navigation and product journeys that make browsing and buying easier.",
        icon: "store",
      },
      {
        title: "Product & Category Pages",
        description:
          "Clear merchandising layouts that support trust and decision-making.",
        icon: "shopping-bag",
      },
      {
        title: "Checkout Optimization",
        description:
          "Reduce friction across cart, forms and payment pathways.",
        icon: "mouse-pointer-click",
      },
      {
        title: "Performance & Store SEO",
        description:
          "Speed, structure and technical foundations that support growth.",
        icon: "gauge",
      },
    ],
    narrativeTitle: "Commerce That Supports Discovery and Decisions",
    narrative:
      "Ecommerce success depends on more than launching a storefront. We focus on product discovery, mobile shopping, trust and conversion — with platform decisions guided by your catalogue, operations and growth goals.",
    seoConnection:
      "Product discoverability and conversion need to work together. Store structure, category pages and performance all affect how customers find and buy products.",
    idealFor: [
      "You are launching a new online store",
      "Product pages are unclear or hard to browse",
      "Mobile shopping feels clumsy",
      "Checkout friction is hurting sales",
      "Store SEO and page speed need attention",
    ],
    ctaTitle: "Ready to Build a Better Buying Experience?",
    ctaDescription:
      "Tell us about your catalogue, platform and goals. We will recommend a practical path forward.",
    relatedProjectSlugs: [],
    icon: "shopping-bag",
    featured: true,
    problems: [
      "Product pages are unclear or hard to browse",
      "Checkout friction is hurting sales",
      "Mobile shopping feels clumsy",
      "Store SEO is weak",
      "Page speed is slowing customers down",
    ],
    deliverables: [
      "Store UX and navigation planning",
      "Product and category page design",
      "Checkout and conversion improvements",
      "Mobile commerce focus",
      "SEO-friendly store structure",
      "Performance optimization",
    ],
    process: [
      {
        title: "Scope",
        description: "Clarify catalogue size, operations, payments and growth goals.",
      },
      {
        title: "Design",
        description: "Shape product discovery, trust signals and buying journeys.",
      },
      {
        title: "Build",
        description: "Implement the store with performance and SEO in mind.",
      },
      {
        title: "Optimize",
        description: "Refine key flows and prepare for ongoing improvements.",
      },
    ],
    faqs: [
      {
        question: "Which e-commerce platforms do you work with?",
        answer:
          "Platform recommendations depend on your catalogue, budget, integrations and team. Smartlance has experience contexts spanning Shopify and BigCommerce where relevant. We discuss options openly and choose what fits the business.",
      },
      {
        question: "Can you improve an existing online store?",
        answer:
          "Yes. Many projects focus on redesigning product pages, simplifying navigation, improving speed or strengthening SEO and conversion paths on an existing store.",
      },
      {
        question: "Do you handle payments and shipping setup?",
        answer:
          "We help configure essential storefront journeys and can coordinate with your payment, fulfilment and operational tools. Exact scope depends on the platform and your existing systems.",
      },
    ],
    relatedServiceSlugs: [
      "website-development",
      "conversion-rate-optimization",
      "website-maintenance",
    ],
    relatedSeoSlugs: ["technical-seo", "on-page-seo"],
    relatedPlatformSlugs: ["shopify", "woocommerce", "bigcommerce"],
    metaTitle: "E-commerce Development",
    metaDescription:
      "E-commerce websites focused on product discovery, mobile shopping, performance, SEO and conversion.",
  },
  {
    slug: "landing-page-design",
    title: "Landing Page Design",
    href: "/services/landing-page-design",
    category: "design",
    group: "websites",
    summary:
      "Campaign pages designed to generate leads and drive action.",
    description:
      "We design landing pages for paid campaigns, product launches, service offers and lead generation — with clear messaging, focused structure and conversion-minded layouts.",
    tagline: "Focused pages designed to turn attention into action.",
    visualVariant: "landing",
    audience:
      "Teams running campaigns, launches or lead-generation offers",
    capabilities: [
      {
        title: "Offer Clarification",
        description:
          "Sharpen messaging so visitors understand the value quickly.",
        icon: "pen-tool",
      },
      {
        title: "Conversion Structure",
        description:
          "One audience, one offer and one clear primary action.",
        icon: "layout-template",
      },
      {
        title: "Form & CTA Design",
        description:
          "Reduce friction and place next steps where they matter most.",
        icon: "mouse-pointer-click",
      },
      {
        title: "Campaign Variants",
        description:
          "Layouts ready for paid traffic, launches and offer testing.",
        icon: "megaphone",
      },
    ],
    narrativeTitle: "One Offer. One Audience. One Clear Action.",
    narrative:
      "Landing pages work best when they remove distraction. We design focused experiences for campaigns, launches and lead generation — with clear messaging, purposeful structure and conversion-minded layouts that still feel consistent with your brand.",
    seoConnection:
      "Campaign traffic only matters if the page converts. Landing pages should make the offer obvious and the next step easy — whether visitors arrive from ads, email or organic search.",
    idealFor: [
      "Paid traffic is landing on weak or generic pages",
      "You are launching a product, service or seasonal offer",
      "Your offer is unclear above the fold",
      "Forms feel too long or poorly placed",
      "Mobile conversion is weaker than it should be",
    ],
    ctaTitle: "Need a Landing Page Built to Convert?",
    ctaDescription:
      "Tell us about the campaign, offer and audience. We will help shape a focused page that supports action.",
    relatedProjectSlugs: ["the-coast", "kaerek-homes"],
    icon: "layout-template",
    featured: false,
    problems: [
      "Campaign traffic is not converting",
      "Your offer is unclear above the fold",
      "Forms feel too long or poorly placed",
      "Landing pages look disconnected from your brand",
      "Mobile conversion is weak",
    ],
    deliverables: [
      "Message and offer clarification",
      "Conversion-focused page structure",
      "Desktop and mobile landing page design",
      "Form and CTA optimization",
      "Variants for campaign testing where needed",
    ],
    process: [
      {
        title: "Clarify",
        description: "Define audience, offer, proof points and primary action.",
      },
      {
        title: "Structure",
        description: "Map a focused page flow from headline to conversion.",
      },
      {
        title: "Design",
        description: "Create a clear, brand-consistent campaign experience.",
      },
      {
        title: "Refine",
        description: "Tighten messaging, forms and mobile behaviour before launch.",
      },
    ],
    faqs: [
      {
        question: "Are landing pages different from website pages?",
        answer:
          "Yes. Landing pages are usually more focused — one offer, one audience, one primary action. They remove distractions so visitors can decide faster.",
      },
      {
        question: "Can you design pages for paid ads?",
        answer:
          "Yes. Many landing pages are built specifically for paid traffic, launches and lead-generation campaigns.",
      },
      {
        question: "Do you also handle the form and tracking setup?",
        answer:
          "We can design conversion-minded forms and coordinate analytics or CRM handoffs as part of the project scope.",
      },
    ],
    relatedServiceSlugs: [
      "website-design",
      "digital-marketing",
      "conversion-rate-optimization",
    ],
    relatedSeoSlugs: ["on-page-seo"],
    relatedPlatformSlugs: ["salesforce", "clixlo"],
    metaTitle: "Landing Page Design",
    metaDescription:
      "Landing pages designed for lead generation, paid campaigns, launches and offers — focused on clarity and conversion.",
  },
  {
    slug: "conversion-rate-optimization",
    title: "Conversion Rate Optimization",
    shortTitle: "Conversion Optimization",
    href: "/services/conversion-rate-optimization",
    category: "growth",
    group: "conversion-measurement",
    navigationFeatured: true,
    summary:
      "Improve how effectively traffic becomes enquiries, bookings or sales.",
    description:
      "We help businesses improve conversion by clarifying page hierarchy, strengthening calls to action, reducing friction in forms and journeys, and using analytics to guide practical improvements — without promising guaranteed lifts.",
    tagline:
      "Practical improvements that help visitors take the next step.",
    visualVariant: "cro",
    audience:
      "Businesses getting traffic but not enough enquiries, bookings or sales",
    capabilities: [
      {
        title: "Conversion Reviews",
        description:
          "Identify friction in page hierarchy, messaging and journeys.",
        icon: "clipboard-check",
      },
      {
        title: "CTA & Messaging",
        description:
          "Strengthen calls to action and clarify what visitors should do next.",
        icon: "target",
      },
      {
        title: "Form & Funnel Analysis",
        description:
          "Reduce unnecessary steps that slow enquiries, bookings or sales.",
        icon: "line-chart",
      },
      {
        title: "Testing Priorities",
        description:
          "Create a practical roadmap of improvements without unverifiable promises.",
        icon: "trending-up",
      },
    ],
    narrativeTitle: "More Traffic Only Helps When Pages Convert",
    narrative:
      "We improve clarity, strengthen CTAs, reduce form friction and use analytics to guide practical changes — without guaranteeing lifts. The focus stays on usable improvements that help visitors become enquiries, bookings or customers.",
    seoConnection:
      "Visibility without conversion wastes opportunity. CRO work strengthens the path from search or campaign traffic to a clear business action.",
    idealFor: [
      "Traffic is growing but leads are not",
      "CTAs are weak or inconsistently placed",
      "Forms create unnecessary friction",
      "Key pages lack a clear next step",
      "You are unsure where visitors drop off",
    ],
    ctaTitle: "Getting Traffic but Not Enough Results?",
    ctaDescription:
      "Share your current site and goals. We will help identify the most practical conversion improvements to prioritise.",
    relatedProjectSlugs: [
      "the-coast",
      "gemini-corporate-relocations",
    ],
    icon: "target",
    featured: true,
    problems: [
      "Traffic is growing but leads are not",
      "CTAs are weak or inconsistently placed",
      "Forms create unnecessary friction",
      "Key pages lack a clear next step",
      "You are unsure where visitors drop off",
    ],
    deliverables: [
      "Conversion-focused page review",
      "CTA and messaging recommendations",
      "Form and funnel friction analysis",
      "Analytics and behaviour insights",
      "Prioritized testing opportunities",
      "Landing page optimization guidance",
    ],
    process: [
      {
        title: "Measure",
        description: "Review analytics, journeys and page behaviour.",
      },
      {
        title: "Diagnose",
        description: "Identify friction in messaging, CTAs, forms and flow.",
      },
      {
        title: "Prioritize",
        description: "Rank improvements by impact and effort.",
      },
      {
        title: "Improve",
        description: "Implement practical changes to key pages and journeys.",
      },
      {
        title: "Validate",
        description: "Check results and refine the next round of work.",
      },
    ],
    faqs: [
      {
        question: "Can you guarantee higher conversion rates?",
        answer:
          "No. Conversion depends on traffic quality, offer, pricing, trust and many other factors. We focus on improving clarity, reducing friction and creating a structured approach to testing — not unverifiable promises.",
      },
      {
        question: "Do I need a full redesign for CRO?",
        answer:
          "Not always. Some improvements are targeted — CTA placement, forms, messaging or page hierarchy. Larger redesigns are recommended only when the current experience is fundamentally holding conversion back.",
      },
      {
        question: "What do you need access to?",
        answer:
          "Typically analytics access, your current website, and clarity on the actions that matter most — enquiries, bookings, purchases or another defined outcome.",
      },
    ],
    relatedServiceSlugs: [
      "website-redesign",
      "landing-page-design",
      "analytics-conversion-tracking",
      "website-audit",
    ],
    relatedSeoSlugs: ["on-page-seo"],
    relatedPlatformSlugs: ["clixlo"],
    metaTitle: "Conversion Rate Optimization",
    metaDescription:
      "Practical conversion optimization for websites and landing pages — CTA, funnel, form and analytics improvements without guaranteed promises.",
  },
  {
    slug: "website-maintenance",
    title: "Website Maintenance",
    href: "/services/website-maintenance",
    category: "maintenance",
    group: "support",
    summary:
      "Keep your website updated, secure and performing well.",
    description:
      "Ongoing maintenance helps protect performance, security and reliability — with updates, backups, monitoring, bug fixes, content changes and technical support when you need them.",
    tagline:
      "Keep your website secure, updated and performing reliably.",
    visualVariant: "maintenance",
    audience:
      "Businesses that need dependable ongoing website support",
    capabilities: [
      {
        title: "Updates & Dependencies",
        description:
          "Keep software, plugins and packages current and stable.",
        icon: "refresh-cw",
      },
      {
        title: "Backups & Monitoring",
        description:
          "Protect recovery readiness and catch issues before they escalate.",
        icon: "shield",
      },
      {
        title: "Performance Care",
        description:
          "Ongoing speed checks and technical fixes as the site evolves.",
        icon: "gauge",
      },
      {
        title: "Content & Support",
        description:
          "Small enhancements and reliable help when you need changes made.",
        icon: "wrench",
      },
    ],
    narrativeTitle: "Ongoing Care After Launch",
    narrative:
      "Websites need ongoing care after launch. We help protect performance, security and reliability through updates, backups, monitoring, bug fixes and content support — so your team can stay focused on the business while the site remains dependable.",
    seoConnection:
      "Performance and technical health affect search and experience. Maintenance helps catch broken links, slowdowns and technical issues before they become bigger problems.",
    idealFor: [
      "Plugins or dependencies are outdated",
      "Nobody is monitoring uptime or errors",
      "Small content changes take too long",
      "Speed has declined over time",
      "You need a reliable support partner after launch",
    ],
    ctaTitle: "Need Someone to Keep Your Website Running Properly?",
    ctaDescription:
      "Tell us about your current site and stack. We can review support needs and recommend a practical maintenance plan.",
    relatedProjectSlugs: ["the-coast"],
    icon: "wrench",
    featured: false,
    problems: [
      "Plugins or dependencies are outdated",
      "Nobody is monitoring uptime or errors",
      "Small content changes take too long",
      "Speed has declined over time",
      "You need a reliable support partner",
    ],
    deliverables: [
      "Software and dependency updates",
      "Backups and recovery readiness",
      "Uptime and issue monitoring",
      "Speed checks and technical fixes",
      "Content updates and small enhancements",
      "Security fundamentals and support",
    ],
    process: [
      {
        title: "Review",
        description: "Assess stack, risks, update needs and support priorities.",
      },
      {
        title: "Secure",
        description: "Establish updates, backups and monitoring routines.",
      },
      {
        title: "Maintain",
        description: "Handle ongoing care, fixes and content support.",
      },
      {
        title: "Improve",
        description: "Address performance and technical issues as they appear.",
      },
    ],
    faqs: [
      {
        question: "Is maintenance only for websites you built?",
        answer:
          "Not necessarily. We can often take over maintenance for existing sites after a technical review to understand the stack and risks.",
      },
      {
        question: "What is typically included?",
        answer:
          "Common inclusions are updates, backups, monitoring, bug fixes, content changes and performance checks. Exact scope is agreed based on your site and needs.",
      },
      {
        question: "Can maintenance include SEO monitoring?",
        answer:
          "Technical health checks can include crawl, speed and broken-link issues. Deeper SEO programmes are scoped separately when needed.",
      },
    ],
    relatedServiceSlugs: ["website-development", "website-redesign"],
    relatedSeoSlugs: ["technical-seo"],
    relatedPlatformSlugs: ["wordpress"],
    metaTitle: "Website Maintenance",
    metaDescription:
      "Website maintenance covering updates, backups, monitoring, speed, security fundamentals, bug fixes and content support.",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    href: "/services/digital-marketing",
    category: "growth",
    group: "support",
    summary:
      "Grow visibility and attract more of the right audience.",
    description:
      "We support digital marketing efforts that connect your website, SEO, content and campaigns — so traffic has somewhere valuable to land and convert.",
    tagline: "Connect visibility, messaging and website conversion.",
    visualVariant: "marketing",
    audience:
      "Businesses that need demand generation connected to a stronger website experience",
    capabilities: [
      {
        title: "Channel Alignment",
        description:
          "Keep messaging consistent across SEO, content and campaigns.",
        icon: "megaphone",
      },
      {
        title: "Landing Experiences",
        description:
          "Send traffic to pages designed to convert, not just attract.",
        icon: "layout-template",
      },
      {
        title: "SEO & Content Coordination",
        description:
          "Connect discoverability work with pages that support the offer.",
        icon: "search",
      },
      {
        title: "Measurement Loops",
        description:
          "Use practical tracking to refine what deserves attention next.",
        icon: "line-chart",
      },
    ],
    narrativeTitle: "Marketing That Lands Somewhere Useful",
    narrative:
      "Marketing only works when the website can carry the conversation. We help connect SEO, content and campaigns with conversion-focused pages — so the right audience finds you, understands the offer and has a clear next step.",
    seoConnection:
      "Search visibility, content and campaign traffic should reinforce each other. Digital marketing support stays connected to the website rather than treating acquisition as a separate silo.",
    idealFor: [
      "Your website is not generating enough demand",
      "Campaigns send traffic to weak pages",
      "Messaging is inconsistent across channels",
      "You need a clearer growth plan around the website",
    ],
    ctaTitle: "Ready to Turn More Attention Into Business?",
    ctaDescription:
      "Tell us where traffic is coming from and what should happen next. We will help connect visibility with conversion.",
    relatedProjectSlugs: ["the-coast", "gemini-corporate-relocations"],
    icon: "megaphone",
    featured: false,
    problems: [
      "Your website is not generating enough demand",
      "Campaigns send traffic to weak pages",
      "Messaging is inconsistent across channels",
      "You need a clearer growth plan around the website",
    ],
    deliverables: [
      "Channel and messaging alignment",
      "Landing page and offer support",
      "SEO and content coordination",
      "Campaign landing experiences",
      "Measurement and improvement loops",
    ],
    process: [
      {
        title: "Align",
        description: "Clarify audience, offer, channels and conversion goals.",
      },
      {
        title: "Connect",
        description: "Link campaigns and content to strong landing experiences.",
      },
      {
        title: "Launch",
        description: "Support campaigns with pages ready to convert attention.",
      },
      {
        title: "Measure",
        description: "Review results and refine the next round of activity.",
      },
    ],
    faqs: [
      {
        question: "Do you manage paid ads?",
        answer:
          "Digital marketing support is scoped around your goals. Where paid campaigns are involved, we focus on the website and landing experiences that convert that traffic — and can coordinate with broader marketing plans.",
      },
      {
        question: "Is this separate from SEO?",
        answer:
          "No. SEO, content and campaigns work best when connected. We help keep messaging and landing experiences aligned across those channels.",
      },
      {
        question: "Do you only work with Smartlance-built websites?",
        answer:
          "No. We can support marketing and landing experiences for existing websites after reviewing the current setup and conversion paths.",
      },
    ],
    relatedServiceSlugs: [
      "landing-page-design",
      "conversion-rate-optimization",
      "website-design",
    ],
    relatedSeoSlugs: ["on-page-seo", "local-seo"],
    relatedPlatformSlugs: ["salesforce"],
    metaTitle: "Digital Marketing",
    metaDescription:
      "Digital marketing support that connects SEO, content, campaigns and conversion-focused website experiences.",
  },
  ...additionalServices,
];

export const serviceGroupMeta: {
  id: ServiceGroupId;
  title: string;
  description: string;
}[] = [
  {
    id: "websites",
    title: "Websites",
    description:
      "Strategy, design, development, redesign, commerce, landing pages and migration.",
  },
  {
    id: "seo-growth",
    title: "SEO & Growth",
    description:
      "Search, performance and content services that support discoverability and demand.",
  },
  {
    id: "conversion-measurement",
    title: "Conversion & Measurement",
    description:
      "Optimization, tracking and audits that clarify what is working.",
  },
  {
    id: "support",
    title: "Ongoing Support",
    description:
      "Maintenance, marketing support and web branding that keep the system useful.",
  },
];

export function getServiceBySlug(slug: string) {
  return services.find((service) => service.slug === slug);
}

export function getFeaturedServices() {
  return services.filter((service) => service.featured);
}

export function getServicesByGroup(group: ServiceGroupId) {
  return services.filter((service) => service.group === group);
}

export function getNavigationServices() {
  return services.filter((service) => service.navigationFeatured);
}

export function getRelatedServices(slugs: string[] = []) {
  return slugs
    .map((slug) => services.find((service) => service.slug === slug))
    .filter((service): service is (typeof services)[number] => Boolean(service));
}
