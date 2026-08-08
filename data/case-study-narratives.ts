import type {
  ProjectCaseStudyCta,
  ProjectCaseStudyHeadings,
  ProjectCaseStudyPoint,
  ProjectEngineeringStack,
  ProjectGalleryItem,
  ProjectServiceLink,
} from "@/types";

export type CaseStudyNarrative = {
  heroStatement: string;
  introHeading?: string;
  challenges: ProjectCaseStudyPoint[];
  approachSteps: ProjectCaseStudyPoint[];
  solutionPoints: ProjectCaseStudyPoint[];
  solutionIntro?: string;
  highlights: string[];
  platformContext?: string;
  outcomeHeading?: string;
  sectionHeadings?: ProjectCaseStudyHeadings;
  serviceLinks?: ProjectServiceLink[];
  engineeringIntro?: string;
  engineeringStacks?: ProjectEngineeringStack[];
  gallery?: ProjectGalleryItem[];
  caseStudyCta?: ProjectCaseStudyCta;
  externalLinkLabel?: string;
};

/**
 * Editorial case-study narratives derived from verified project facts only.
 * Does not invent metrics, quotes, platforms or services.
 */
export const caseStudyNarratives: Record<string, CaseStudyNarrative> = {
  padeya: {
    heroStatement:
      "A digital event platform built to connect hosts, fans, ambassadors and sponsors before, during and after an event.",
    introHeading: "Building more than an event ticketing website.",
    challenges: [
      {
        title: "More than ticket sales",
        description:
          "Traditional ticketing platforms often end their relationship with users once a ticket is purchased. Pàdéyá needed to support the wider event lifecycle — from discovery and promotion to attendance, memories and future engagement.",
      },
      {
        title: "Different users, different workflows",
        description:
          "Fans, hosts, ambassadors, sponsors and administrators each needed their own experience without turning the product into a collection of disconnected dashboards.",
      },
      {
        title: "Reliable payments and admission",
        description:
          "Ticket creation needed to depend on verified payment, while admission required secure QR-based check-in without exposing sensitive internal identifiers.",
      },
      {
        title: "Building host reputation over time",
        description:
          "Hosts needed more than an event listing. The platform required a way to build a lasting public identity around completed events, verified attendance, reviews and other proven activity.",
      },
      {
        title: "Supporting event growth",
        description:
          "Hosts needed tools for ambassadors, promotion, merchandise, sponsorship, audience relationships and analytics without managing several disconnected systems.",
      },
    ],
    approachSteps: [
      {
        title: "Product architecture",
        description:
          "We mapped the platform around the main participants in the event ecosystem: fans, hosts, ambassadors, sponsors and administrators.",
      },
      {
        title: "Role-based experiences",
        description:
          "Each role received purpose-built workflows while sharing the same underlying event, payment, identity and engagement infrastructure.",
      },
      {
        title: "Trust-first infrastructure",
        description:
          "Payments, tickets, QR admission, permissions, reviews and financial records were designed around server-side validation and controlled access rather than frontend assumptions.",
      },
      {
        title: "Connected event lifecycle",
        description:
          "We designed workflows that continue beyond checkout through host follows, Fan Passports, verified check-ins, Memories, reviews and repeat engagement.",
      },
      {
        title: "Growth infrastructure",
        description:
          "Ambassador campaigns, host CRM, sponsorship opportunities, merchandise and analytics were built into the wider platform rather than added as isolated tools.",
      },
    ],
    solutionIntro:
      "Pàdéyá became a multi-sided event platform combining public event discovery with operational tools behind the scenes. The platform gives fans a richer way to discover and remember events while giving hosts infrastructure for managing events, audiences, promotion and long-term reputation.",
    solutionPoints: [
      {
        title: "Event discovery and ticketing",
        description:
          "Visitors can discover public events by location, category and other relevant criteria, view event information and move through structured ticket-purchase flows. Tickets are issued only after verified payment.",
      },
      {
        title: "Host workspace",
        description:
          "Hosts can create and manage events, ticket types, event media, attendees, check-ins, promotions and operational information from a dedicated workspace.",
      },
      {
        title: "QR admission",
        description:
          "Secure ticket QR codes support event admission and verified check-ins while avoiding raw internal identifiers in public-facing QR payloads.",
      },
      {
        title: "Fan Passport",
        description:
          "Fans can build a persistent identity around the events, hosts and experiences they interact with rather than starting from zero after every event.",
      },
      {
        title: "Event Memories",
        description:
          "Events continue after the final check-in through Memories, allowing event photos and moments to become part of the event’s lasting experience.",
      },
      {
        title: "Host Legacy",
        description:
          "Pàdéyá Legacy turns verified hosting activity into a long-term reputation system based on factors such as ratings, completed events, ticket sales, verified check-ins and consistency.",
      },
      {
        title: "Ambassador infrastructure",
        description:
          "Hosts can run event-specific ambassador campaigns, while Pàdéyá can operate platform-wide programs. The system tracks attribution, commission earnings and funding responsibility while keeping host-funded and Pàdéyá-funded earnings separate.",
      },
      {
        title: "Sponsorship and merchandise",
        description:
          "The platform extends beyond ticketing with sponsorship and merchandise capabilities, giving events additional ways to build commercial relationships around their audiences.",
      },
      {
        title: "AI-assisted experience",
        description:
          "Pàdéyá includes an AI assistant architecture designed to help visitors discover public content and help authenticated users navigate their dashboards and understand permitted account information.",
      },
      {
        title: "Administration and platform operations",
        description:
          "A dedicated administration layer supports moderation, taxonomy management, financial visibility, platform configuration, content operations and other controlled workflows.",
      },
    ],
    highlights: [
      "Multi-role event platform",
      "Event discovery and ticketing",
      "Paystack payment integration",
      "Secure QR admission",
      "Host management dashboard",
      "Fan Passport",
      "Event Memories",
      "Host Legacy reputation system",
      "Ambassador and referral infrastructure",
      "Merchandise support",
      "Sponsorship workflows",
      "Role-based permissions",
      "Analytics and reporting",
      "AI assistant architecture",
      "Responsive public and dashboard experiences",
    ],
    platformContext:
      "Pàdéyá combines a modern Next.js frontend with a Python FastAPI backend to support public discovery experiences alongside authenticated, data-intensive dashboards. Instead of relying on a conventional CMS architecture, the application uses structured APIs, role-based permissions and purpose-built services for events, payments, tickets, referrals and platform operations.",
    outcomeHeading: "A connected foundation for the event lifecycle.",
    sectionHeadings: {
      challenge: "Turning disconnected event workflows into one platform.",
      approach: "How we approached the product",
      solution: "What we designed and built",
      engineering: "Built as a modern web application",
      platform: "Built with Next.js and FastAPI",
    },
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
    caseStudyCta: {
      title: "Planning a Digital Product or Platform?",
      description:
        "If you need a custom platform, marketplace, dashboard or web application, tell us what you're building and what the product needs to do.",
    },
    externalLinkLabel: "Visit Pàdéyá",
  },
  "gemini-corporate-relocations": {
    heroStatement:
      "A clearer digital home for corporate relocation and accommodation services.",
    challenges: [
      {
        title: "Clearer service presentation",
        description:
          "Corporate housing services needed a more professional structure so visitors could understand what Gemini offers.",
      },
      {
        title: "Easier accommodation discovery",
        description:
          "Clients needed a simpler way to explore short- and long-term rental options.",
      },
      {
        title: "Responsive experience",
        description:
          "The website needed to work clearly across desktop and mobile devices.",
      },
      {
        title: "Search-ready foundations",
        description:
          "The site needed stronger on-page SEO foundations to support discovery for corporate housing and relocation services.",
      },
    ],
    approachSteps: [
      {
        title: "Discovery",
        description:
          "Zoom consultations to understand services, audiences and the key actions visitors needed to take.",
      },
      {
        title: "Structure",
        description:
          "Organize service and property information into clearer journeys for corporate clients.",
      },
      {
        title: "Design",
        description:
          "Create professional layouts with strong imagery and clear descriptions of rental options.",
      },
      {
        title: "Development",
        description:
          "Build a maintainable WordPress website with property listings and booking pathways.",
      },
      {
        title: "SEO",
        description:
          "Implement on-page SEO foundations for corporate housing and relocation visibility.",
      },
    ],
    solutionPoints: [
      {
        title: "Service architecture",
        description:
          "Services and accommodation options were organized so visitors could understand offerings more quickly.",
      },
      {
        title: "Property listings",
        description:
          "Detailed property presentation helped clients explore short- and long-term rental options.",
      },
      {
        title: "Booking pathways",
        description:
          "Clearer enquiry and booking support helped streamline the rental and relocation process.",
      },
      {
        title: "WordPress delivery",
        description:
          "A responsive WordPress build gave the team a professional site they can update independently after training.",
      },
      {
        title: "SEO foundations",
        description:
          "On-page SEO foundations were added to support search visibility for key service themes.",
      },
    ],
    highlights: [
      "Responsive WordPress website",
      "Clearer service architecture",
      "Property listings and booking pathways",
      "SEO foundations",
      "Post-launch training",
    ],
    platformContext:
      "WordPress provided a flexible content-management foundation so the Gemini team can manage updates after launch.",
    outcomeHeading: "What changed after the project",
  },
  "katerinas-place": {
    heroStatement:
      "A boutique vacation-home website that puts property character and booking clarity first.",
    challenges: [
      {
        title: "Property storytelling",
        description:
          "The renovated vacation home needed a site that reflected its character near Timenio beach and Nafplio.",
      },
      {
        title: "Clearer guest experience",
        description:
          "Visitors needed an aesthetically strong, easy-to-use experience that made the property easy to understand.",
      },
      {
        title: "Simpler booking path",
        description:
          "The booking journey needed to feel smoother and more intuitive for guests.",
      },
      {
        title: "Local discovery",
        description:
          "SEO foundations were needed to support discovery for the property and location.",
      },
    ],
    approachSteps: [
      {
        title: "Discovery",
        description:
          "Consultations to capture brand expectations, guest needs and the property’s atmosphere.",
      },
      {
        title: "Design",
        description:
          "Warm, property-led layouts highlighting ambience, amenities and location.",
      },
      {
        title: "Development",
        description:
          "WordPress implementation with detailed property information and a streamlined booking journey.",
      },
      {
        title: "SEO",
        description:
          "SEO best practices to support discovery for the property and location.",
      },
    ],
    solutionPoints: [
      {
        title: "Property-led presentation",
        description:
          "Strong imagery and clear property details help guests understand the stay before they enquire.",
      },
      {
        title: "Booking journey",
        description:
          "An intuitive booking path reduces friction between interest and the next guest action.",
      },
      {
        title: "Responsive WordPress site",
        description:
          "A maintainable WordPress website with post-launch training so the team can manage updates.",
      },
      {
        title: "SEO foundations",
        description:
          "Search foundations support visibility for the property and destination.",
      },
    ],
    highlights: [
      "Property storytelling",
      "Direct booking support",
      "Responsive WordPress website",
      "SEO foundations",
      "Post-launch training",
    ],
    platformContext:
      "WordPress supports property content updates and a maintainable booking-focused site structure.",
    outcomeHeading: "What changed after the project",
  },
  "the-coast": {
    heroStatement:
      "A boutique coastal hospitality website with clearer booking and enquiry paths.",
    challenges: [
      {
        title: "Property presentation",
        description:
          "The coastal stay needed a visually appealing platform that presented the property clearly.",
      },
      {
        title: "Guest next steps",
        description:
          "Guests needed a smoother way to check availability and get in touch.",
      },
      {
        title: "Hospitality atmosphere",
        description:
          "The site needed to communicate coastal atmosphere without losing clarity around rooms and next steps.",
      },
      {
        title: "Ongoing management",
        description:
          "The team needed training and maintainable templates for ongoing updates.",
      },
    ],
    approachSteps: [
      {
        title: "Discovery",
        description:
          "Consultations to understand the property, guest journeys and booking priorities.",
      },
      {
        title: "Design",
        description:
          "Coastal, hospitality-led visuals with clear hierarchy for rooms, experience and next steps.",
      },
      {
        title: "Development",
        description:
          "WordPress build with booking and enquiry pathways plus maintainable templates.",
      },
      {
        title: "SEO",
        description:
          "SEO foundations to support discoverability for coastal stays.",
      },
    ],
    solutionPoints: [
      {
        title: "Visual storytelling",
        description:
          "Strong coastal presentation helps guests understand the stay before they enquire.",
      },
      {
        title: "Booking and contact paths",
        description:
          "Clearer availability and contact journeys make the next step easier for guests.",
      },
      {
        title: "Maintainable WordPress setup",
        description:
          "Templates and training support independent updates, with ongoing maintenance support available.",
      },
      {
        title: "SEO foundations",
        description:
          "Search foundations support discovery for coastal hospitality searches.",
      },
    ],
    highlights: [
      "Boutique hospitality website",
      "Clearer booking and enquiry paths",
      "WordPress delivery",
      "SEO foundations",
      "Training and maintenance support",
    ],
    platformContext:
      "WordPress supports hospitality content updates and maintainable booking/enquiry templates.",
    outcomeHeading: "What changed after the project",
  },
  "banyan-vacations": {
    heroStatement:
      "A refreshed vacation rental website focused on hospitality and clearer property presentation.",
    challenges: [
      {
        title: "Property presentation",
        description:
          "Homes needed to be showcased more clearly for a family-owned vacation rental business.",
      },
      {
        title: "Guest engagement",
        description:
          "The website needed a more professional experience that improved how guests explore properties.",
      },
      {
        title: "Content clarity",
        description:
          "Property pages needed cleaner layouts that highlight rentals without clutter.",
      },
      {
        title: "Search foundations",
        description:
          "SEO best practices were needed to support visibility for vacation rental searches.",
      },
    ],
    approachSteps: [
      {
        title: "Discovery",
        description:
          "A series of Zoom consultations to align on goals, property priorities and guest expectations.",
      },
      {
        title: "Design",
        description:
          "Clean, hospitality-focused layouts that highlight rental properties without clutter.",
      },
      {
        title: "Development",
        description:
          "WordPress implementation with property-focused pages and maintainable structure.",
      },
      {
        title: "SEO",
        description:
          "SEO best practices to support visibility for vacation rental searches.",
      },
    ],
    solutionPoints: [
      {
        title: "Stronger visual design",
        description:
          "A clearer visual system helps guests understand properties more quickly.",
      },
      {
        title: "Property-focused pages",
        description:
          "Interactive property presentation improves how homes are explored online.",
      },
      {
        title: "WordPress rebuild",
        description:
          "A dynamic WordPress website with training for independent content updates.",
      },
      {
        title: "SEO foundations",
        description:
          "Search foundations support a stronger digital presence for vacation rental searches.",
      },
    ],
    highlights: [
      "Website redesign and rebuild",
      "Improved property presentation",
      "WordPress delivery",
      "SEO foundations",
      "Post-launch training",
    ],
    platformContext:
      "WordPress gives the family-owned team a maintainable way to update property content.",
    outcomeHeading: "What changed after the project",
  },
  "overlook-cabin-rentals": {
    heroStatement:
      "A cabin rental redesign focused on atmosphere, listings and clearer guest exploration.",
    challenges: [
      {
        title: "Cabin presentation",
        description:
          "Cabin offerings needed to be displayed more effectively for guests exploring scenic stays.",
      },
      {
        title: "Clearer navigation",
        description:
          "Guests needed an easier way to explore cabins and enquire about stays.",
      },
      {
        title: "Atmosphere without clutter",
        description:
          "The redesign needed to keep scenic, cabin-led imagery while remaining easy to scan.",
      },
      {
        title: "Search visibility",
        description:
          "SEO foundations were needed to improve search visibility for cabin rentals.",
      },
    ],
    approachSteps: [
      {
        title: "Discovery",
        description:
          "Multiple Zoom consultations to define redesign priorities and guest journeys.",
      },
      {
        title: "Design",
        description:
          "Scenic, cabin-led imagery with easy-to-scan property presentation.",
      },
      {
        title: "Development",
        description:
          "WordPress redesign with maintainable templates for cabin listings.",
      },
      {
        title: "SEO",
        description:
          "SEO foundations to improve search visibility for cabin rentals.",
      },
    ],
    solutionPoints: [
      {
        title: "Cabin-led redesign",
        description:
          "A visually stronger site showcases cabin stays more clearly for prospective guests.",
      },
      {
        title: "Improved exploration",
        description:
          "Clearer navigation and listing presentation help guests explore and enquire.",
      },
      {
        title: "Maintainable WordPress templates",
        description:
          "Templates and training support ongoing cabin listing updates.",
      },
      {
        title: "SEO foundations",
        description:
          "Search foundations support stronger online presence for cabin rental searches.",
      },
    ],
    highlights: [
      "Full website redesign",
      "Improved cabin presentation",
      "WordPress delivery",
      "SEO foundations",
      "Post-launch training",
    ],
    platformContext:
      "WordPress supports maintainable cabin listing templates and ongoing content updates.",
    outcomeHeading: "What changed after the project",
  },
  "nashville-home-viewer": {
    heroStatement:
      "A real estate website refresh focused on listings clarity and buyer engagement.",
    challenges: [
      {
        title: "Listing presentation",
        description:
          "Property listings needed to be showcased more effectively for buyers and sellers.",
      },
      {
        title: "Clearer buyer experience",
        description:
          "Prospective buyers needed a cleaner path through listings and property information.",
      },
      {
        title: "Engagement",
        description:
          "The website refresh needed to improve how visitors engage with properties and contact paths.",
      },
      {
        title: "Local search foundations",
        description:
          "SEO best practices were needed to support property and local search visibility.",
      },
    ],
    approachSteps: [
      {
        title: "Discovery",
        description:
          "Consultations to define listing priorities, buyer journeys and refresh requirements.",
      },
      {
        title: "Design",
        description:
          "Clean real-estate layouts prioritizing property imagery and listing clarity.",
      },
      {
        title: "Development",
        description:
          "WordPress build with property listing features and contact pathways.",
      },
      {
        title: "SEO",
        description:
          "SEO best practices to support property and local search visibility.",
      },
    ],
    solutionPoints: [
      {
        title: "Stronger listing presentation",
        description:
          "Property imagery and listing structure help buyers evaluate homes more clearly.",
      },
      {
        title: "Interactive property features",
        description:
          "Listing-focused features support clearer engagement with available properties.",
      },
      {
        title: "WordPress refresh",
        description:
          "A sleek WordPress website with training so the team can manage updates.",
      },
      {
        title: "SEO foundations",
        description:
          "Search foundations support visibility for property and local searches.",
      },
    ],
    highlights: [
      "Real estate website refresh",
      "Improved listing presentation",
      "WordPress delivery",
      "SEO foundations",
      "Post-launch training",
    ],
    platformContext:
      "WordPress supports listing updates and maintainable real estate content structures.",
    outcomeHeading: "What changed after the project",
  },
  "kaerek-homes": {
    heroStatement:
      "A modern real estate website with clearer property storytelling and enquiry support.",
    challenges: [
      {
        title: "Portfolio presentation",
        description:
          "Homes needed a modern, user-friendly platform that presented the portfolio clearly.",
      },
      {
        title: "Detailed property information",
        description:
          "Prospective buyers needed clearer property details before making contact.",
      },
      {
        title: "Interactive engagement",
        description:
          "The experience needed stronger listing interaction and clearer enquiry paths.",
      },
      {
        title: "Search foundations",
        description:
          "SEO foundations were needed to improve visibility for listings and services.",
      },
    ],
    approachSteps: [
      {
        title: "Discovery",
        description:
          "Zoom consultations to define portfolio priorities, buyer journeys and enquiry needs.",
      },
      {
        title: "Design",
        description:
          "Modern property-led layouts with strong imagery hierarchy and clear CTAs.",
      },
      {
        title: "Development",
        description:
          "WordPress implementation with interactive listings and enquiry forms.",
      },
      {
        title: "SEO",
        description:
          "SEO foundations to improve search visibility for listings and services.",
      },
    ],
    solutionPoints: [
      {
        title: "Property storytelling",
        description:
          "Strong imagery hierarchy helps buyers understand homes before they enquire.",
      },
      {
        title: "Interactive listings",
        description:
          "Listing features and enquiry forms support clearer engagement with the portfolio.",
      },
      {
        title: "Responsive WordPress site",
        description:
          "A maintainable WordPress website with post-launch training for the client team.",
      },
      {
        title: "SEO foundations",
        description:
          "Search foundations support visibility for listings and real estate services.",
      },
    ],
    highlights: [
      "Modern real estate website",
      "Interactive property presentation",
      "WordPress delivery",
      "SEO foundations",
      "Post-launch training",
    ],
    platformContext:
      "WordPress supports portfolio updates and maintainable enquiry-focused listing pages.",
    outcomeHeading: "What changed after the project",
  },
  "zen-stays-rental": {
    heroStatement:
      "A short-term rental and property management website for both guests and hosts.",
    challenges: [
      {
        title: "Unified guest and host journeys",
        description:
          "The site needed to present services, listings and collaboration opportunities in one place.",
      },
      {
        title: "Stalled previous attempts",
        description:
          "Previous website attempts had stalled, so delivery needed to stay collaborative and practical.",
      },
      {
        title: "Simplified customer journey",
        description:
          "Browsing, booking and payments needed a clearer path for guests.",
      },
      {
        title: "Self-managed content",
        description:
          "The team needed a WordPress setup they could manage themselves after launch.",
      },
    ],
    approachSteps: [
      {
        title: "Discovery",
        description:
          "A detailed requirements call to define guest, host and property-management priorities.",
      },
      {
        title: "Design",
        description:
          "Clear service and listing presentation for both guest and host audiences.",
      },
      {
        title: "Development",
        description:
          "WordPress build oriented around browsing, booking and maintainable content updates.",
      },
    ],
    solutionPoints: [
      {
        title: "Guest and host clarity",
        description:
          "Services and listings are presented so both audiences can understand where to start.",
      },
      {
        title: "Simplified journey",
        description:
          "Browsing and booking pathways were streamlined for a clearer customer experience.",
      },
      {
        title: "Collaborative WordPress delivery",
        description:
          "Real-time client involvement helped finish a practical site the team can update themselves.",
      },
    ],
    highlights: [
      "Guest and host website",
      "Simplified browsing and booking journey",
      "WordPress delivery",
      "Client-managed content",
    ],
    platformContext:
      "WordPress enables the Zen Stays team to manage listings and content without depending on developers for every update.",
    outcomeHeading: "What changed after the project",
  },
};
