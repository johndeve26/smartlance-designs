import type { ChecklistContent } from "@/data/resource-content-types";

export const websiteRedesignChecklist: ChecklistContent = {
  type: "checklist",
  slug: "website-redesign-checklist",
  title: "Website Redesign Checklist",
  subtitle: "What to review before, during and after a website redesign.",
  description:
    "Use this practical website redesign checklist to review strategy, content, SEO, UX, development, analytics, redirects and launch readiness.",
  intro:
    "Use this checklist to verify redesign decisions before, during and after build. For the reasoning behind each area, see the Website Redesign Guide.",
  published: true,
  featured: false,
  publishedAt: "2026-08-07",
  topicIds: [
    "website-design",
    "website-development",
    "seo",
    "conversion",
    "website-performance",
  ],
  seoTitle: "Website Redesign Checklist: Before, Build & Launch",
  seoDescription:
    "Use this practical website redesign checklist to review strategy, content, SEO, UX, development, analytics, redirects and launch readiness.",
  relatedServiceHrefs: [
    "/services/website-redesign",
    "/services/website-audit",
    "/services/website-migration",
    "/services/website-strategy",
  ],
  relatedSolutionSlugs: ["outdated-website", "website-migration"],
  relatedGuideSlugs: ["website-redesign-guide"],
  relatedComparisonSlugs: ["wordpress-vs-webflow"],
  relatedInsightSlugs: [
    "website-redesign-checklist",
    "what-makes-a-website-convert",
    "technical-seo-foundations",
  ],
  sections: [
    {
      id: "define-the-redesign",
      title: "Define the Redesign Before Designing It",
      description:
        "Confirm why you are redesigning and what success looks like before visual or technical work begins.",
      callout: {
        tone: "tip",
        body: "If the current site feels dated but you are unsure what to change, start with a clear diagnosis of what is outdated — and what still works.",
        href: "/solutions/outdated-website",
        linkLabel: "Is Your Website Outdated?",
      },
      items: [
        {
          id: "define-primary-reason",
          text: "We have written the primary reason for redesigning in plain language.",
          priority: "critical",
        },
        {
          id: "define-business-goals",
          text: "Business goals for the new site are clear and measurable enough to review later.",
          priority: "critical",
        },
        {
          id: "define-primary-actions",
          text: "Primary visitor actions are defined (enquire, book, buy, contact, or equivalent).",
          priority: "critical",
        },
        {
          id: "define-scope-type",
          text: "We know whether this is primarily a refresh, redesign, rebuild, or migration + redesign.",
          priority: "critical",
        },
        {
          id: "define-audience-priorities",
          text: "Priority audiences and the questions they need answered are named.",
        },
        {
          id: "define-out-of-scope",
          text: "Out-of-scope work is listed so the project does not quietly expand.",
        },
        {
          id: "define-success-signals",
          text: "Success signals are agreed (conversion, clarity, speed, editing ease, or search).",
        },
        {
          id: "define-stakeholders",
          text: "Decision-makers and content owners for approvals are identified.",
        },
        {
          id: "define-constraints",
          text: "Known constraints are recorded (budget, timeline, platform, brand, legal).",
        },
      ],
    },
    {
      id: "audit-current-website",
      title: "Audit the Current Website",
      description:
        "Inventory what exists before you redesign, so useful pages, journeys and integrations are not discarded by accident.",
      items: [
        {
          id: "audit-page-inventory",
          text: "Key pages and templates are inventoried (where data is available).",
        },
        {
          id: "audit-traffic-pages",
          text: "Top landing and organic pages are noted (where analytics data is available).",
        },
        {
          id: "audit-conversion-paths",
          text: "Current conversion paths are reviewed (where data is available).",
        },
        {
          id: "audit-forms-integrations",
          text: "Forms, booking tools, CRM links and other integrations are listed.",
        },
        {
          id: "audit-seo-signals",
          text: "Important SEO signals are captured (titles, URLs, indexed pages where available).",
        },
        {
          id: "audit-technical-debt",
          text: "Known technical issues are listed (speed, broken links, mobile friction, CMS pain).",
        },
      ],
      subgroups: [
        {
          id: "preserve-what-works",
          title: "Preserve What Works",
          items: [
            {
              id: "preserve-useful-content",
              text: "Useful, accurate content that still earns its place is marked to keep.",
            },
            {
              id: "preserve-valuable-urls",
              text: "Valuable URLs are identified for retention or careful redirect planning.",
            },
            {
              id: "preserve-working-journeys",
              text: "Journeys that already convert well are marked to protect or improve, not reinvent.",
            },
            {
              id: "preserve-working-integrations",
              text: "Working integrations are documented so they are not broken in the rebuild.",
            },
            {
              id: "preserve-avoid-novelty",
              text: "We are not changing everything solely for novelty.",
            },
          ],
        },
      ],
    },
    {
      id: "structure-and-content",
      title: "Plan Structure & Content",
      description:
        "Agree information architecture and content decisions before templates and copy are locked into the new design.",
      callout: {
        tone: "tip",
        body: "Use Keep / Improve / Merge / Remove / Redirect for every important page or content group — do not migrate everything by default.",
        href: "/guides/website-redesign-guide",
        linkLabel: "Website Redesign Guide",
      },
      items: [
        {
          id: "structure-sitemap-drafted",
          text: "A draft sitemap covers primary pages and key supporting content.",
        },
        {
          id: "structure-nav-planned",
          text: "Main navigation reflects visitor tasks, not only internal org charts.",
        },
        {
          id: "structure-content-decisions",
          text: "Keep / Improve / Merge / Remove / Redirect decisions exist for important content.",
        },
        {
          id: "structure-url-approach",
          text: "URL approach is agreed (retain, tidy, or change with redirects).",
        },
        {
          id: "structure-content-ownership",
          text: "Content ownership and approval owners are assigned for key pages.",
        },
        {
          id: "structure-cta-placement",
          text: "Primary CTAs are planned for key templates and journeys.",
        },
        {
          id: "structure-multi-language",
          text: "Language or locale structure is planned if the site serves more than one language.",
          appliesWhen: "Multi-language",
          priority: "contextual",
        },
      ],
      subgroups: [
        {
          id: "content-readiness",
          title: "Content Readiness",
          items: [
            {
              id: "content-copy-accurate",
              text: "Copy for launch pages is accurate and matches current offers.",
              priority: "critical",
            },
            {
              id: "content-testimonials-verified",
              text: "Testimonials and case proof are verified and approved for use.",
              priority: "critical",
            },
            {
              id: "content-no-lorem",
              text: "No lorem ipsum or placeholder copy remains on launch pages.",
              priority: "critical",
            },
            {
              id: "content-no-fabricated-metrics",
              text: "No fabricated stats, awards or metrics appear anywhere on the site.",
              priority: "critical",
            },
          ],
        },
      ],
    },
    {
      id: "protect-seo",
      title: "Protect SEO",
      description:
        "Plan URL continuity, metadata and indexing before launch so search visibility is not lost to avoidable technical gaps.",
      callout: {
        tone: "avoid",
        body: "Redirect every old page to the homepage.",
        href: "/solutions/website-migration",
        linkLabel: "Planning a Website Migration",
      },
      items: [
        {
          id: "seo-url-inventory",
          text: "Important current URLs are inventoried before structure or platform changes.",
        },
        {
          id: "seo-redirect-map",
          text: "A redirect map covers changed, merged and removed URLs to relevant destinations.",
          priority: "critical",
        },
        {
          id: "seo-retain-valuable-urls",
          text: "High-value URLs are retained where practical instead of changed for cosmetics.",
        },
        {
          id: "seo-title-tags",
          text: "Unique, accurate title tags are planned for key pages.",
        },
        {
          id: "seo-meta-descriptions",
          text: "Meta descriptions are drafted for priority pages (unique where it matters).",
        },
        {
          id: "seo-h1-structure",
          text: "Each key page has a clear H1 aligned with the page purpose.",
        },
        {
          id: "seo-internal-links",
          text: "Internal links between related important pages are planned.",
        },
        {
          id: "seo-canonicals",
          text: "Canonical rules are defined for key templates and any duplicate risk.",
        },
        {
          id: "seo-robots",
          text: "robots.txt and indexing rules are reviewed for the new environment.",
        },
        {
          id: "seo-noindex-intentional",
          text: "Any noindex use is intentional — staging and accidental blocks are excluded.",
          priority: "critical",
        },
        {
          id: "seo-xml-sitemap",
          text: "An XML sitemap plan includes indexable launch URLs and excludes junk.",
        },
        {
          id: "seo-structured-data",
          text: "Structured data needs are reviewed for relevant page types.",
        },
        {
          id: "seo-broken-links",
          text: "Broken internal links and orphaned important pages are addressed.",
        },
        {
          id: "seo-migration-parity",
          text: "Migration-specific SEO checks cover URL mapping completeness and soft 404 risk.",
          appliesWhen: "Migration",
          priority: "contextual",
        },
      ],
    },
    {
      id: "ux-and-design",
      title: "Plan UX & Design",
      description:
        "Design for clarity and action — hierarchy, navigation and consistency matter more than novelty.",
      items: [
        {
          id: "ux-visual-hierarchy",
          text: "Page hierarchy makes the primary message and action obvious first.",
        },
        {
          id: "ux-cta-clarity",
          text: "Primary CTAs are visually clear and wording matches the intended action.",
        },
        {
          id: "ux-typography-readable",
          text: "Typography is readable at body sizes with comfortable line length.",
        },
        {
          id: "ux-contrast",
          text: "Text and interactive elements meet sensible contrast expectations.",
        },
        {
          id: "ux-forms-friction",
          text: "Forms ask only for necessary fields and show clear error guidance.",
        },
        {
          id: "ux-component-consistency",
          text: "Buttons, spacing and patterns stay consistent across templates.",
        },
        {
          id: "ux-reduced-motion",
          text: "Motion respects reduced-motion preferences and does not block content.",
        },
      ],
      subgroups: [
        {
          id: "mobile",
          title: "Mobile",
          items: [
            {
              id: "mobile-actions-reachable",
              text: "Primary actions are reachable without awkward zoom or hunt.",
            },
            {
              id: "mobile-no-overflow",
              text: "Layouts do not cause horizontal overflow on common phone widths.",
            },
            {
              id: "mobile-forms-usable",
              text: "Forms are usable on mobile with appropriate input types.",
            },
            {
              id: "mobile-sticky-elements",
              text: "Sticky headers, bars or chat widgets do not hide content or CTAs.",
            },
          ],
        },
      ],
    },

    {
      id: "development-integrations",
      title: "Plan Development & Integrations",
      description:
        "Confirm platform, CMS editing and third-party connections before they become launch blockers.",
      items: [
        {
          id: "dev-platform-decision",
          text: "Platform choice is confirmed with a clear reason to stay or migrate.",
        },
        {
          id: "dev-cms-model",
          text: "CMS content model matches how the team will actually edit pages.",
        },
        {
          id: "dev-forms-routing",
          text: "Form submissions route to the correct inbox, CRM or automation.",
        },
        {
          id: "dev-crm-integration",
          text: "CRM sync or lead handoff is configured where required.",
          appliesWhen: "CRM",
          priority: "contextual",
        },
        {
          id: "dev-booking-integration",
          text: "Booking or scheduling flows are tested end to end where required.",
          appliesWhen: "Booking",
          priority: "contextual",
        },
        {
          id: "dev-payments-integration",
          text: "Payment and checkout paths are configured and tested where required.",
          appliesWhen: "E-commerce",
          priority: "contextual",
        },
        {
          id: "dev-third-party-scripts",
          text: "Third-party scripts are listed, justified and loaded intentionally.",
        },
        {
          id: "dev-custom-404",
          text: "A helpful 404 page is ready with paths back to important content.",
        },
        {
          id: "dev-redirects-ready",
          text: "Redirect rules are prepared in the target hosting or platform setup.",
        },
      ],
      subgroups: [
        {
          id: "cms-editing",
          title: "CMS & Editing",
          items: [
            {
              id: "cms-templates-editable",
              text: "Editors can update common content without developer help for routine changes.",
            },
            {
              id: "cms-shared-components",
              text: "Shared components (nav, footer, CTAs) update consistently site-wide.",
            },
          ],
        },
      ],
    },
    {
      id: "performance-accessibility",
      title: "Performance & Accessibility",
      description:
        "Aim for a site that feels fast and usable — without treating scores or compliance badges as the whole goal.",
      callout: {
        tone: "tip",
        body: "If speed is already a known problem, treat performance as a redesign requirement — not a post-launch tidy-up.",
        href: "/solutions/slow-website",
        linkLabel: "Slow Website?",
      },
      items: [],
      subgroups: [
        {
          id: "performance",
          title: "Performance",
          items: [
            {
              id: "perf-image-strategy",
              text: "Images are sized, compressed and delivered in modern formats where practical.",
            },
            {
              id: "perf-font-loading",
              text: "Font loading is controlled so text remains readable quickly.",
            },
            {
              id: "perf-lcp",
              text: "Largest contentful paint candidates (hero media, headings) are optimised for quick visibility.",
            },
            {
              id: "perf-inp",
              text: "Important interactions remain responsive (buttons, nav, forms) under normal use.",
            },
            {
              id: "perf-cls",
              text: "Layout shift from fonts, images and embeds is controlled on key templates.",
            },
          ],
        },
        {
          id: "accessibility",
          title: "Accessibility",
          items: [
            {
              id: "a11y-semantic-structure",
              text: "Pages use sensible landmarks, headings and semantic HTML.",
            },
            {
              id: "a11y-alt-text",
              text: "Meaningful images have useful alt text; decorative images are handled appropriately.",
            },
            {
              id: "a11y-keyboard",
              text: "Primary journeys can be completed with a keyboard.",
            },
            {
              id: "a11y-form-labels",
              text: "Form fields have visible labels and understandable errors.",
            },
          ],
        },
      ],
    },
    {
      id: "analytics-conversion",
      title: "Analytics & Conversion Tracking",
      description:
        "Confirm you can measure the actions that matter — without collecting more personal data than you need.",
      items: [
        {
          id: "analytics-primary-actions",
          text: "Primary conversion actions are defined for measurement.",
          priority: "critical",
        },
        {
          id: "analytics-tags-installed",
          text: "Analytics property and tags are installed on the new environment.",
        },
        {
          id: "analytics-form-tracking",
          text: "Form submissions are tracked where forms are a primary action.",
          appliesWhen: "Forms as primary action",
          priority: "contextual",
        },
        {
          id: "analytics-booking-tracking",
          text: "Booking completions are tracked where booking is a primary action.",
          appliesWhen: "Booking",
          priority: "contextual",
        },
        {
          id: "analytics-purchase-tracking",
          text: "Purchase or checkout events are tracked where commerce is in scope.",
          appliesWhen: "E-commerce",
          priority: "contextual",
        },
        {
          id: "analytics-search-console",
          text: "Google Search Console (or equivalent) access and property setup are ready.",
        },
        {
          id: "analytics-minimal-data",
          text: "Tracking avoids collecting unnecessary personal data in events or URLs.",
        },
        {
          id: "analytics-consent",
          text: "Consent and cookie behaviour match legal requirements for the audience.",
          appliesWhen: "Consent required",
          priority: "contextual",
        },
      ],
    },
    {
      id: "pre-launch-qa",
      title: "Pre-Launch QA",
      description:
        "Test thoroughly before cutover. Useful widths include 1440, 1280, 1024, 768, 430, 390 and 375 — not the only ones that matter. Check current major browsers relevant to your audience.",
      items: [
        {
          id: "qa-no-placeholders",
          text: "No placeholder copy, images or \"coming soon\" blocks remain on launch pages.",
          priority: "critical",
        },
        {
          id: "qa-contact-details",
          text: "Phone, email, address and social links are correct everywhere they appear.",
          priority: "critical",
        },
        {
          id: "qa-browser-coverage",
          text: "Current major browsers relevant to the audience have been spot-checked.",
        },
        {
          id: "qa-responsive-widths",
          text: "Key templates are checked across useful desktop and mobile widths.",
        },
      ],
      subgroups: [
        {
          id: "qa-content",
          title: "Content",
          items: [
            {
              id: "qa-content-typos",
              text: "Spelling, grammar and obvious typos are cleaned on priority pages.",
            },
            {
              id: "qa-content-offers",
              text: "Pricing, packages and offer details match what the business will honour.",
            },
            {
              id: "qa-content-media",
              text: "Images, video and downloads open correctly.",
            },
          ],
        },
        {
          id: "qa-links",
          title: "Links",
          items: [
            {
              id: "qa-nav-links",
              text: "Main nav, footer and utility links resolve to the correct pages.",
            },
            {
              id: "qa-in-page-links",
              text: "In-page CTAs and cross-links on key journeys work.",
            },
          ],
        },
        {
          id: "qa-forms",
          title: "Forms",
          items: [
            {
              id: "qa-contact-form",
              text: "Contact and enquiry forms submit successfully and notify the right people.",
              priority: "critical",
            },
            {
              id: "qa-form-validation",
              text: "Required-field and format validation behave as expected.",
            },
            {
              id: "qa-booking-form",
              text: "Booking forms or widgets complete a real test booking where required.",
              appliesWhen: "Booking",
              priority: "contextual",
            },
            {
              id: "qa-checkout-flow",
              text: "Checkout and payment test paths complete where required.",
              appliesWhen: "E-commerce",
              priority: "contextual",
            },
          ],
        },
        {
          id: "qa-seo",
          title: "SEO",
          items: [
            {
              id: "qa-redirects-sample",
              text: "Sample old URLs redirect correctly per the redirect map.",
              priority: "critical",
            },
            {
              id: "qa-titles-meta",
              text: "Titles, meta descriptions and H1s look correct on key pages.",
            },
            {
              id: "qa-no-staging-urls",
              text: "No staging domains, preview URLs or temporary hosts remain in links or canonicals.",
              priority: "critical",
            },
            {
              id: "qa-noindex-check",
              text: "Production is not accidentally noindexed.",
              priority: "critical",
            },
          ],
        },
        {
          id: "qa-visual",
          title: "Visual",
          items: [
            {
              id: "qa-visual-alignment",
              text: "Spacing, alignment and component consistency look intentional on key pages.",
            },
            {
              id: "qa-visual-overflow",
              text: "No clipped text, overlapping elements or broken grids on checked widths.",
            },
          ],
        },
        {
          id: "qa-technical",
          title: "Technical",
          items: [
            {
              id: "qa-https",
              text: "HTTPS works and mixed-content warnings are cleared on key pages.",
            },
            {
              id: "qa-404-page",
              text: "Custom 404 responds correctly for unknown paths.",
            },
            {
              id: "qa-integrations-live",
              text: "Required third-party integrations still work on the launch candidate.",
            },
            {
              id: "qa-backup-reference",
              text: "A pre-launch backup or reference of the current live site is available.",
            },
          ],
        },
      ],
    },
    {
      id: "launch",
      title: "Launch",
      description:
        "Execute cutover carefully. Confirm redirects, forms, analytics and indexing on the live domain — not only on staging.",
      items: [
        {
          id: "launch-backup-reference",
          text: "Backup or reference of the previous live site is retained for rollback comparison.",
        },
        {
          id: "launch-cutover-plan",
          text: "Cutover steps and owners are agreed (who does what, in what order).",
        },
        {
          id: "launch-domain-dns",
          text: "Domain and DNS changes are planned and verified where required.",
          appliesWhen: "Domain or DNS change",
          priority: "contextual",
        },
        {
          id: "launch-redirects-active",
          text: "Redirects are active on the live domain and sample-checked.",
          priority: "critical",
        },
        {
          id: "launch-forms-retested",
          text: "Forms and critical integrations are retested in production.",
          priority: "critical",
        },
        {
          id: "launch-analytics-live",
          text: "Analytics and conversion events are receiving live traffic.",
        },
        {
          id: "launch-sitemap-submitted",
          text: "XML sitemap is live and submitted where Search Console is used.",
        },
        {
          id: "launch-search-console",
          text: "Search Console property covers the live domain and key checks are started.",
        },
        {
          id: "launch-status-codes",
          text: "Spot-checks confirm expected 200, redirect and 404 status codes.",
        },
        {
          id: "launch-noindex-check",
          text: "Production is not accidentally noindexed after cutover.",
          priority: "critical",
        },
      ],
    },
    {
      id: "post-launch",
      title: "Post-Launch Monitoring",
      description:
        "Watch forms, analytics, errors and feedback after launch. Investigate unexpected changes — do not assume a fixed monitoring window is enough on its own.",
      items: [
        {
          id: "post-forms-watch",
          text: "Form and lead delivery continue to arrive as expected after launch.",
        },
        {
          id: "post-analytics-watch",
          text: "Analytics traffic and conversion events look plausible day to day.",
        },
        {
          id: "post-404-watch",
          text: "404 patterns are reviewed and missing important URLs are fixed or redirected.",
        },
        {
          id: "post-redirect-watch",
          text: "Redirect failures and chains discovered after launch are corrected.",
        },
        {
          id: "post-performance-watch",
          text: "Real-user performance issues on key templates are investigated if reported.",
        },
        {
          id: "post-feedback-bugs",
          text: "Feedback and launch bugs are collected, prioritised and owned to resolution.",
        },
        {
          id: "post-maintenance-owner",
          text: "A maintenance owner is clear for content, hosting and ongoing fixes.",
        },
      ],
      subgroups: [
        {
          id: "post-launch-seo",
          title: "Post-Launch SEO",
          items: [
            {
              id: "post-seo-search-console",
              text: "Search Console coverage, sitemap and enhancement reports are reviewed.",
            },
            {
              id: "post-seo-url-spotcheck",
              text: "Important old and new URLs are spot-checked for indexing and redirects.",
            },
            {
              id: "post-seo-investigate-changes",
              text: "Unexpected ranking or traffic changes are investigated — not assumed to be penalties.",
            },
          ],
        },
      ],
    },
  ],
};
