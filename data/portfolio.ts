import type { Project } from "@/types";
import { showDraftContent } from "@/lib/content-flags";

/**
 * Portfolio migrated from live Smartlance Designs WordPress project pages.
 * Images stored locally under public/images/projects/<slug>/
 */
export const projects: Project[] = [
  {
    slug: "padeya",
    name: "Pàdéyá",
    title: "Pàdéyá event technology platform",
    client: "Pàdéyá",
    industry: "Event Technology",
    projectType: "Event Technology Platform",
    services: [
      "Product Design",
      "Web Application Development",
      "Platform Architecture",
      "Automation",
    ],
    published: true,
    featured: true,
    displayOrder: 0,
    caseStudyKind: "product",
    year: 2026,
    websiteUrl: "https://padeya.com/",
    platform: "Next.js + FastAPI",
    platforms: ["Next.js", "FastAPI"],
    technologies: [
      "Next.js",
      "TypeScript",
      "FastAPI",
      "Python",
      "PostgreSQL",
      "Redis",
      "Paystack",
    ],
    shortDescription:
      "A multi-sided event platform for discovery, ticketing, host operations, fan engagement, ambassadors, sponsorships and event memories.",
    overview:
      "Pàdéyá was created as an event technology platform designed to bring the fragmented event experience into one connected ecosystem. Instead of focusing only on ticket sales, the platform connects event discovery, ticketing, host operations, fan identities, event memories, ambassador referrals, sponsorships, merchandise and post-event engagement. The goal was to create infrastructure that works for both sides of the event economy: the people creating experiences and the people attending them.",
    challenge:
      "Traditional ticketing platforms often end their relationship with users once a ticket is purchased. Pàdéyá needed to support the wider event lifecycle while giving fans, hosts, ambassadors, sponsors and administrators purpose-built workflows without turning the product into disconnected dashboards.",
    solution:
      "Pàdéyá became a multi-sided event platform combining public event discovery with operational tools behind the scenes. The platform gives fans a richer way to discover and remember events while giving hosts infrastructure for managing events, audiences, promotion and long-term reputation.",
    approach:
      "We mapped the platform around the main participants in the event ecosystem, gave each role purpose-built workflows on shared infrastructure, and designed trust-first payment, admission and engagement systems that continue beyond checkout.",
    resultSummary:
      "Pàdéyá evolved from an event-ticketing concept into a broader event technology platform that connects discovery, ticketing, admission, promotion and post-event engagement through a shared system for hosts, fans, ambassadors and sponsors.",
    results: [
      "Public event discovery experience",
      "Host and fan dashboards",
      "Event ticketing and payment workflows",
      "QR-based admission",
      "Fan Passport profiles",
      "Event Memories",
      "Host Legacy profiles",
      "Ambassador and referral infrastructure",
      "Sponsorship and merchandise foundations",
      "Administration and analytics systems",
      "Mobile-responsive interfaces",
    ],
    image: "/images/projects/padeya/cover.webp",
    imageAlt: "Pàdéyá event platform homepage",
    heroImage: "/images/projects/padeya/hero.webp",
    heroImageAlt: "Pàdéyá public event discovery interface",
    gallery: [
      {
        src: "/images/projects/padeya/discovery.webp",
        alt: "Pàdéyá event discovery interface",
        layout: "full",
      },
      {
        src: "/images/projects/padeya/event-detail.webp",
        alt: "Pàdéyá event detail page",
        layout: "half",
      },
      {
        src: "/images/projects/padeya/host-dashboard.webp",
        alt: "Pàdéyá host dashboard",
        layout: "half",
      },
      {
        src: "/images/projects/padeya/fan-passport.webp",
        alt: "Pàdéyá Fan Passport",
        layout: "full",
      },
      {
        src: "/images/projects/padeya/memories.webp",
        alt: "Pàdéyá Event Memories interface",
        layout: "half",
      },
      {
        src: "/images/projects/padeya/legacy.webp",
        alt: "Pàdéyá Host Legacy interface",
        layout: "half",
      },
    ],
    relatedSlugs: ["nashville-home-viewer", "gemini-corporate-relocations"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
    ],
    serviceLinks: [
      {
        label: "Product & UI Design",
        href: "/services/website-design",
        description:
          "Designing public and authenticated experiences across several user roles while maintaining one coherent product system.",
      },
      {
        label: "Web Application Development",
        href: "/services/website-development",
        description:
          "Building the frontend and backend architecture powering event discovery, dashboards, payments and operational workflows.",
      },
      {
        label: "Automation & Integrations",
        description:
          "Connecting payments, notifications, referral attribution, admission workflows and other platform processes.",
      },
    ],
    engineeringIntro:
      "Pàdéyá was developed as a custom web platform rather than a conventional CMS website.",
    engineeringStacks: [
      {
        category: "Frontend",
        items: ["Next.js", "TypeScript", "Responsive application architecture"],
      },
      {
        category: "Backend",
        items: ["FastAPI", "Python"],
      },
      {
        category: "Data",
        items: ["PostgreSQL", "Redis"],
      },
      {
        category: "Payments",
        items: ["Paystack"],
      },
      {
        category: "Media",
        items: ["Cloud object storage", "Optimized public media delivery"],
      },
      {
        category: "Infrastructure",
        items: ["Vercel", "Render", "Cloudflare"],
      },
      {
        category: "Architecture",
        items: [
          "Role-based access control",
          "Server-side validation",
          "Structured APIs",
          "Controlled background processing",
        ],
      },
    ],
    externalLinkLabel: "Visit Pàdéyá",
    caseStudyCta: {
      title: "Planning a Digital Product or Platform?",
      description:
        "If you need a custom platform, marketplace, dashboard or web application, tell us what you're building and what the product needs to do.",
    },
    metaTitle: "Pàdéyá Event Platform Case Study",
    metaDescription:
      "See how Smartlance Designs designed and developed Pàdéyá, a multi-sided event technology platform for ticketing, hosts, fans, ambassadors, sponsorships and event engagement.",
  },
  {
    slug: "freelance-os",
    name: "Freelance OS",
    title: "Freelance OS AI-powered SaaS platform",
    client: "Freelance OS",
    industry: "Freelance Technology / SaaS",
    projectType: "AI-Powered SaaS Platform",
    services: [
      "Product Design",
      "SaaS Development",
      "AI Integration",
      "Platform Architecture",
      "Automation",
    ],
    published: true,
    featured: true,
    displayOrder: 1,
    caseStudyKind: "product",
    year: 2026,
    websiteUrl: "https://getfreelanceos.com/",
    platform: "Next.js + FastAPI",
    platforms: ["Next.js", "FastAPI"],
    technologies: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "FastAPI",
      "Python",
      "PostgreSQL",
      "Redis",
    ],
    shortDescription:
      "An AI-powered operating system for freelancers combining opportunity analysis, proposal creation, client management, portfolio building, analytics and business workflows in one platform.",
    overview:
      "Freelancers often run their businesses across disconnected tools. Opportunities may live on freelance marketplaces, proposals in documents or AI tools, clients in spreadsheets, portfolio projects somewhere else, and business performance across several dashboards. Freelance OS was designed around a different idea: treat freelancing as a complete business workflow rather than a collection of isolated tasks. The platform connects opportunity discovery and analysis, proposals, applications, clients, portfolio proof, services, profiles, analytics and AI guidance through one shared system. The goal was not simply to build another proposal generator. It was to create infrastructure for running and improving a freelance business.",
    challenge:
      "Freelancers frequently move between marketplaces, AI writing tools, spreadsheets, CRMs, portfolio builders, analytics tools and personal task systems. The product needed to connect these workflows without creating another complicated dashboard, while giving AI enough structured context to be genuinely useful.",
    solution:
      "Freelance OS became a modular SaaS platform connecting the activities freelancers perform before, during and after winning client work. Rather than treating each feature as a separate tool, the product uses shared context and connected workflows to help users move between opportunities, proposals, relationships, proof and performance.",
    approach:
      "We mapped the freelance lifecycle, structured shared freelancer context, built modular product domains, introduced contextual AI for specific jobs, and developed the SaaS infrastructure required to support subscriptions, permissions and ongoing expansion.",
    resultSummary:
      "Freelance OS developed into a broader SaaS platform for managing the workflows behind independent work. Opportunity analysis, proposal creation, application tracking, client management, portfolio development, services, profile improvement and analytics are connected through shared product infrastructure rather than operating as isolated tools.",
    results: [
      "Connected freelancer workspace",
      "AI-assisted opportunity analysis",
      "Context-aware proposal workflows",
      "Application pipeline",
      "Freelancer CRM",
      "Portfolio and proof-of-work system",
      "Service positioning tools",
      "Profile and growth workflows",
      "Performance analytics",
      "Public profile infrastructure",
      "Subscription and entitlement system",
      "Notification infrastructure",
      "Administration and operational tooling",
      "Responsive application experience",
    ],
    image: "/images/projects/freelance-os/cover.webp",
    imageAlt: "Freelance OS freelancer dashboard",
    heroImage: "/images/projects/freelance-os/hero.webp",
    heroImageAlt: "Freelance OS Today command center",
    gallery: [
      {
        src: "/images/projects/freelance-os/today.webp",
        alt: "Freelance OS freelancer dashboard",
        layout: "full",
      },
      {
        src: "/images/projects/freelance-os/opportunity-analyzer.webp",
        alt: "Freelance OS opportunity analysis interface",
        layout: "half",
      },
      {
        src: "/images/projects/freelance-os/proposal-generator.webp",
        alt: "Freelance OS AI proposal generator",
        layout: "half",
      },
      {
        src: "/images/projects/freelance-os/pipeline.webp",
        alt: "Freelance OS application pipeline",
        layout: "half",
      },
      {
        src: "/images/projects/freelance-os/crm.webp",
        alt: "Freelance OS freelancer CRM",
        layout: "half",
      },
      {
        src: "/images/projects/freelance-os/portfolio-studio.webp",
        alt: "Freelance OS Portfolio Studio",
        layout: "full",
      },
      {
        src: "/images/projects/freelance-os/analytics.webp",
        alt: "Freelance OS analytics dashboard",
        layout: "half",
      },
      {
        src: "/images/projects/freelance-os/career-coach.webp",
        alt: "Freelance OS Career Coach",
        layout: "half",
      },
      {
        src: "/images/projects/freelance-os/public-profile.webp",
        alt: "Freelance OS public profile",
        layout: "full",
      },
    ],
    relatedSlugs: ["padeya", "nashville-home-viewer"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
    ],
    serviceLinks: [
      {
        label: "Product & UI Design",
        href: "/services/website-design",
        description:
          "Designing a complex SaaS workspace around connected freelancer workflows while keeping individual tools understandable and actionable.",
      },
      {
        label: "SaaS / Web Application Development",
        href: "/services/website-development",
        description:
          "Building the frontend and backend systems supporting authenticated dashboards, business workflows, subscriptions and platform operations.",
      },
      {
        label: "AI Integration",
        description:
          "Designing task-specific AI workflows that use relevant freelancer context for analysis, drafting and guidance.",
      },
      {
        label: "Automation & Integrations",
        description:
          "Connecting authentication, notifications, billing, referrals and other product workflows across the application.",
      },
      {
        label: "Platform Architecture",
        description:
          "Structuring a modular application capable of supporting multiple connected product domains without turning the experience into disconnected tools.",
      },
    ],
    heroEyebrow: "Project · AI SaaS Platform",
    externalLinkLabel: "Visit Freelance OS",
    showArchitectureDiagram: true,
    engineeringIntro:
      "Freelance OS was developed as a custom application with separate frontend, backend, data and infrastructure layers rather than as a conventional content website.",
    engineeringStacks: [
      {
        category: "Frontend",
        items: [
          "Next.js",
          "TypeScript",
          "Tailwind CSS",
          "App Router",
          "Responsive application architecture",
        ],
      },
      {
        category: "Backend",
        items: ["FastAPI", "Python", "Structured APIs", "Background workflows"],
      },
      {
        category: "Data",
        items: ["PostgreSQL", "Redis"],
      },
      {
        category: "AI",
        items: [
          "Task-specific AI workflows",
          "Structured freelancer context",
          "Server-side provider integration",
        ],
      },
      {
        category: "Authentication",
        items: ["Email authentication", "Protected application routes"],
      },
      {
        category: "Billing",
        items: ["Subscription plans", "Usage limits", "Plan entitlements"],
      },
      {
        category: "Infrastructure",
        items: ["Vercel", "Cloudflare", "Container-ready deployment"],
      },
      {
        category: "Architecture",
        items: [
          "Modular product domains",
          "API-driven frontend and backend",
          "Role-based access",
          "Server-side authorization",
          "Structured feature entitlements",
          "Audit logging",
        ],
      },
    ],
    caseStudyCta: {
      title: "Planning a SaaS Product or Web Application?",
      description:
        "If you are building a SaaS platform, AI product, dashboard or custom web application, tell us what the product needs to do and where you are in the build.",
      primaryLabel: "Tell Us About Your Product",
      primaryHref: "/contact",
    },
    metaTitle: "Freelance OS SaaS Case Study",
    metaDescription:
      "See how Smartlance Designs built Freelance OS, an AI-powered SaaS platform connecting opportunities, proposals, clients, portfolio, analytics and freelance business workflows.",
  },
  {
    slug: "gemini-corporate-relocations",
    name: "Gemini Corporate Relocations",
    title: "Gemini Corporate Relocations website",
    client: "Gemini Corporate Relocations",
    industry: "Property Management",
    projectType: "Corporate housing website",
    services: ["Website Design", "Website Development", "SEO"],
    published: true,
    featured: true,
    year: 2024,
    oldUrl:
      "https://www.smartlancedesigns.com/project/gemini-corporate-relocations/",
    websiteUrl: "https://geminicorporaterelocations.co.uk",
    platform: "WordPress",
    platforms: ["WordPress"],
    technologies: ["WordPress"],
    shortDescription:
      "Professional WordPress website for a corporate housing and relocation provider.",
    overview:
      "Gemini Corporate Relocations provides short- and long-term accommodation solutions for corporate clients. They needed a site that presented services clearly and made it easier to explore rental options.",
    challenge:
      "Gemini needed a website that showcased corporate housing services and accommodations in a professional, user-friendly way, and that helped streamline the rental and relocation process for corporate clients.",
    solution:
      "We designed and built a responsive WordPress site with clear service presentation, detailed property listings, booking support and SEO foundations — developed collaboratively through Zoom consultations and post-launch training.",
    approach:
      "Discovery via Zoom consultations, WordPress build focused on clarity and booking usability, then SEO foundations and training for independent updates.",
    designNotes:
      "Sleek, professional layouts with high-quality imagery and clear descriptions of short- and long-term rental options.",
    developmentNotes:
      "WordPress build with property listings, booking pathways and maintainable page structure.",
    seoNotes:
      "On-page SEO foundations to support search visibility for corporate housing and relocation services.",
    resultSummary:
      "A clearer online presence with property listings, booking support and a team trained to manage updates independently.",
    results: [
      "Full website designed and developed on WordPress",
      "Property listings and booking pathways implemented",
      "SEO foundations added",
      "Post-launch training delivered",
    ],
    image: "/images/projects/gemini-corporate-relocations/cover.webp",
    imageAlt: "Gemini Corporate Relocations website",
    heroImage: "/images/projects/gemini-corporate-relocations/hero.webp",
    heroImageAlt: "Gemini Corporate Relocations project hero",
    testimonialId: "gemini-anderson",
    relatedSlugs: ["katerinas-place", "the-coast", "overlook-cabin-rentals"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
      "/seo",
    ],
    metaTitle: "Gemini Corporate Relocations",
    metaDescription:
      "Website design and WordPress development for Gemini Corporate Relocations — corporate housing and relocation services.",
  },
  {
    slug: "katerinas-place",
    name: "Katerina's Place",
    title: "Katerina's Place website",
    client: "Katerina's Place",
    industry: "Short-Term Rental",
    projectType: "Vacation rental website",
    services: ["Website Design", "Website Development", "SEO"],
    published: true,
    featured: true,
    year: 2024,
    oldUrl: "https://www.smartlancedesigns.com/project/katerinas-place/",
    websiteUrl: "https://www.katerinasplace.gr",
    platform: "WordPress",
    platforms: ["WordPress"],
    technologies: ["WordPress"],
    shortDescription:
      "Boutique vacation-home website with property storytelling and direct booking support.",
    overview:
      "Katerina’s Place is a renovated vacation home near Timenio beach and Nafplio, Greece. The business needed a site that reflected the property’s character and made booking easier.",
    challenge:
      "Create an aesthetically pleasing, user-friendly website that showcased the property clearly and supported a smoother booking experience.",
    solution:
      "A responsive WordPress website with strong imagery, detailed property information, an intuitive booking path and SEO foundations, delivered with collaborative feedback and post-launch training.",
    approach:
      "Consultations to capture brand and guest expectations, then a WordPress build focused on atmosphere, clarity and booking usability.",
    designNotes:
      "Warm, property-led presentation highlighting ambience, amenities and location.",
    developmentNotes:
      "WordPress implementation with property details and a streamlined booking journey.",
    seoNotes: "SEO best practices to support discovery for the property and location.",
    resultSummary:
      "A polished direct-booking website that presents the property clearly and can be managed by the client team.",
    results: [
      "Full website designed and developed on WordPress",
      "Booking journey simplified",
      "SEO foundations implemented",
      "Post-launch training delivered",
    ],
    image: "/images/projects/katerinas-place/cover.webp",
    imageAlt: "Katerina's Place website",
    heroImage: "/images/projects/katerinas-place/hero.webp",
    heroImageAlt: "Katerina's Place project hero",
    testimonialId: "katerinas-place-team",
    relatedSlugs: ["the-coast", "banyan-vacations"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
      "/seo",
    ],
    metaTitle: "Katerina's Place",
    metaDescription:
      "Website design and development for Katerina's Place — a vacation rental near Nafplio, Greece.",
  },
  {
    slug: "the-coast",
    name: "The Coast",
    title: "The Coast website",
    client: "The Coast",
    industry: "Hospitality",
    projectType: "Boutique hotel website",
    services: ["Website Design", "Website Development", "SEO"],
    published: true,
    featured: true,
    year: 2024,
    oldUrl: "https://www.smartlancedesigns.com/project/the-coast/",
    websiteUrl: "https://thecoast.lk",
    platform: "WordPress",
    platforms: ["WordPress"],
    technologies: ["WordPress"],
    shortDescription:
      "Boutique coastal hospitality website with clearer booking and enquiry paths.",
    overview:
      "The Coast is a boutique coastal stay in Sri Lanka. The business needed a website that showcased the property and made it easier for guests to check availability and get in touch.",
    challenge:
      "Build a visually appealing, user-friendly platform that presented the coastal property clearly and supported a smoother booking and contact experience.",
    solution:
      "A WordPress website with strong visual storytelling, an intuitive booking/contact path, collaborative development and post-launch training — including ongoing maintenance support.",
    approach:
      "Discovery consultations, WordPress design and development focused on atmosphere and booking clarity, then training for independent updates.",
    designNotes:
      "Coastal, hospitality-led visuals with clear hierarchy for rooms, experience and next steps.",
    developmentNotes:
      "WordPress build with booking/enquiry pathways and maintainable templates.",
    seoNotes: "SEO foundations to support discoverability for coastal stays.",
    resultSummary:
      "A clearer guest-facing website with simpler booking and contact paths, plus training for the client team.",
    results: [
      "Full website designed and developed on WordPress",
      "Booking journey simplified",
      "SEO foundations implemented",
      "Post-launch training and maintenance support",
    ],
    image: "/images/projects/the-coast/cover.webp",
    imageAlt: "The Coast website",
    heroImage: "/images/projects/the-coast/hero.webp",
    heroImageAlt: "The Coast project hero",
    testimonialId: "the-coast-abdullah",
    relatedSlugs: ["katerinas-place", "overlook-cabin-rentals"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
      "/services/website-maintenance",
    ],
    metaTitle: "The Coast",
    metaDescription:
      "Website design and WordPress development for The Coast — a boutique coastal hospitality brand.",
  },
  {
    slug: "banyan-vacations",
    name: "Banyan Vacations",
    title: "Banyan Vacations website",
    client: "Banyan Vacations",
    industry: "Short-Term Rental",
    projectType: "Vacation rental website",
    services: ["Website Design", "Website Development", "SEO"],
    published: true,
    featured: true,
    year: 2024,
    oldUrl: "https://www.smartlancedesigns.com/project/banyan-vacations/",
    websiteUrl: "https://www.banyanvacations.com",
    platform: "WordPress",
    platforms: ["WordPress"],
    technologies: ["WordPress"],
    shortDescription:
      "Family-owned vacation rental website focused on hospitality and property presentation.",
    overview:
      "Banyan Vacations is a small family-owned vacation rental business. They needed a website overhaul to better showcase homes and improve guest engagement.",
    challenge:
      "Improve property presentation and user engagement with a clearer, more professional vacation rental website experience.",
    solution:
      "A dynamic WordPress website with stronger visual design, interactive property presentation, SEO foundations and post-launch training.",
    approach:
      "Series of Zoom consultations to align on goals, then WordPress design/development with iterative feedback and SEO support.",
    designNotes:
      "Clean, hospitality-focused layouts that highlight rental properties without clutter.",
    developmentNotes:
      "WordPress implementation with property-focused pages and maintainable structure.",
    seoNotes: "SEO best practices to support visibility for vacation rental searches.",
    resultSummary:
      "A refreshed WordPress website that presents properties more clearly and supports stronger digital presence.",
    results: [
      "Website redesigned and rebuilt on WordPress",
      "Property presentation improved",
      "SEO foundations implemented",
      "Post-launch training delivered",
    ],
    image: "/images/projects/banyan-vacations/cover.webp",
    imageAlt: "Banyan Vacations website",
    heroImage: "/images/projects/banyan-vacations/hero.webp",
    heroImageAlt: "Banyan Vacations project hero",
    testimonialId: "banyan-vacations",
    relatedSlugs: ["katerinas-place", "overlook-cabin-rentals"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
      "/seo",
    ],
    metaTitle: "Banyan Vacations",
    metaDescription:
      "Website redesign and WordPress development for Banyan Vacations — vacation rental hospitality.",
  },
  {
    slug: "overlook-cabin-rentals",
    name: "Overlook Cabin Rentals",
    title: "Overlook Cabin Rentals website",
    client: "Overlook Cabin Rentals",
    industry: "Cabin Rental",
    projectType: "Cabin rental website",
    services: ["Website Design", "Website Development", "SEO"],
    published: true,
    featured: true,
    year: 2024,
    oldUrl:
      "https://www.smartlancedesigns.com/project/overlook-cabin-rentals/",
    websiteUrl: "https://overlookcabinrentals.com",
    platform: "WordPress",
    platforms: ["WordPress"],
    technologies: ["WordPress"],
    shortDescription:
      "Cabin rental website redesign focused on atmosphere, listings and guest engagement.",
    overview:
      "Overlook Cabin Rentals offers cabin stays in scenic locations. They needed a redesign to display cabins more effectively and improve customer interaction.",
    challenge:
      "Redesign the website to better display cabin offerings and improve how guests explore and enquire.",
    solution:
      "A visually strong WordPress site with clearer navigation, property presentation, SEO foundations and training for ongoing updates.",
    approach:
      "Multiple Zoom consultations, WordPress redesign/development with iterative feedback, then SEO and post-launch support.",
    designNotes:
      "Scenic, cabin-led imagery with easy-to-scan property presentation.",
    developmentNotes:
      "WordPress redesign with maintainable templates for cabin listings.",
    seoNotes: "SEO foundations to improve search visibility for cabin rentals.",
    resultSummary:
      "A redesigned cabin rental website that showcases properties more clearly and supports stronger online presence.",
    results: [
      "Full website redesigned on WordPress",
      "Cabin presentation improved",
      "SEO foundations implemented",
      "Post-launch training delivered",
    ],
    image: "/images/projects/overlook-cabin-rentals/cover.webp",
    imageAlt: "Overlook Cabin Rentals website",
    heroImage: "/images/projects/overlook-cabin-rentals/hero.webp",
    heroImageAlt: "Overlook Cabin Rentals project hero",
    testimonialId: "overlook-cabin-team",
    relatedSlugs: ["banyan-vacations", "the-coast"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-redesign",
      "/seo",
    ],
    metaTitle: "Overlook Cabin Rentals",
    metaDescription:
      "Website redesign and WordPress development for Overlook Cabin Rentals.",
  },
  {
    slug: "nashville-home-viewer",
    name: "Nashville Home Viewer",
    title: "Nashville Home Viewer website",
    client: "Nashville Home Viewer",
    industry: "Real Estate",
    projectType: "Real estate website",
    services: ["Website Design", "Website Development", "SEO"],
    published: true,
    featured: false,
    year: 2024,
    oldUrl:
      "https://www.smartlancedesigns.com/project/nashville-home-viewer/",
    websiteUrl: "https://www.nashvillehomeviewer.com",
    platform: "WordPress",
    platforms: ["WordPress"],
    technologies: ["WordPress"],
    shortDescription:
      "Real estate website refresh focused on listings presentation and buyer engagement.",
    overview:
      "Nashville Home Viewer is a real estate company supporting buyers and sellers. They needed a website refresh to present listings more clearly and improve engagement.",
    challenge:
      "Revamp the website to showcase property listings more effectively and create a clearer experience for prospective buyers.",
    solution:
      "A sleek WordPress website with stronger listing presentation, interactive property features, SEO foundations and post-launch training.",
    approach:
      "Consultations to define requirements, WordPress design/development with real-time feedback, then SEO and training.",
    designNotes:
      "Clean real-estate layouts prioritizing property imagery and listing clarity.",
    developmentNotes:
      "WordPress build with property listing features and contact pathways.",
    seoNotes: "SEO best practices to support property and local search visibility.",
    resultSummary:
      "A clearer real estate website with stronger listing presentation and a team trained to manage updates.",
    results: [
      "Website redesigned and developed on WordPress",
      "Property listing presentation improved",
      "SEO foundations implemented",
      "Post-launch training delivered",
    ],
    image: "/images/projects/nashville-home-viewer/cover.webp",
    imageAlt: "Nashville Home Viewer website",
    heroImage: "/images/projects/nashville-home-viewer/hero.webp",
    heroImageAlt: "Nashville Home Viewer project hero",
    testimonialId: "nashville-home-viewer-team",
    relatedSlugs: ["kaerek-homes", "gemini-corporate-relocations"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
      "/seo",
    ],
    metaTitle: "Nashville Home Viewer",
    metaDescription:
      "Website design and WordPress development for Nashville Home Viewer — real estate listings and enquiries.",
  },
  {
    slug: "kaerek-homes",
    name: "Kaerek Homes",
    title: "Kaerek Homes website",
    client: "Kaerek Homes",
    industry: "Real Estate",
    projectType: "Real estate website",
    services: ["Website Design", "Website Development", "SEO"],
    published: true,
    featured: true,
    year: 2024,
    oldUrl: "https://www.smartlancedesigns.com/project/kaerek-homes/",
    websiteUrl: "https://kaerekhomes.com",
    platform: "WordPress",
    platforms: ["WordPress"],
    technologies: ["WordPress"],
    shortDescription:
      "Modern real estate website with property storytelling and enquiry support.",
    overview:
      "Kaerek Homes needed a modern, user-friendly website to present their portfolio and support potential homebuyers with clearer property information and contact paths.",
    challenge:
      "Create a platform that showcased homes effectively, provided detailed property information and supported interactive engagement for prospective buyers.",
    solution:
      "A responsive WordPress website with intuitive property presentation, interactive listing features, SEO foundations and post-launch training.",
    approach:
      "Zoom consultations, WordPress design/development with live feedback loops, then SEO and client training.",
    designNotes:
      "Modern property-led layouts with strong imagery hierarchy and clear CTAs.",
    developmentNotes:
      "WordPress implementation with interactive listings and enquiry forms.",
    seoNotes: "SEO foundations to improve search visibility for listings and services.",
    resultSummary:
      "A modern real estate website that presents properties clearly and can be managed by the client team.",
    results: [
      "Full website designed and developed on WordPress",
      "Interactive property presentation implemented",
      "SEO foundations implemented",
      "Post-launch training delivered",
    ],
    image: "/images/projects/kaerek-homes/cover.webp",
    imageAlt: "Kaerek Homes website",
    heroImage: "/images/projects/kaerek-homes/hero.webp",
    heroImageAlt: "Kaerek Homes project hero",
    testimonialId: "kaerek-homes",
    relatedSlugs: ["nashville-home-viewer", "gemini-corporate-relocations"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
      "/seo",
    ],
    metaTitle: "Kaerek Homes",
    metaDescription:
      "Website design and WordPress development for Kaerek Homes — real estate property presentation.",
  },
  {
    slug: "zen-stays-rental",
    name: "Zen Stays Rental",
    title: "Zen Stays Rental website",
    client: "Zen Stays Rental",
    industry: "Short-Term Rental",
    projectType: "Property management website",
    services: ["Website Design", "Website Development"],
    published: true,
    featured: false,
    year: 2024,
    oldUrl: "https://www.smartlancedesigns.com/project/zen-stays-rental/",
    websiteUrl: "https://www.zenstaysrental.com",
    platform: "WordPress",
    platforms: ["WordPress"],
    technologies: ["WordPress"],
    shortDescription:
      "Property management and short-term rental website for guests and hosts.",
    overview:
      "Zen Stays Rental supports guests looking for stays and hosts looking to list properties. They needed a website to present services, listings and collaboration opportunities in one place.",
    challenge:
      "Build a website that enhanced property management services, showcased listings and provided a platform for hosts to collaborate — after previous attempts had stalled.",
    solution:
      "A WordPress website developed collaboratively with Zen Stays, focused on a simplified customer journey for browsing, booking and payments, with content the team can manage themselves.",
    approach:
      "Detailed requirements call, WordPress implementation with real-time client involvement, and a streamlined guest/host journey.",
    designNotes:
      "Clear service and listing presentation for both guest and host audiences.",
    developmentNotes:
      "WordPress build oriented around browsing, booking and maintainable content updates.",
    resultSummary:
      "A functional WordPress site that unifies guest and host journeys and can be updated by the client team.",
    results: [
      "Website designed and developed on WordPress",
      "Guest browsing and booking journey simplified",
      "Content management enabled for the client team",
    ],
    image: "/images/projects/zen-stays-rental/cover.webp",
    imageAlt: "Zen Stays Rental website",
    heroImage: "/images/projects/zen-stays-rental/hero.webp",
    heroImageAlt: "Zen Stays Rental project hero",
    relatedSlugs: ["gemini-corporate-relocations", "banyan-vacations"],
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-development",
    ],
    metaTitle: "Zen Stays Rental",
    metaDescription:
      "Website design and WordPress development for Zen Stays Rental — short-term rental and property management.",
  },
];

function isVisible(project: Project) {
  return project.published || showDraftContent;
}

export function getVisibleProjects() {
  return projects
    .filter(isVisible)
    .sort((a, b) => {
      const orderA = a.displayOrder ?? (a.featured ? 50 : 100);
      const orderB = b.displayOrder ?? (b.featured ? 50 : 100);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
}

export function getProjectBySlug(slug: string) {
  const project = projects.find((item) => item.slug === slug);
  if (!project || !isVisible(project)) return undefined;
  return project;
}

export function getFeaturedProjects() {
  return getVisibleProjects().filter((project) => project.featured);
}

export function getProjectsByCategory(category: string) {
  const list = getVisibleProjects();
  if (category === "All") return list;
  return list.filter((project) =>
    project.services.includes(category as Project["services"][number]),
  );
}

export function getRelatedProjects(slugs: string[] = []) {
  const bySlug = new Map(getVisibleProjects().map((project) => [project.slug, project]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((project): project is Project => Boolean(project));
}

export const portfolioFilters = [
  "All",
  "Website Design",
  "Website Development",
  "SEO",
  "E-commerce",
  "Branding",
  "Product Design",
  "Web Application Development",
  "Platform Architecture",
  "SaaS Development",
  "AI Integration",
] as const;
