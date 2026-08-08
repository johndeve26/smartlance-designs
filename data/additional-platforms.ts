import type { Platform } from "@/types";

/**
 * Expanded platform catalogue entries.
 * Use capability language (“we can…”) unless verifiedExperience is true.
 */
export const additionalPlatforms: Platform[] = [
  {
    slug: "woocommerce",
    name: "WooCommerce",
    title: "WooCommerce Website Design & Development",
    href: "/platforms/woocommerce",
    summary:
      "Flexible WordPress-powered stores focused on product discovery, usability, SEO and conversion.",
    description:
      "WooCommerce can be a strong fit when you want e-commerce on WordPress — with product pages, categories and checkout journeys designed around how customers shop. Smartlance can set up, redesign and improve WooCommerce storefronts with attention to usability, performance and SEO foundations.",
    tagline:
      "Flexible WordPress-powered e-commerce websites built around product discovery, usability, SEO and conversion.",
    icon: "shopping-bag",
    featured: true,
    group: "ecommerce",
    prominence: "high",
    navigationFeatured: true,
    verifiedExperience: false,
    platformMatch: "WooCommerce",
    audiences: [
      "Product brands already comfortable with WordPress",
      "Stores that need content and commerce on one platform",
      "Businesses redesigning an existing WooCommerce shop",
      "Catalogues that need clear category and product journeys",
    ],
    whenItFits: [
      "You want commerce tightly connected to a WordPress content site",
      "Your team already manages WordPress day to day",
      "Product discovery and content marketing matter together",
      "You need flexible storefront design beyond a rigid theme",
    ],
    capabilities: [
      "WooCommerce setup and storefront design",
      "Product and category page structure",
      "Cart and checkout UX improvements",
      "Responsive commerce experiences",
      "Payment and essential store integrations where appropriate",
      "Performance foundations for product templates",
      "SEO foundations for products and categories",
      "WooCommerce redesigns for outdated stores",
      "Ongoing maintenance for WordPress + WooCommerce sites",
    ],
    challenges: [
      "Product pages are hard to scan or trust",
      "Checkout feels slow or confusing on mobile",
      "Category structures create thin or duplicate pages",
      "Plugins and themes are hurting store performance",
      "Content marketing and shop pages feel disconnected",
    ],
    seoSection: {
      title: "WooCommerce SEO Depends on Structure and Performance",
      intro:
        "Product and category templates can support search visibility when URLs, metadata, internal linking and page speed are handled carefully. Faceted navigation and thin product content are common risks.",
      points: [
        "Product and category architecture",
        "Metadata and heading hierarchy on templates",
        "Faceted URL and crawl control considerations",
        "Structured data for products where appropriate",
        "Image optimization for large catalogues",
        "Performance on product and archive templates",
        "Internal linking between content and commerce pages",
      ],
    },
    conversionNote:
      "WooCommerce conversion work focuses on product clarity, trust signals, cart friction and checkout usability — especially on mobile — so shoppers can move from discovery to purchase with fewer obstacles.",
    migrationNote:
      "If you are comparing WooCommerce and Shopify, or moving an existing store, we assess catalogue complexity, content needs and operational fit before recommending redesign within WooCommerce or a platform migration.",
    relatedServiceHrefs: [
      "/services/ecommerce-development",
      "/services/conversion-rate-optimization",
      "/services/website-performance-optimization",
      "/services/website-maintenance",
      "/platforms/wordpress",
      "/seo",
    ],
    relatedSeoHrefs: ["technical-seo", "on-page-seo"],
    faqs: [
      {
        question: "WooCommerce or Shopify?",
        answer:
          "It depends on catalogue needs, content strategy, integrations and how your team wants to manage the site. WooCommerce often suits businesses that want commerce on WordPress. Shopify is often stronger when the store itself is the centre of the business.",
      },
      {
        question: "Can WooCommerce handle a large catalogue?",
        answer:
          "It can, when architecture, hosting, performance and template design are handled carefully. Large catalogues need more discipline around speed, filtering and SEO structure.",
      },
      {
        question: "Can you improve checkout?",
        answer:
          "Yes. We can review cart and checkout friction, mobile usability and trust cues — then improve the journey within the capabilities of your WooCommerce setup.",
      },
      {
        question: "Can you optimize an existing WooCommerce site?",
        answer:
          "Yes. Many engagements improve an existing storefront rather than starting from zero — covering design, UX, performance, SEO foundations and conversion paths.",
      },
      {
        question: "Do you claim enterprise WooCommerce specialization?",
        answer:
          "No. We support practical WooCommerce websites and storefront improvements. Complex enterprise programmes are scoped honestly based on requirements.",
      },
    ],
    ctaTitle: "Planning or Improving a WooCommerce Store?",
    ctaDescription:
      "Tell us about your catalogue and current store. We will recommend whether redesign, performance work or a platform review is the right next step.",
    metaTitle: "WooCommerce Website Design & Development",
    metaDescription:
      "WooCommerce website design and development focused on product discovery, checkout usability, SEO foundations and conversion.",
  },
  {
    slug: "webflow",
    name: "Webflow",
    title: "Webflow Website Design & Development",
    href: "/platforms/webflow",
    summary:
      "Marketing websites with flexible visual development and a clean content-management experience.",
    description:
      "Webflow can work well for marketing-led websites that need flexible design, structured content and an editing experience teams can manage. Smartlance can use Webflow for business websites, landing pages and redesigns where its capabilities fit the project — without treating animation as the main goal.",
    tagline:
      "High-quality marketing websites with flexible visual development and a clean content-management experience.",
    icon: "layout-template",
    featured: true,
    group: "websites",
    prominence: "high",
    navigationFeatured: true,
    verifiedExperience: false,
    platformMatch: "Webflow",
    audiences: [
      "Marketing-led businesses and brands",
      "Companies that need flexible page design",
      "Teams that want structured CMS collections",
      "Projects focused on landing pages and conversion",
    ],
    whenItFits: [
      "Design flexibility matters more than a traditional CMS theme model",
      "Marketing pages and CMS collections drive the site",
      "You want strong visual control with structured content",
      "Interactions are useful, not the entire proposition",
    ],
    capabilities: [
      "Webflow marketing website design and build",
      "Responsive layouts across devices",
      "CMS collections and content models",
      "Landing pages and campaign sites",
      "SEO foundations and metadata structure",
      "Performance-conscious builds",
      "Conversion-focused page hierarchy",
      "Redesigns for existing Webflow sites",
      "Practical interactions where they support clarity",
    ],
    challenges: [
      "The current site looks polished but converts poorly",
      "CMS structure makes publishing awkward",
      "Pages are heavy or slow on mobile",
      "SEO foundations were never planned into the build",
      "Designers and marketers need a clearer editing model",
    ],
    seoSection: {
      title: "Webflow Can Support SEO When Structure Is Planned",
      intro:
        "Webflow sites need the same fundamentals as any serious marketing website: clear architecture, metadata, redirects, performance and content that matches search intent.",
      points: [
        "Page architecture and URL structure",
        "Metadata and heading hierarchy",
        "CMS collection SEO patterns",
        "Redirect handling during redesigns",
        "Performance and image discipline",
        "Structured content that supports topical clarity",
        "Internal linking across marketing pages",
      ],
    },
    conversionNote:
      "Webflow conversion work focuses on clarity of offer, CTA hierarchy, form placement and landing-page structure — so strong design still leads to useful next steps.",
    migrationNote:
      "Webflow can be a destination for marketing-site migrations or a platform to redesign within. We compare content models, editing needs and SEO risk before recommending a move from WordPress or another CMS.",
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/ui-ux-design",
      "/services/website-development",
      "/services/landing-page-design",
      "/services/conversion-rate-optimization",
      "/seo",
    ],
    relatedSeoHrefs: ["on-page-seo", "technical-seo"],
    faqs: [
      {
        question: "Is Webflow good for SEO?",
        answer:
          "It can be, when architecture, metadata, performance and content are handled properly. The platform alone does not create rankings.",
      },
      {
        question: "Can you redesign an existing Webflow site?",
        answer:
          "Yes. We can improve structure, design, conversion paths and SEO foundations on an existing Webflow project.",
      },
      {
        question: "Can you migrate WordPress to Webflow?",
        answer:
          "Sometimes. It depends on content volume, editorial needs and SEO risk. We assess whether redesigning or migrating makes more sense.",
      },
      {
        question: "Can clients edit content after launch?",
        answer:
          "Yes. Webflow CMS collections and Editor workflows can be set up so teams update content without breaking layouts.",
      },
      {
        question: "Is Webflow mainly about animations?",
        answer:
          "No. Interactions can help, but Smartlance positions Webflow as a serious business marketing website platform — clarity and conversion come first.",
      },
    ],
    ctaTitle: "Considering Webflow for Your Website?",
    ctaDescription:
      "Tell us about your marketing goals and content needs. We will help assess whether Webflow fits — or whether another platform is more practical.",
    metaTitle: "Webflow Website Design & Development",
    metaDescription:
      "Webflow website design and development for marketing sites, CMS collections, landing pages, SEO foundations and conversion.",
  },
  {
    slug: "wix-studio",
    name: "Wix Studio",
    title: "Wix Studio Website Design & Development",
    href: "/platforms/wix-studio",
    summary:
      "Business websites and responsive layouts built for teams that need a managed, editable site experience.",
    description:
      "Wix Studio can suit businesses that need professional responsive websites, CMS-driven pages and practical ongoing management. Smartlance can design, redesign and improve Wix Studio sites for clarity, SEO foundations and conversion — without positioning this as a basic template-only service. Existing simpler Wix sites can also be reviewed or considered for migration when appropriate.",
    tagline:
      "Business websites with responsive layouts, CMS and practical day-to-day editing.",
    icon: "monitor",
    group: "websites",
    prominence: "medium",
    navigationFeatured: false,
    verifiedExperience: false,
    platformMatch: "Wix Studio",
    audiences: [
      "Local and service businesses",
      "Teams that want managed website editing",
      "Businesses redesigning an existing Wix presence",
      "Projects that need landing pages and forms quickly",
    ],
    whenItFits: [
      "You need a polished business site with manageable editing",
      "Responsive layout control matters for marketing pages",
      "Forms, CMS and integrations are part of the workflow",
      "A simpler managed platform fits better than a heavy custom stack",
    ],
    capabilities: [
      "Wix Studio business website design and build",
      "Responsive layout planning",
      "CMS-driven pages and content structure",
      "Landing pages and lead-capture forms",
      "Website redesign within Wix Studio",
      "SEO foundations and page hierarchy",
      "Performance-minded improvements",
      "Integrations and ongoing site management support",
      "Reviews of existing Wix sites with migration advice when useful",
    ],
    challenges: [
      "The current Wix site looks generic or inconsistent",
      "Mobile layouts feel awkward",
      "SEO foundations were never structured properly",
      "Forms and CTAs are weak",
      "The business has outgrown a template-led setup",
    ],
    seoSection: {
      title: "Wix Studio SEO Still Needs Clear Architecture",
      intro:
        "Managed platforms can rank when page structure, metadata, content hierarchy and performance are treated seriously. Template convenience is not a substitute for search-aware planning.",
      points: [
        "Site architecture and navigation clarity",
        "Metadata and heading structure",
        "Content hierarchy for service pages",
        "Performance and media optimization",
        "Form and landing-page SEO considerations",
        "Redirect planning during redesigns",
      ],
    },
    conversionNote:
      "Conversion on Wix Studio sites usually improves through clearer offers, stronger CTAs, simpler forms and better mobile journeys — not through adding more decorative sections.",
    migrationNote:
      "Some businesses stay on Wix Studio and redesign. Others eventually move to WordPress, Webflow or another platform. We evaluate editing needs, SEO risk and growth plans before recommending either path.",
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-redesign",
      "/services/website-maintenance",
      "/services/website-migration",
      "/seo",
    ],
    relatedSeoHrefs: ["on-page-seo", "local-seo"],
    faqs: [
      {
        question: "Is this the same as basic Wix template work?",
        answer:
          "No. The focus is Wix Studio for business websites — responsive design, structure, SEO foundations and conversion — not dragging a generic template live unchanged.",
      },
      {
        question: "Can you help with an existing Wix site?",
        answer:
          "Yes. Existing Wix sites can be reviewed, improved or assessed for a Studio redesign or migration when that better fits the business.",
      },
      {
        question: "Do you claim Wix Partner status?",
        answer:
          "No. We do not claim official Wix Partner certification on this site.",
      },
      {
        question: "Can clients edit the site after launch?",
        answer:
          "Yes. A practical editing experience is usually part of why businesses choose Wix Studio.",
      },
      {
        question: "When might another platform be better?",
        answer:
          "Complex custom functionality, large-scale commerce or highly specialised integrations may fit WordPress, Shopify or another platform better. We advise based on requirements.",
      },
    ],
    ctaTitle: "Need a Better Wix Studio Website?",
    ctaDescription:
      "Share your current site and goals. We will recommend redesign, SEO and conversion improvements — or whether another platform fits better.",
    metaTitle: "Wix Studio Website Design & Development",
    metaDescription:
      "Wix Studio website design and development for business sites, responsive layouts, CMS, SEO foundations and conversion.",
  },
  {
    slug: "squarespace",
    name: "Squarespace",
    title: "Squarespace Website Design & Development",
    href: "/platforms/squarespace",
    summary:
      "Clean professional websites for service, hospitality and content-led businesses that need straightforward editing.",
    description:
      "Squarespace can be a good fit for businesses that need a clean professional website, clear service pages and simple content management. Smartlance can design, redesign and improve Squarespace sites with SEO foundations and conversion in mind — and will also advise when another platform is a better long-term fit.",
    tagline:
      "Clean professional websites for service pages, portfolios, hospitality and local businesses.",
    icon: "building",
    group: "websites",
    prominence: "medium",
    navigationFeatured: false,
    verifiedExperience: false,
    platformMatch: "Squarespace",
    audiences: [
      "Professional service firms",
      "Hospitality and lifestyle brands",
      "Local businesses",
      "Portfolio and studio websites",
    ],
    whenItFits: [
      "You need a polished site with straightforward editing",
      "Service pages and storytelling matter more than complex commerce",
      "The team wants a managed platform without heavy developer overhead",
      "Landing pages and SEO foundations are part of the plan",
    ],
    capabilities: [
      "Squarespace website design and setup",
      "Service, portfolio and hospitality page structure",
      "Landing pages and enquiry paths",
      "Responsive layout refinement",
      "SEO foundations and content hierarchy",
      "Redesigns for existing Squarespace sites",
      "Forms and basic integrations",
      "Ongoing maintenance and improvement support",
    ],
    challenges: [
      "The site looks neat but under-explains the offer",
      "Templates limit the conversion journey",
      "SEO structure is incomplete",
      "Mobile layouts need refinement",
      "The business is outgrowing simpler commerce or custom needs",
    ],
    seoSection: {
      title: "Squarespace SEO Relies on Clear Page Hierarchy",
      intro:
        "Squarespace can support search visibility when pages are structured around real topics, metadata is handled carefully and performance stays disciplined.",
      points: [
        "Page structure and navigation clarity",
        "Metadata and heading hierarchy",
        "Content depth on service pages",
        "Performance and media optimization",
        "Internal linking between key pages",
        "Redirect planning during redesigns",
      ],
    },
    conversionNote:
      "Squarespace conversion improvements usually come from clearer messaging, stronger CTAs, better mobile enquiry paths and fewer decorative distractions.",
    migrationNote:
      "Squarespace is often a strong fit for cleaner marketing sites. Businesses with complex custom functionality or large-scale commerce may benefit from WordPress, Shopify or another platform. We advise without forcing a migration.",
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/website-redesign",
      "/services/website-maintenance",
      "/services/website-migration",
      "/seo",
    ],
    relatedSeoHrefs: ["on-page-seo", "local-seo"],
    faqs: [
      {
        question: "Is Squarespace right for every business?",
        answer:
          "No. It is often a good fit for clean professional and hospitality-style sites. Complex custom functionality or large-scale commerce may fit another platform better.",
      },
      {
        question: "Can you redesign an existing Squarespace site?",
        answer:
          "Yes. Redesign and restructuring work is common when the current template no longer supports the brand or conversion goals.",
      },
      {
        question: "Can Squarespace support SEO?",
        answer:
          "Yes, when page structure, metadata, content and performance are handled intentionally.",
      },
      {
        question: "When should we migrate away from Squarespace?",
        answer:
          "When requirements exceed what the platform handles well — such as complex custom workflows or large commerce catalogues. We assess before recommending a move.",
      },
      {
        question: "Do clients manage content themselves?",
        answer:
          "Usually yes. Straightforward content management is one of Squarespace’s practical strengths.",
      },
    ],
    ctaTitle: "Want More From Your Squarespace Website?",
    ctaDescription:
      "Tell us what feels limited today. We will recommend redesign, SEO and conversion improvements — or whether another platform fits better.",
    metaTitle: "Squarespace Website Design & Development",
    metaDescription:
      "Squarespace website design and development for service, hospitality and local businesses — with SEO foundations and conversion focus.",
  },
  {
    slug: "framer",
    name: "Framer",
    title: "Framer Website Design & Development",
    href: "/platforms/framer",
    summary:
      "Modern marketing and product websites for startups, campaigns and conversion-oriented experiences.",
    description:
      "Framer can be particularly useful for visually polished marketing and product experiences where responsive design, campaign pages and conversion matter. Smartlance can use Framer when those needs fit — without treating it as the right platform for every website.",
    tagline:
      "Modern marketing websites, product sites and campaign pages with a conversion-minded design approach.",
    icon: "sparkles",
    group: "websites",
    prominence: "medium",
    navigationFeatured: false,
    verifiedExperience: false,
    platformMatch: "Framer",
    audiences: [
      "Startups and product teams",
      "Campaign and launch websites",
      "Marketing sites that need a modern visual presence",
      "Landing-page led growth projects",
    ],
    whenItFits: [
      "You need a polished marketing or product website quickly",
      "Visual design quality is a core requirement",
      "Landing pages and campaigns are central",
      "The site is not primarily a large editorial CMS or complex store",
    ],
    capabilities: [
      "Framer marketing and product website design",
      "Responsive layouts and visual systems",
      "Campaign and landing pages",
      "Conversion-oriented page structure",
      "SEO foundations and metadata",
      "Practical motion where it supports clarity",
      "Redesigns for existing Framer sites",
      "Performance-conscious page builds",
    ],
    challenges: [
      "The brand needs a sharper digital first impression",
      "Landing pages feel generic or weak",
      "Design quality matters but conversion is unclear",
      "Teams are choosing between Framer and Webflow",
      "SEO foundations need to be planned into a visual build",
    ],
    seoSection: {
      title: "Framer Sites Still Need Search-Aware Structure",
      intro:
        "Visual polish does not replace metadata, content hierarchy, performance and crawl-friendly page structure. Framer projects should plan SEO foundations deliberately.",
      points: [
        "Page structure and URL clarity",
        "Metadata and headings",
        "Content hierarchy for product and marketing pages",
        "Rendering and performance considerations",
        "Internal linking across campaign pages",
        "Redirect planning when URLs change",
      ],
    },
    conversionNote:
      "Framer conversion work focuses on clear offers, CTA hierarchy and landing-page journeys — so a modern visual experience still produces enquiries, trials or bookings.",
    migrationNote:
      "Framer is not automatically the right destination for every redesign. We compare it with Webflow, WordPress and other options based on content needs, SEO risk and long-term editing.",
    relatedServiceHrefs: [
      "/services/website-design",
      "/services/ui-ux-design",
      "/services/landing-page-design",
      "/services/website-strategy",
      "/services/conversion-rate-optimization",
    ],
    relatedSeoHrefs: ["on-page-seo"],
    faqs: [
      {
        question: "Is Framer right for a business website?",
        answer:
          "It can be, especially for marketing and product sites. Larger editorial or complex commerce requirements may fit another platform better.",
      },
      {
        question: "Can Framer rank on Google?",
        answer:
          "Yes, when structure, content, metadata and performance are handled properly. No platform ranks by default.",
      },
      {
        question: "Framer or Webflow?",
        answer:
          "Both can support polished marketing sites. The better choice depends on content model, editing needs, team workflow and project scope.",
      },
      {
        question: "Do you use Framer for every project?",
        answer:
          "No. Framer is one option for visually led marketing experiences — not a universal recommendation.",
      },
      {
        question: "Can you redesign an existing Framer site?",
        answer:
          "Yes. We can improve design, structure, conversion paths and SEO foundations on an existing Framer website.",
      },
    ],
    ctaTitle: "Planning a Framer Marketing Website?",
    ctaDescription:
      "Tell us about the product or campaign. We will help assess whether Framer fits — or whether Webflow, WordPress or another platform is more practical.",
    metaTitle: "Framer Website Design & Development",
    metaDescription:
      "Framer website design and development for modern marketing sites, product pages, campaigns and conversion-focused experiences.",
  },
  {
    slug: "hubspot-cms",
    name: "HubSpot CMS",
    title: "HubSpot CMS Website Design & Development",
    href: "/platforms/hubspot-cms",
    summary:
      "Websites and landing pages for teams that want content, forms and marketing operations more closely connected.",
    description:
      "HubSpot CMS can suit businesses already using HubSpot — or those that want website experiences connected to lead capture and marketing workflows. Smartlance can design and improve HubSpot CMS websites, landing pages and conversion journeys with SEO and measurement foundations in mind. We do not claim HubSpot Partner status.",
    tagline:
      "Website and landing-page experiences aligned with lead capture, CRM journeys and marketing operations.",
    icon: "megaphone",
    group: "websites",
    prominence: "medium",
    navigationFeatured: false,
    verifiedExperience: false,
    platformMatch: "HubSpot CMS",
    audiences: [
      "Teams already using HubSpot",
      "B2B and service businesses focused on lead generation",
      "Marketing teams that need connected landing pages and forms",
      "Companies redesigning a HubSpot-hosted website",
    ],
    whenItFits: [
      "Website and marketing operations need to work together",
      "Lead capture and CRM handoff matter",
      "Landing pages and forms are central to growth",
      "Content management sits inside a broader HubSpot workflow",
    ],
    capabilities: [
      "HubSpot CMS website design and development",
      "Landing pages and lead-capture forms",
      "CRM-connected journey planning",
      "Content management structure",
      "Conversion tracking foundations",
      "SEO foundations for HubSpot pages",
      "Website redesign on HubSpot CMS",
      "Alignment with digital marketing workflows",
    ],
    challenges: [
      "The website and CRM feel disconnected",
      "Landing pages and forms are inconsistent",
      "Lead quality is hard to evaluate",
      "Marketing pages lack clear conversion structure",
      "An existing HubSpot site needs redesign without losing tracking",
    ],
    seoSection: {
      title: "HubSpot CMS SEO Needs Content Architecture and Technical Care",
      intro:
        "HubSpot CMS websites still need clear topical structure, metadata, performance and measurement. Marketing automation does not replace search foundations.",
      points: [
        "Content architecture for service and resource pages",
        "Landing-page SEO patterns",
        "Metadata and heading hierarchy",
        "Technical foundations and performance",
        "Internal linking across marketing content",
        "Measurement connected to search and conversion",
      ],
    },
    conversionNote:
      "HubSpot conversion work focuses on form strategy, landing-page clarity, CTA hierarchy and trustworthy tracking — so marketing traffic turns into qualified enquiries.",
    migrationNote:
      "Some teams redesign within HubSpot CMS. Others connect HubSpot marketing tools to a different website platform. We recommend based on CRM usage, content needs and operational reality.",
    relatedServiceHrefs: [
      "/services/website-development",
      "/services/landing-page-design",
      "/services/analytics-conversion-tracking",
      "/services/digital-marketing",
      "/seo",
    ],
    relatedSeoHrefs: ["on-page-seo"],
    faqs: [
      {
        question: "Do I need HubSpot CRM to use HubSpot CMS?",
        answer:
          "HubSpot CMS is typically strongest when it sits inside a HubSpot marketing and CRM workflow. Exact requirements depend on your HubSpot setup and goals.",
      },
      {
        question: "Can forms connect directly to the CRM?",
        answer:
          "Yes — connecting forms and lead capture into HubSpot workflows is a common reason teams choose HubSpot CMS.",
      },
      {
        question: "Can you redesign an existing HubSpot website?",
        answer:
          "Yes. Redesigns can improve structure, design, conversion paths and SEO foundations while protecting important tracking where possible.",
      },
      {
        question: "Do you claim HubSpot Partner status?",
        answer:
          "No. We do not claim HubSpot Partner certification on this site.",
      },
      {
        question: "Is HubSpot CMS right if we only need a brochure site?",
        answer:
          "Not always. If you do not need HubSpot’s marketing and CRM connections, WordPress, Webflow or another platform may be simpler.",
      },
    ],
    ctaTitle: "Need Your Website and Marketing System to Work Together?",
    ctaDescription:
      "Tell us how HubSpot fits your process today. We will recommend website, landing-page and tracking improvements that support lead generation.",
    metaTitle: "HubSpot CMS Website Design & Development",
    metaDescription:
      "HubSpot CMS website design and development for connected landing pages, lead capture, SEO foundations and marketing-aligned conversion.",
  },
];
