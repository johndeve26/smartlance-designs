import type { TemplateContent } from "@/data/resource-content-types";

export const websiteProjectBriefTemplate: TemplateContent = {
  type: "template",
  slug: "website-project-brief-template",
  title: "Website Project Brief Template",
  subtitle:
    "Plan the goals, audience, pages, content, functionality and requirements before the website project begins.",
  description:
    "Define your website project before proposals, hiring or detailed planning — capture goals, audience, content, pages, functionality and scope in one brief.",
  intro:
    "Answers stay in your browser. Nothing is uploaded or stored by Smartlance unless you choose to share the brief yourself.",
  published: true,
  featured: true,
  publishedAt: "2026-08-07",
  topicIds: [
    "website-design",
    "website-development",
    "platforms",
    "seo",
    "conversion",
  ],
  seoTitle: "Website Project Brief Template",
  seoDescription:
    "Use this free website project brief template to define your goals, audience, content, pages, functionality, platform needs, SEO requirements and project scope.",
  relatedServiceHrefs: [
    "/services/website-strategy",
    "/services/website-design",
    "/services/website-development",
    "/services/website-redesign",
  ],
  relatedSolutionSlugs: [
    "new-business-website",
    "outdated-website",
    "website-migration",
  ],
  relatedGuideSlugs: ["website-redesign-guide"],
  relatedComparisonSlugs: ["wordpress-vs-webflow"],
  relatedChecklistSlugs: ["website-redesign-checklist"],
  relatedInsightSlugs: [
    "website-redesign-checklist",
    "what-makes-a-website-convert",
    "technical-seo-foundations",
  ],
  sections: [
    {
      id: "project-overview",
      title: "Project Overview",
      description:
        "Start with the basics so anyone reading this brief understands what the project is.",
      fields: [
        {
          id: "project-name",
          kind: "text",
          label: "Project name",
          placeholder: "e.g. Acme website redesign 2026",
          core: true,
        },
        {
          id: "business-name",
          kind: "text",
          label: "Business name",
          core: true,
        },
        {
          id: "project-type",
          kind: "radio",
          label: "Project type",
          core: true,
          options: [
            { value: "new-website", label: "New website" },
            { value: "redesign", label: "Website redesign" },
            { value: "rebuild", label: "Website rebuild" },
            { value: "migration", label: "Website migration" },
            { value: "ecommerce", label: "E-commerce website" },
            { value: "landing-page", label: "Landing page / campaign" },
            { value: "not-sure", label: "Not sure yet" },
          ],
        },
        {
          id: "project-summary",
          kind: "textarea",
          label: "Project summary",
          placeholder:
            "In a few sentences, what are you planning and why does this website matter now?",
          core: true,
          rows: 4,
        },
        {
          id: "existing-website-url",
          kind: "url",
          label: "Existing website URL",
          placeholder: "https://",
          help: "Optional. Include if you already have a live site.",
        },
      ],
    },
    {
      id: "business-context",
      title: "Business & Website Context",
      description:
        "Give enough context for someone to understand the business behind the website.",
      fields: [
        {
          id: "business-does",
          kind: "textarea",
          label: "What does the business do?",
          core: true,
          rows: 3,
        },
        {
          id: "main-services-products",
          kind: "textarea",
          label: "Main services or products",
          rows: 3,
        },
        {
          id: "business-operate",
          kind: "textarea",
          label: "Where does the business operate?",
          help: "Locations, service areas, or online-only.",
          rows: 2,
        },
        {
          id: "business-stage",
          kind: "radio",
          label: "Business / website stage",
          options: [
            { value: "new-business", label: "New business" },
            {
              value: "first-website",
              label: "Existing business with first website",
            },
            { value: "existing-website", label: "Existing website" },
            {
              value: "established-redesign",
              label: "Established business redesigning",
            },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "competitors",
          kind: "textarea",
          label: "Competitors or alternatives",
          help: "Optional. Names or short notes are enough.",
          rows: 2,
        },
        {
          id: "competitor-urls",
          kind: "textarea",
          label: "Competitor website URLs",
          help: "Optional. One URL per line.",
          rows: 3,
        },
      ],
    },
    {
      id: "goals",
      title: "Goals",
      description:
        "Clarify what the website should achieve — and how you would recognise improvement.",
      fields: [
        {
          id: "website-goals",
          kind: "checkboxGroup",
          label: "Website goals",
          core: true,
          options: [
            { value: "generate-enquiries", label: "Generate enquiries" },
            { value: "take-bookings", label: "Take bookings" },
            { value: "sell-products", label: "Sell products" },
            { value: "build-credibility", label: "Build credibility" },
            { value: "explain-services", label: "Explain services" },
            { value: "show-work", label: "Show work / portfolio" },
            { value: "improve-search", label: "Improve search visibility" },
            { value: "support-campaigns", label: "Support campaigns" },
            { value: "reach-local", label: "Reach local customers" },
            {
              value: "provide-info",
              label: "Provide information/resources",
            },
            { value: "recruit", label: "Recruit" },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "primary-goal",
          kind: "textarea",
          label: "Primary goal",
          help: "The single most important outcome for this project.",
          core: true,
          rows: 2,
        },
        {
          id: "success-definition",
          kind: "textarea",
          label: "How would you know the website is better?",
          help: "Describe what success looks like in your own words — for example clearer enquiries, easier booking, or stronger search visibility. Avoid inventing numeric targets you cannot verify yet.",
          rows: 3,
        },
      ],
    },
    {
      id: "audience",
      title: "Audience",
      description:
        "Describe who the website is for and what they need when they visit.",
      fields: [
        {
          id: "primary-audience",
          kind: "textarea",
          label: "Primary audience",
          core: true,
          rows: 2,
        },
        {
          id: "secondary-audience",
          kind: "textarea",
          label: "Secondary audience",
          rows: 2,
        },
        {
          id: "audience-trying-to-do",
          kind: "textarea",
          label: "What is the audience trying to do?",
          rows: 2,
        },
        {
          id: "audience-questions",
          kind: "textarea",
          label: "Questions the audience needs answered",
          rows: 3,
        },
        {
          id: "audience-concerns",
          kind: "textarea",
          label: "Concerns or objections",
          rows: 2,
        },
        {
          id: "visitor-journey",
          kind: "textarea",
          label: "Typical visitor journey",
          help: "Examples: search → service page → contact; social ad → landing page → book; referral → about → enquire.",
          rows: 3,
        },
      ],
    },
    {
      id: "services-products",
      title: "Services / Products",
      description:
        "List what the website needs to present clearly. E-commerce fields appear only when relevant.",
      fields: [
        {
          id: "services-list",
          kind: "textarea",
          label: "Services or products to include",
          core: true,
          rows: 4,
        },
        {
          id: "services-priority",
          kind: "textarea",
          label: "Priority services or products",
          help: "Which should be most prominent?",
          rows: 2,
        },
        {
          id: "services-new",
          kind: "textarea",
          label: "New services or products to add",
          rows: 2,
        },
        {
          id: "services-removing",
          kind: "textarea",
          label: "Services or products to remove or de-emphasise",
          rows: 2,
        },
        {
          id: "ecommerce-catalogue-size",
          kind: "text",
          label: "Approximate catalogue size",
          help: "Rough product count is enough. Do not include tax, payment or store credentials.",
          showWhenAny: [
            { fieldId: "project-type", values: ["ecommerce"] },
            { fieldId: "website-goals", values: ["sell-products"] },
          ],
        },
        {
          id: "ecommerce-variants",
          kind: "textarea",
          label: "Variants (size, colour, packages, etc.)",
          showWhenAny: [
            { fieldId: "project-type", values: ["ecommerce"] },
            { fieldId: "website-goals", values: ["sell-products"] },
          ],
          rows: 2,
        },
        {
          id: "ecommerce-inventory",
          kind: "textarea",
          label: "Inventory / stock needs",
          showWhenAny: [
            { fieldId: "project-type", values: ["ecommerce"] },
            { fieldId: "website-goals", values: ["sell-products"] },
          ],
          rows: 2,
        },
        {
          id: "ecommerce-shipping",
          kind: "textarea",
          label: "Shipping or fulfilment notes",
          showWhenAny: [
            { fieldId: "project-type", values: ["ecommerce"] },
            { fieldId: "website-goals", values: ["sell-products"] },
          ],
          rows: 2,
        },
        {
          id: "ecommerce-payments",
          kind: "textarea",
          label: "Payment methods needed",
          help: "Name the methods or providers you prefer. Never paste API keys or account secrets here.",
          showWhenAny: [
            { fieldId: "project-type", values: ["ecommerce"] },
            { fieldId: "website-goals", values: ["sell-products"] },
          ],
          rows: 2,
        },
        {
          id: "ecommerce-discounts",
          kind: "textarea",
          label: "Discounts, coupons or promotions",
          showWhenAny: [
            { fieldId: "project-type", values: ["ecommerce"] },
            { fieldId: "website-goals", values: ["sell-products"] },
          ],
          rows: 2,
        },
        {
          id: "ecommerce-accounts",
          kind: "radio",
          label: "Customer accounts required?",
          showWhenAny: [
            { fieldId: "project-type", values: ["ecommerce"] },
            { fieldId: "website-goals", values: ["sell-products"] },
          ],
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
        {
          id: "ecommerce-existing-platform",
          kind: "text",
          label: "Existing e-commerce platform (if any)",
          showWhenAny: [
            { fieldId: "project-type", values: ["ecommerce"] },
            { fieldId: "website-goals", values: ["sell-products"] },
          ],
        },
      ],
    },
    {
      id: "website-structure",
      title: "Website Structure",
      description:
        "These page ideas are prompts, not a mandatory sitemap. Tick what you expect to need and note anything else.",
      fields: [
        {
          id: "needed-pages",
          kind: "checkboxGroup",
          label: "Pages you expect to need",
          options: [
            { value: "home", label: "Home" },
            { value: "about", label: "About" },
            { value: "services", label: "Services" },
            {
              value: "individual-service-pages",
              label: "Individual service pages",
            },
            { value: "products-shop", label: "Products / Shop" },
            { value: "portfolio-work", label: "Portfolio / Work" },
            { value: "industries", label: "Industries" },
            { value: "locations", label: "Locations" },
            { value: "resources-blog", label: "Resources / Blog" },
            { value: "faq", label: "FAQ" },
            { value: "contact", label: "Contact" },
            { value: "pricing", label: "Pricing" },
            { value: "booking", label: "Booking" },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "other-pages",
          kind: "textarea",
          label: "Other pages",
          rows: 2,
        },
        {
          id: "main-nav-ideas",
          kind: "textarea",
          label: "Main navigation ideas",
          rows: 2,
        },
        {
          id: "footer-pages",
          kind: "textarea",
          label: "Footer pages or links",
          rows: 2,
        },
      ],
    },
    {
      id: "content-assets",
      title: "Content & Assets",
      description:
        "Note what you already have and what still needs work. Use real, verified customer/project material only for case studies and testimonials.",
      fields: [
        {
          id: "existing-assets",
          kind: "checkboxGroup",
          label: "Existing assets",
          options: [
            { value: "website-copy", label: "Website copy" },
            { value: "logo", label: "Logo" },
            { value: "brand-guidelines", label: "Brand guidelines" },
            { value: "photos", label: "Photos" },
            { value: "videos", label: "Videos" },
            { value: "case-studies", label: "Case studies" },
            { value: "testimonials", label: "Testimonials" },
            { value: "product-information", label: "Product information" },
            { value: "service-information", label: "Service information" },
            { value: "team-information", label: "Team information" },
            { value: "blog-articles", label: "Blog/articles" },
            {
              value: "downloads-documents",
              label: "Downloads/documents",
            },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "content-status",
          kind: "radio",
          label: "Overall content readiness",
          options: [
            { value: "ready", label: "Ready" },
            { value: "partially-ready", label: "Partially ready" },
            { value: "needs-work", label: "Needs work" },
            { value: "does-not-exist", label: "Does not exist yet" },
          ],
        },
        {
          id: "copy-source",
          kind: "radio",
          label: "Website copy source",
          options: [
            { value: "we-will-provide", label: "We will provide it" },
            { value: "need-editing", label: "We need editing/help" },
            { value: "need-copywriting", label: "We need copywriting" },
            { value: "not-sure", label: "Not sure" },
          ],
          helpLinks: [
            {
              label: "SEO copywriting",
              href: "/services/seo-copywriting",
            },
          ],
        },
      ],
    },
    {
      id: "brand-design",
      title: "Brand & Design Direction",
      description:
        "Describe the look and feel you want. Presets are not required — plain language is enough.",
      fields: [
        {
          id: "visual-identity",
          kind: "radio",
          label: "Do you have an established visual identity?",
          core: true,
          options: [
            { value: "established", label: "Yes — established" },
            { value: "partial", label: "Partial" },
            { value: "no", label: "No" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
        {
          id: "brand-colors",
          kind: "text",
          label: "Brand colours",
          placeholder: "e.g. navy, warm cream, or hex codes if known",
        },
        {
          id: "brand-typography",
          kind: "text",
          label: "Brand typography",
          placeholder: "Font names if known",
        },
        {
          id: "design-direction",
          kind: "textarea",
          label: "Design direction",
          help: "Free text is fine. Example words you might use: calm, bold, editorial, minimal, practical, premium — only if they fit.",
          rows: 3,
        },
        {
          id: "liked-websites",
          kind: "textarea",
          label: "Websites you like",
          help: "URLs or names.",
          rows: 2,
        },
        {
          id: "liked-about",
          kind: "textarea",
          label: "What you like about them",
          help: "Navigation, layout, tone, imagery, clarity, etc.",
          rows: 2,
        },
        {
          id: "avoid-websites",
          kind: "textarea",
          label: "Websites or styles to avoid",
          rows: 2,
        },
        {
          id: "avoid-why",
          kind: "textarea",
          label: "Why avoid them?",
          rows: 2,
        },
      ],
    },
    {
      id: "functionality",
      title: "Functionality & Integrations",
      description:
        "List the actions visitors should take and any tools the site may need to connect with.",
      fields: [
        {
          id: "visitor-actions",
          kind: "checkboxGroup",
          label: "Actions visitors should be able to take",
          core: true,
          options: [
            { value: "contact", label: "Contact" },
            { value: "request-quote", label: "Request quote" },
            { value: "book-appointment", label: "Book appointment" },
            { value: "check-availability", label: "Check availability" },
            { value: "purchase", label: "Purchase" },
            { value: "create-account", label: "Create account" },
            { value: "sign-up", label: "Sign up" },
            { value: "download-resources", label: "Download resources" },
            { value: "search", label: "Search" },
            {
              value: "filter-products-content",
              label: "Filter products/content",
            },
            { value: "map-directions", label: "Use map/directions" },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "integrations",
          kind: "checkboxGroup",
          label: "Integrations needed",
          options: [
            { value: "crm", label: "CRM" },
            { value: "booking-system", label: "Booking system" },
            { value: "email-marketing", label: "Email marketing" },
            { value: "analytics", label: "Analytics" },
            { value: "payments", label: "Payments" },
            { value: "inventory", label: "Inventory" },
            { value: "calendar", label: "Calendar" },
            { value: "live-chat", label: "Live chat" },
            { value: "reviews", label: "Reviews" },
            {
              value: "marketing-automation",
              label: "Marketing automation",
            },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "existing-tools",
          kind: "textarea",
          label: "Existing tools or systems",
          help: "Name the tools only. Do not include passwords, API keys or tokens.",
          rows: 3,
        },
      ],
    },
    {
      id: "seo-search",
      title: "SEO & Search",
      description:
        "Capture search priorities without sharing login details for analytics or SEO tools.",
      fields: [
        {
          id: "organic-search-important",
          kind: "radio",
          label: "Is organic search important for this project?",
          core: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
        {
          id: "seo-topics",
          kind: "textarea",
          label: "Topics or services to be findable in search",
          showWhenAny: [
            {
              fieldId: "organic-search-important",
              values: ["yes", "not-sure"],
            },
          ],
          rows: 3,
        },
        {
          id: "seo-locations",
          kind: "textarea",
          label: "Locations that matter for search",
          showWhenAny: [
            {
              fieldId: "organic-search-important",
              values: ["yes", "not-sure"],
            },
          ],
          rows: 2,
        },
        {
          id: "seo-concerns",
          kind: "textarea",
          label: "SEO concerns or known issues",
          showWhenAny: [
            {
              fieldId: "organic-search-important",
              values: ["yes", "not-sure"],
            },
          ],
          rows: 2,
        },
        {
          id: "urls-to-preserve",
          kind: "textarea",
          label: "Important URLs to preserve",
          help: "Especially pages that already perform in search.",
          showWhenAny: [
            {
              fieldId: "organic-search-important",
              values: ["yes", "not-sure"],
            },
          ],
          rows: 3,
        },
        {
          id: "seo-tools",
          kind: "checkboxGroup",
          label: "SEO / analytics tools in use",
          help: "Select what you use. Never paste login details here.",
          options: [
            {
              value: "google-search-console",
              label: "Google Search Console",
            },
            { value: "google-analytics", label: "Google Analytics" },
            { value: "seo-platform", label: "SEO platform/tools" },
            { value: "none", label: "None / not sure" },
          ],
        },
        {
          id: "preserve-urls",
          kind: "radio",
          label: "Should existing performing URLs be preserved where possible?",
          help: "For redesigns, rebuilds and migrations, review which URLs currently perform before changing structure.",
          helpLinks: [
            {
              label: "Website migration solution",
              href: "/solutions/website-migration",
            },
            {
              label: "Website redesign guide",
              href: "/guides/website-redesign-guide",
            },
          ],
          showWhenAny: [
            {
              fieldId: "project-type",
              values: ["redesign", "rebuild", "migration"],
            },
          ],
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
      ],
    },
    {
      id: "conversion-measurement",
      title: "Conversion & Measurement",
      description:
        "Define what should be measured after launch — for example form submissions or bookings. Related terms: CTA and conversion rate.",
      fields: [
        {
          id: "measure-actions",
          kind: "checkboxGroup",
          label: "Actions to measure",
          core: true,
          helpLinks: [
            { label: "CTA", href: "/glossary/cta" },
            {
              label: "Conversion rate",
              href: "/glossary/conversion-rate",
            },
          ],
          options: [
            { value: "form-submission", label: "Form submission" },
            { value: "quote-request", label: "Quote request" },
            { value: "booking", label: "Booking" },
            { value: "purchase", label: "Purchase" },
            { value: "phone-click", label: "Phone click" },
            { value: "email-click", label: "Email click" },
            { value: "download", label: "Download" },
            {
              value: "account-registration",
              label: "Account registration",
            },
            { value: "other", label: "Other" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
        {
          id: "analytics-need",
          kind: "radio",
          label: "Analytics setup needed?",
          options: [
            { value: "yes", label: "Yes" },
            {
              value: "keep-existing",
              label: "Existing setup should stay",
            },
            { value: "no", label: "No" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
      ],
    },
    {
      id: "platform-technical",
      title: "Platform & Technical Requirements",
      description:
        "Platform choice should follow requirements — not the other way around.",
      fields: [
        {
          id: "current-platform",
          kind: "select",
          label: "Current platform",
          options: [
            { value: "wordpress", label: "WordPress" },
            { value: "shopify", label: "Shopify" },
            { value: "woocommerce", label: "WooCommerce" },
            { value: "webflow", label: "Webflow" },
            { value: "wix", label: "Wix / Wix Studio" },
            { value: "squarespace", label: "Squarespace" },
            { value: "framer", label: "Framer" },
            { value: "bigcommerce", label: "BigCommerce" },
            { value: "hubspot", label: "HubSpot" },
            { value: "other", label: "Other" },
            { value: "no-existing", label: "No existing website" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
        {
          id: "target-platform",
          kind: "select",
          label: "Target platform",
          help: "Choose a preference if you have one, or leave it open. Platform should follow requirements.",
          helpLinks: [
            { label: "Platforms", href: "/platforms" },
            {
              label: "WordPress vs Webflow",
              href: "/compare/wordpress-vs-webflow",
            },
          ],
          options: [
            { value: "wordpress", label: "WordPress" },
            { value: "shopify", label: "Shopify" },
            { value: "woocommerce", label: "WooCommerce" },
            { value: "webflow", label: "Webflow" },
            { value: "wix", label: "Wix / Wix Studio" },
            { value: "squarespace", label: "Squarespace" },
            { value: "framer", label: "Framer" },
            { value: "bigcommerce", label: "BigCommerce" },
            { value: "hubspot", label: "HubSpot" },
            { value: "other", label: "Other" },
            {
              value: "open-to-recommendation",
              label: "Open to recommendation",
            },
            { value: "not-sure", label: "Not sure" },
          ],
        },
        {
          id: "site-editors",
          kind: "radio",
          label: "Who will edit the website?",
          options: [
            { value: "business-owner", label: "Business owner" },
            {
              value: "marketing-team",
              label: "Internal marketing team",
            },
            {
              value: "technical-team",
              label: "Internal technical team",
            },
            { value: "agency-freelancer", label: "Agency/freelancer" },
            { value: "multiple-people", label: "Multiple people" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
        {
          id: "editor-needs",
          kind: "textarea",
          label: "Editor needs",
          help: "What should be easy to update without a developer?",
          rows: 2,
        },
        {
          id: "technical-requirements",
          kind: "textarea",
          label: "Technical requirements",
          help: "Hosting, security, accessibility, performance, or anything else. “Not sure” is fine.",
          rows: 3,
        },
      ],
    },
    {
      id: "constraints",
      title: "Project Constraints",
      description:
        "Capture timing, budget comfort and what matters most if trade-offs appear.",
      fields: [
        {
          id: "desired-launch",
          kind: "text",
          label: "Desired launch timing",
          placeholder: "e.g. Q4 2026, before peak season, flexible",
        },
        {
          id: "launch-reason",
          kind: "textarea",
          label: "Why that timing?",
          help: "Optional. A fixed date reason if you have one.",
          rows: 2,
        },
        {
          id: "budget-range",
          kind: "radio",
          label: "Budget discussion preference",
          options: [
            { value: "not-decided", label: "Not decided yet" },
            { value: "need-guidance", label: "Need guidance" },
            { value: "prefer-discuss", label: "Prefer to discuss" },
            {
              value: "prefer-share-range",
              label: "Prefer to share a range",
            },
          ],
        },
        {
          id: "budget-notes",
          kind: "textarea",
          label: "Budget notes",
          help: "Optional. Share a range only if you want to. Do not treat this as a quote.",
          rows: 2,
        },
        {
          id: "scope-priority",
          kind: "radio",
          label: "If trade-offs are needed, what matters most?",
          options: [
            { value: "launch-date", label: "Launch date" },
            { value: "budget", label: "Budget" },
            { value: "full-scope", label: "Full scope" },
            { value: "not-sure", label: "Not sure" },
          ],
        },
      ],
    },
    {
      id: "final-notes",
      title: "Final Notes",
      description:
        "Anything else that would help someone plan or quote the work. Describe reference files in text only — there is no upload here.",
      fields: [
        {
          id: "anything-else",
          kind: "textarea",
          label: "Anything else to include?",
          rows: 3,
        },
        {
          id: "main-concern",
          kind: "textarea",
          label: "Main concern about the project",
          rows: 2,
        },
        {
          id: "questions-before-start",
          kind: "textarea",
          label: "Questions before starting",
          rows: 2,
        },
        {
          id: "reference-files-note",
          kind: "textarea",
          label: "Reference files you have",
          help: "List file names or types only (brand PDF, sitemap, analytics export). No uploads in this template.",
          rows: 2,
        },
      ],
    },
  ],
};
