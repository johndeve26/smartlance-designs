import type { GlossaryContent } from "@/data/resource-content-types";

export const glossaryEntries: GlossaryContent[] = [
  {
    type: "glossary",
    slug: "seo",
    term: "SEO",
    acronym: "SEO",
    expansion: "Search Engine Optimization",
    aliases: ["search engine optimization"],
    shortDefinition:
      "SEO is the work of helping search engines discover, understand, and surface your website for relevant searches — through useful content, clear structure, and technical accessibility.",
    fullExplanation:
      "What is SEO? Search Engine Optimization is the practice of making a website easier for search engines to find, crawl, understand, and present when someone searches for something your business can help with.\n\nSEO is broader than keyword placement. It typically includes the substance and clarity of your pages, how those pages are structured and linked, technical accessibility (so crawlers can reach and render them), on-page signals like titles and headings that match intent, local visibility when geography matters, and the reputation and usefulness of what you publish over time.\n\nIn practical terms, good SEO helps a search engine answer: What is this page about? Who is it for? Is it trustworthy and useful compared with alternatives? Can it be crawled and indexed without friction?\n\nSEO does not guarantee rankings. Search results shift with competition, algorithms, local factors, and user behavior. The goal is clearer discovery and stronger relevance — not a promised position.",
    whyItMatters:
      "If your site is hard to understand or hard to crawl, the right customers may never see it — even when your offer fits their need. SEO matters because discovery in search often depends on both what you say and how findable and coherent the site is behind the scenes.\n\nFor business owners, that means SEO is not a one-time trick. It supports ongoing visibility when you publish clear pages, keep important URLs stable, fix technical blockers, and align content with real questions people ask. Weak SEO shows up as thin or confusing pages, duplicate or orphaned URLs, and a site that looks finished in the browser but remains opaque to search systems.",
    example:
      "A local service business publishes a clear service page that explains who they help, what they do, where they work, and how to inquire. The page uses a descriptive title, sensible headings, working internal links, and contact details that match the rest of the site. That combination — useful content plus crawlable structure — is SEO in practice, not stuffing the same phrase into every paragraph.",
    commonMisconceptions: [
      "SEO is just keywords. Keywords help describe topics, but rankings and discovery also depend on usefulness, structure, technical access, reputation, and whether the page matches search intent.",
      "SEO guarantees rankings. No ethical process can promise a fixed position. Competition and search systems change; SEO improves your odds of being understood and considered, not a locked slot.",
    ],
    relatedTermSlugs: [
      "canonical-url",
      "xml-sitemap",
      "structured-data",
      "301-redirect",
    ],
    relatedSolutionSlugs: ["website-not-ranking"],
    relatedSeoHrefs: ["/seo"],
    glossaryTopicGroup: "search-technical-seo",
    topicIds: ["seo"],
    featured: true,
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is SEO? Search Engine Optimization Explained",
    seoDescription:
      "SEO helps search engines discover and understand your site through content, structure, and technical accessibility — not keyword stuffing or ranking guarantees.",
  },
  {
    type: "glossary",
    slug: "cms",
    term: "CMS",
    acronym: "CMS",
    expansion: "Content Management System",
    aliases: ["content management system"],
    shortDefinition:
      "A CMS is the system your team uses to create, edit, organize, and publish website content without rebuilding the whole site for every change.",
    fullExplanation:
      "What is a CMS? A Content Management System is software that lets people manage website pages, media, and related content through an editorial interface instead of editing raw code for every update.\n\nA CMS typically separates content from presentation: editors change text, images, and page structure; templates and themes control how that content appears. That split is why businesses choose a CMS — so marketing, operations, or owners can keep the site current without a developer for routine edits.\n\nNot every CMS works the same way. WordPress, Webflow CMS, HubSpot CMS, and Shopify content systems all help publish and manage content, but they differ in how pages are built, how flexible templates are, how roles and workflows work, and how tightly content is tied to design, commerce, or marketing tools. Choosing among [platforms](/platforms) is less about a universal \"best CMS\" and more about who will edit the site, how often, and what else the site must do.",
    whyItMatters:
      "Your CMS shapes day-to-day ownership. If updates require a specialist for every headline change, the site falls behind. If the CMS is a poor fit for your content model — blog posts, service pages, product catalogs, landing pages — teams invent workarounds that create inconsistency and technical debt.\n\nFor business owners, the CMS decision affects cost of change, training, security habits, and how safely you can grow the site. The right system makes publishing predictable; the wrong one makes simple updates feel like projects. When you evaluate options on our [platforms](/platforms) overview, weigh editing reality as heavily as design demos.",
    example:
      "A clinic needs to update hours, add a new provider bio, and publish a seasonal announcement. With a suitable CMS, staff can edit those pages in a familiar admin area, preview, and publish — without requesting a full rebuild. The same clinic might outgrow a rigid setup if it later needs structured directories, multi-location pages, or complex forms that the current content model never supported.",
    commonMisconceptions: [
      "All CMS platforms are interchangeable. Shared goals (edit and publish) do not mean identical models for templates, commerce, hosting, or marketing integrations.",
      "A CMS removes the need for structure. Editors still need clear page types, roles, and publishing standards — or the site becomes inconsistent fast.",
    ],
    relatedSolutionSlugs: ["new-business-website"],
    glossaryTopicGroup: "website-foundations",
    topicIds: ["website-development", "platforms"],
    featured: true,
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is a CMS? Content Management Systems Explained",
    seoDescription:
      "A CMS lets your team publish and update website content without rebuilding the site for every change. Learn how WordPress, Webflow, HubSpot, and Shopify differ in practice.",
  },
  {
    type: "glossary",
    slug: "cta",
    term: "CTA",
    acronym: "CTA",
    expansion: "Call to Action",
    aliases: ["call to action"],
    shortDefinition:
      "A CTA is the clear next step you ask a visitor to take — such as book, call, buy, or inquire — usually expressed as a button, link, or form prompt.",
    fullExplanation:
      "What is a CTA? A Call to Action is the specific action you want someone to take after reading a page or section. It is not merely a styled button; it is a decision you are asking the visitor to make, phrased and placed so the next step is obvious.\n\nStrong CTAs usually state the outcome in plain language (\"Request a quote,\" \"Book a consultation,\" \"Shop the collection\") rather than vague labels like \"Submit\" or \"Learn more\" when a more concrete action is available. Placement matters: a primary CTA near the decision point beats a forest of competing buttons.\n\nHierarchy matters too. A page typically needs one primary CTA that matches the page goal, and optional secondary CTAs for lower-commitment paths (\"See pricing,\" \"Download the guide\"). When every button fights for equal attention, visitors hesitate. Not every clickable element is a good CTA — decorative links, repeated identical buttons, and mismatched asks (hard sell too early, or vague soft asks when the visitor is ready) all dilute conversion.",
    whyItMatters:
      "Visitors who understand your offer still leave when the next step is unclear, buried, or contradictory. CTAs translate interest into measurable action. For business sites, that often means inquiries, bookings, purchases, or qualified leads.\n\nCTA quality also affects how you diagnose conversion problems. Low conversions can come from weak offers, confusing pages, or friction after the click — but they also come from pages that never ask clearly, or ask for too many things at once. Clarifying primary versus secondary actions is often a cheaper fix than a full redesign.",
    example:
      "A service page explains the offer, who it is for, and what happens after contact. The primary CTA says \"Schedule a call\" and sits near the end of the decision content and in the header. A secondary link offers \"View sample work\" for visitors who need proof first. That hierarchy guides different readiness levels without turning the page into a button collage.",
    commonMisconceptions: [
      "Any button is a CTA. A button without a clear, relevant ask — or ten buttons with equal weight — is visual noise, not a call to action.",
      "More CTAs always mean more conversions. Competing primary asks usually split attention and reduce the chance someone completes the one action that matters most.",
    ],
    relatedTermSlugs: ["conversion-rate"],
    relatedSolutionSlugs: ["low-website-conversions"],
    glossaryTopicGroup: "website-foundations",
    topicIds: ["conversion"],
    visual: "cta-hierarchy",
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is a CTA? Call to Action Explained",
    seoDescription:
      "A CTA is the clear next step you ask visitors to take. Learn primary vs secondary hierarchy and why not every button is a good call to action.",
  },
  {
    type: "glossary",
    slug: "conversion-rate",
    term: "Conversion Rate",
    aliases: ["conversion rate"],
    shortDefinition:
      "Conversion rate is the percentage of relevant visits that complete a defined action — such as a purchase, booking, or inquiry.",
    fullExplanation:
      "What is conversion rate? Conversion rate measures how often visitors complete a goal you care about, relative to a relevant audience for that goal.\n\nThe basic formula is:\n\n**Conversions ÷ Relevant Visits × 100**\n\n\"Conversions\" are completed actions you define (form submits that count, paid orders, booked appointments). \"Relevant Visits\" is the denominator — and it must match the question you are asking. Sitewide sessions, landing-page views, and checkout starts answer different questions. Using the wrong denominator makes the percentage look better or worse without reflecting real performance.\n\nConversion rate is a diagnostic signal, not a scoreboard in isolation. A rising rate with collapsing traffic can still mean fewer customers. A falling rate after launching a new campaign can mean you attracted less-qualified visits. Always pair the rate with volume, source quality, and what \"conversion\" means on that page or funnel.",
    whyItMatters:
      "Business owners use conversion rate to see whether the site turns attention into outcomes. It helps prioritize work: if traffic is healthy but few people inquire or buy, the problem often sits in clarity, trust, offer, CTA hierarchy, forms, or checkout — not only in advertising spend.\n\nIt also prevents vanity metrics. Pageviews alone do not pay invoices. Tracking conversion rate by meaningful segments (channel, device, landing page) shows where the experience succeeds or fails, so you invest in the right fixes instead of guessing.",
    example:
      "An ecommerce product page records 40 purchases from 2,000 product-page sessions in a period. Using product-page sessions as the relevant denominator, conversion rate is 40 ÷ 2,000 × 100 = 2%. That number is only meaningful compared with the same definition over time or across similar pages — not against a generic industry slogan about what \"good\" looks like for every business.",
    commonMisconceptions: [
      "There is a universal \"good\" conversion rate. Healthy rates depend on offer, traffic quality, price, and funnel definition. Benchmarks without context mislead more than they help.",
      "Improving conversion rate always means adding more buttons. Often the fix is clearer messaging, fewer competing asks, less form friction, or better match between ad promise and landing page.",
    ],
    relatedTermSlugs: ["cta"],
    relatedServiceHrefs: ["/services/conversion-rate-optimization"],
    relatedSolutionSlugs: ["low-website-conversions"],
    glossaryTopicGroup: "website-foundations",
    topicIds: ["conversion"],
    featured: true,
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is Conversion Rate?",
    seoDescription:
      "Conversion rate is Conversions ÷ Relevant Visits × 100. Learn why the denominator matters and how to use the metric without fake universal benchmarks.",
  },
  {
    type: "glossary",
    slug: "core-web-vitals",
    term: "Core Web Vitals",
    aliases: ["CWV", "core web vitals"],
    shortDefinition:
      "Core Web Vitals are a set of user-experience metrics that focus on loading, interactivity, and visual stability — commonly discussed as LCP, INP, and CLS.",
    fullExplanation:
      "What are Core Web Vitals? Core Web Vitals (CWV) are key field-oriented metrics used to describe parts of real-user experience on the web. They center on three ideas: how quickly main content becomes visible (LCP — Largest Contentful Paint), how quickly the page responds to interactions (INP — Interaction to Next Paint), and how much the layout shifts unexpectedly while people use it (CLS — Cumulative Layout Shift).\n\nTogether, these metrics describe loading perception, responsiveness, and visual stability. They are useful UX signals — not a complete definition of website performance. A site can pass CWV-related checks and still feel slow for other reasons (heavy workflows after load, poor perceived performance on certain devices, backend delays on key actions). Likewise, fixing CWV issues does not automatically fix every speed complaint.\n\nCore Web Vitals are best treated as a focused lens inside a broader performance practice: measure real user conditions where possible, prioritize what users feel, and improve the underlying causes (server response, assets, scripts, layout discipline) rather than chasing a score in isolation.",
    whyItMatters:
      "Slow or unstable pages cost attention. When main content takes too long to appear, buttons feel late, or layouts jump under the cursor, people abandon tasks — inquiries, checkouts, bookings — even if the design looks polished in a static mockup.\n\nFor business owners, CWV language helps turn vague \"the site feels slow\" feedback into concrete workstreams: loading of the main visible content, interaction delay, and unexpected movement. That clarity supports better prioritization with developers and hosts without pretending these three metrics cover every performance concern.",
    example:
      "A homepage hero image loads late, the first tap on \"Book now\" feels delayed on mobile, and a late-loading cookie bar pushes the button downward. Those symptoms map loosely to LCP, INP, and CLS concerns. Addressing image delivery, script work on interaction, and reserved space for late UI improves the experience — while other issues (slow form API, oversized PDF downloads) may still need separate attention.",
    commonMisconceptions: [
      "Core Web Vitals equal all of performance. They highlight important UX dimensions but do not replace broader speed, reliability, and workflow measurement.",
      "Lab-only scores tell the whole story. Field experience varies by device, network, and geography; treat synthetic tests as helpful clues, not the only truth.",
    ],
    relatedTermSlugs: ["lcp", "inp", "cls"],
    relatedSolutionSlugs: ["slow-website"],
    glossaryTopicGroup: "performance",
    topicIds: ["website-performance"],
    featured: true,
    visual: "cwv-relationship",
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Are Core Web Vitals?",
    seoDescription:
      "Core Web Vitals cover LCP, INP, and CLS — loading, responsiveness, and visual stability. Useful UX signals, not the full definition of website performance.",
  },
  {
    type: "glossary",
    slug: "lcp",
    term: "LCP",
    acronym: "LCP",
    expansion: "Largest Contentful Paint",
    aliases: ["largest contentful paint"],
    shortDefinition:
      "LCP measures how quickly the main visible content on a page appears for the user — typically a large image, video, or text block in the viewport.",
    fullExplanation:
      "What is LCP? Largest Contentful Paint is a timing metric that approximates when the primary content a visitor sees first has finished painting. In plain English: how long until the main thing on the screen shows up?\n\nThat \"main thing\" is often a hero image, a large heading block, or another dominant element in the initial viewport. LCP is about perceived loading of what matters visually first — not necessarily when every asset on the page has finished downloading.\n\nMany factors influence LCP: how quickly the server responds, how large and how the hero or other LCP candidates are delivered, font loading that delays text paint, and render-blocking CSS or scripts that postpone first meaningful paint. Improving LCP usually means finding what the LCP element is, then removing delays in the path that delivers and paints it.",
    whyItMatters:
      "People decide quickly whether a page feels ready. If the main content stays blank or incomplete, they bounce — especially on mobile networks. For marketing and ecommerce pages, a late hero or headline can make a fast backend still feel broken.\n\nLCP gives teams a shared name for that \"when does the important stuff show up?\" question. It guides practical work on hosting response, image strategy, critical CSS, and font behavior without turning performance into abstract jargon.",
    example:
      "A landing page uses a full-width photo as the visual center of the first screen. If that image is oversized, served from a slow origin, or blocked behind heavy scripts, LCP stretches even when smaller text above the fold appeared earlier. Compressing and properly sizing the hero, prioritizing its request, and reducing blocking resources often improves how soon the page feels usable.",
    commonMisconceptions: [
      "LCP is the same as total page load. A page can finish downloading many assets after LCP; the metric focuses on when the main visible content appears.",
      "Only images affect LCP. Text blocks and other large elements can be the LCP candidate depending on the layout.",
    ],
    relatedTermSlugs: ["core-web-vitals", "inp", "cls"],
    relatedSolutionSlugs: ["slow-website"],
    glossaryTopicGroup: "performance",
    topicIds: ["website-performance"],
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is LCP? Largest Contentful Paint Explained",
    seoDescription:
      "LCP measures how quickly main visible content appears. Learn what influences it — server response, heroes, fonts, and render-blocking resources — in plain English.",
  },
  {
    type: "glossary",
    slug: "inp",
    term: "INP",
    acronym: "INP",
    expansion: "Interaction to Next Paint",
    aliases: ["interaction to next paint"],
    shortDefinition:
      "INP measures how quickly a page responds visually after a user interaction — such as a tap, click, or key press — reflecting responsiveness during use.",
    fullExplanation:
      "What is INP? Interaction to Next Paint looks at how long it takes for the page to provide the next visual update after someone interacts with it. In plain English: when you tap or click, how soon does the interface react in a way you can see?\n\nINP is about responsiveness while using the page — not how long the initial load took. A site can look fully loaded and still feel sluggish if click handlers, heavy JavaScript, or main-thread work delay the visual response to menus, filters, accordions, or \"Add to cart\" controls.\n\nBecause people interact multiple times on a visit, INP reflects interaction delay across the experience rather than a single first-click story. Improving INP often means reducing long tasks on the main thread, deferring non-critical script work, and keeping interactive controls lightweight.",
    whyItMatters:
      "Frustration is not only about waiting for a blank screen. It is also about tapping a button and wondering if anything happened. Slow interactions erode trust and increase abandoned forms, menus, and checkouts.\n\nFor business owners, INP separates \"page opened\" from \"page feels usable.\" That distinction matters when a redesign looks polished in screenshots but feels sticky on real phones — a common pattern when third-party scripts and complex widgets pile up after launch.",
    example:
      "A filter sidebar on a catalog page looks ready. Each filter tap waits noticeably before the UI updates because a large script does expensive work on every click. Visitors may abandon filtering even though the initial LCP looked acceptable. Trimming or deferring that work improves INP without changing the visual design.",
    commonMisconceptions: [
      "If the page loads quickly, interactions must be fine. Initial load and interaction responsiveness are related but different problems.",
      "INP only matters on homepage load. It concerns interactions throughout the visit — forms, menus, carts, and other controls included.",
    ],
    relatedTermSlugs: ["core-web-vitals", "lcp", "cls"],
    relatedSolutionSlugs: ["slow-website"],
    glossaryTopicGroup: "performance",
    topicIds: ["website-performance"],
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is INP? Interaction to Next Paint Explained",
    seoDescription:
      "INP measures how quickly a page responds after taps and clicks. A page can look loaded and still feel slow — learn why interaction delay differs from initial load.",
  },
  {
    type: "glossary",
    slug: "cls",
    term: "CLS",
    acronym: "CLS",
    expansion: "Cumulative Layout Shift",
    aliases: ["cumulative layout shift"],
    shortDefinition:
      "CLS measures unexpected layout movement — when content shifts on the page without a matching user action, making interfaces feel unstable.",
    fullExplanation:
      "What is CLS? Cumulative Layout Shift quantifies how much visible content moves unexpectedly while a page is being viewed. In plain English: did something jump under your finger or eye after you started reading or about to click?\n\nUnexpected shifts often come from images or embeds without reserved space, late-injected banners, web fonts that reflow text, or ads and widgets that push content after paint. Those jumps cause mis-taps and make the page feel unfinished.\n\nNot every movement is automatically bad. Layout changes that clearly follow a user action — expanding an accordion you opened, opening a mobile menu you tapped — are expected responses. CLS focuses on unstable, surprising movement rather than every animation or intentional expand/collapse pattern.",
    whyItMatters:
      "Layout shift is a trust and usability issue. People click the wrong thing, lose their place while reading, or blame their own device when the page is at fault. On commerce and lead-gen pages, a shifting CTA near a late-loading promo is a classic conversion killer.\n\nNaming CLS helps teams prioritize reserved dimensions, font strategies, and careful injection of late UI — practical fixes that make the site feel solid without arguing about aesthetics alone.",
    example:
      "A product page loads the price and \"Buy\" button, then a promotional banner inserts above them a second later and shoves the button downward. The visitor taps where \"Buy\" was and hits something else — or hesitates. Reserving space for the banner (or loading it without displacing critical controls) reduces that unexpected shift.",
    commonMisconceptions: [
      "Any animation means bad CLS. Smooth, intentional motion is not the same as unexpected reflow from late content.",
      "CLS only comes from ads. Images without size attributes, font swaps, and injected notices cause shifts on many business sites with no ads at all.",
    ],
    relatedTermSlugs: ["core-web-vitals", "lcp", "inp"],
    relatedSolutionSlugs: ["slow-website"],
    glossaryTopicGroup: "performance",
    topicIds: ["website-performance"],
    visual: "cls-shift",
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is CLS? Cumulative Layout Shift Explained",
    seoDescription:
      "CLS measures unexpected layout movement that makes pages feel unstable. Intentional user-triggered changes are not automatically the same problem.",
  },
  {
    type: "glossary",
    slug: "canonical-url",
    term: "Canonical URL",
    aliases: ["canonical tag", "rel canonical", "canonical"],
    shortDefinition:
      "A canonical URL is the preferred address you signal for a page when similar or duplicate URLs could otherwise compete or confuse indexing.",
    fullExplanation:
      "What is a canonical URL? A canonical URL is the version of a page you mark as preferred when the same or very similar content can be reached through more than one address. Search systems treat the canonical signal as a strong hint about which URL should represent that content in search.\n\nCanonicalization is not a redirect. Visitors can still open non-canonical URLs; the canonical tag (often `rel=\"canonical\"`) tells crawlers which URL you prefer for consolidation. Redirects actually send browsers and bots to another location. Teams sometimes confuse the two: use redirects when a URL should permanently move; use canonicals when multiple valid URLs exist but one should be preferred for indexing signals.\n\nCommon cases include tracking parameters, printer-friendly variants, overlapping category paths, or CMS-generated duplicates. A clear canonical strategy reduces diluted signals and mixed indexing — but it does not magically repair every duplicate or indexing problem on its own.",
    whyItMatters:
      "Duplicate or near-duplicate URLs waste crawl attention and can split relevance signals across addresses. For business sites, that shows up as the \"wrong\" URL ranking, thin-looking duplicates in search, or confusion after campaigns append parameters to links.\n\nDuring redesigns and migrations, canonical decisions sit beside redirects and sitemaps. Getting the preferred URL right helps preserve clarity about which pages are authoritative. Treating canonicals as a cure-all, though, leaves crawl errors, soft-404s, and conflicting directives unsolved.",
    example:
      "A product is available at `/products/blue-mug` and also at `/collections/mugs/blue-mug` with the same content. The site sets the canonical to `/products/blue-mug` so search systems have a preferred target. Visitors may still browse via the collection path, but indexing preference points at one URL — unlike a 301, which would force every request to move.",
    commonMisconceptions: [
      "Canonical tags redirect users. They do not. Users can still land on non-canonical URLs; the tag is primarily a preference signal for search systems.",
      "Canonicals fix all duplicate and indexing problems. They help with preference and consolidation but do not replace fixing crawl errors, conflicting noindex rules, or poor content quality.",
    ],
    relatedTermSlugs: ["301-redirect", "xml-sitemap", "seo"],
    relatedSolutionSlugs: ["website-migration"],
    relatedSeoHrefs: ["/seo/technical-seo"],
    glossaryTopicGroup: "search-technical-seo",
    topicIds: ["seo"],
    visual: "canonical-vs-redirect",
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is a Canonical URL?",
    seoDescription:
      "A canonical URL signals the preferred version of a page. It is a hint for search systems — not a redirect — and it does not fix every duplicate-indexing issue alone.",
  },
  {
    type: "glossary",
    slug: "301-redirect",
    term: "301 Redirect",
    aliases: ["permanent redirect", "301"],
    shortDefinition:
      "A 301 redirect is a permanent move from one URL to another, telling browsers and search engines that the content now lives at the new address.",
    fullExplanation:
      "What is a 301 redirect? A 301 is the standard way to say a URL has permanently moved. When someone or a crawler requests the old address, they are sent to the new one, and search systems generally treat the move as lasting rather than temporary.\n\nGood redirects send people to a relevant destination — the matching new page, not a generic catch-all. Dumping every retired URL onto the homepage preserves little usefulness and frustrates visitors who expected a specific article, product, or service page.\n\nRedirect chains also matter. If URL A redirects to B and B redirects to C, every hop adds delay and risk of breakage. Prefer a direct A → C mapping when C is the final home. Clean redirect maps are especially important during redesigns and migrations when many paths change at once.",
    whyItMatters:
      "URLs change when sites restructure, rebrand, or move platforms. Without permanent redirects, bookmarks, backlinks, and search listings hit errors or outdated pages — and hard-won visibility leaks away.\n\nFor business owners, redirects are operational SEO hygiene, not a niche developer detail. They protect customer paths and marketing links. Planning them beside content mapping — instead of as a last-minute launch chore — avoids panicked homepage dumps and forgotten dead ends.",
    example:
      "An old blog post at `/blog/summer-tips-2022` moves to `/guides/summer-tips`. A 301 from the old path to the new guide keeps shared links working and signals a permanent relocation. Sending that same old URL to the homepage would \"work\" technically but would miss the visitor's intent and weaken the value of the original link.",
    commonMisconceptions: [
      "Any redirect is fine if it avoids a 404. Relevance matters; unrelated destinations train people and search systems that your URL map is unreliable.",
      "Chains are harmless. Extra hops slow experiences and create more points of failure — map old URLs straight to their final destinations when you can.",
    ],
    relatedTermSlugs: ["canonical-url", "xml-sitemap", "seo"],
    relatedSolutionSlugs: ["website-migration"],
    relatedGuideSlugs: ["website-redesign-guide"],
    glossaryTopicGroup: "search-technical-seo",
    topicIds: ["seo"],
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is a 301 Redirect?",
    seoDescription:
      "A 301 redirect permanently moves a URL to a new address. Use relevant destinations, avoid homepage dumps, and prefer direct mappings over redirect chains.",
  },
  {
    type: "glossary",
    slug: "xml-sitemap",
    term: "XML Sitemap",
    aliases: ["sitemap", "xml sitemap"],
    shortDefinition:
      "An XML sitemap is a machine-readable list of URLs you want search engines to know about — a discovery aid, not a ranking guarantee.",
    fullExplanation:
      "What is an XML sitemap? An XML sitemap is a structured file (or set of files) that lists important URLs on your site so crawlers can discover them more efficiently. It complements — it does not replace — clear internal linking and an accessible site architecture.\n\nAn XML sitemap is different from an HTML sitemap or primary navigation. Navigation helps humans move through the site; the XML sitemap speaks to crawlers with a URL inventory. Including a URL does not guarantee indexing or ranking. Search systems still decide what to crawl, index, and show.\n\nHealthy sitemaps prefer canonical, indexable URLs you actually want discovered. Avoid listing redirects, error pages, or noindex URLs when those outcomes are not intentional. Stale sitemaps that advertise retired or blocked pages create noise and make technical audits harder.",
    whyItMatters:
      "Large or frequently updated sites can leave important pages weakly linked. A maintained sitemap helps crawlers find new and updated URLs sooner — useful for catalogs, blogs, and location pages that grow over time.\n\nFor business owners, the sitemap is a practical checklist of \"what we claim matters.\" If the sitemap and the live indexable site disagree, something is wrong in publishing, canonicalization, or cleanup after a redesign. Keeping them aligned supports clearer technical SEO without promising traffic by itself.",
    example:
      "After launching twenty new service-area pages, the team ensures each live, indexable URL appears in the XML sitemap and is linked from relevant hubs. Pages that 301 to replacements are removed from the sitemap so crawlers are guided to current destinations instead of obsolete paths.",
    commonMisconceptions: [
      "Sitemap inclusion guarantees indexing or rankings. It aids discovery; inclusion alone does not force indexation or positions.",
      "XML sitemaps replace navigation. Humans still need clear menus and internal links; crawlers benefit from both architecture and sitemap signals.",
    ],
    relatedTermSlugs: ["seo", "canonical-url", "structured-data"],
    relatedSeoHrefs: ["/seo/technical-seo"],
    glossaryTopicGroup: "search-technical-seo",
    topicIds: ["seo"],
    visual: "sitemap-relationship",
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is an XML Sitemap?",
    seoDescription:
      "An XML sitemap lists URLs for search discovery. It does not guarantee indexing or rankings, and it is not the same as your HTML navigation.",
  },
  {
    type: "glossary",
    slug: "structured-data",
    term: "Structured Data",
    aliases: ["schema markup", "schema", "JSON-LD"],
    shortDefinition:
      "Structured data is machine-readable markup that explains what a page or entity is — such as an organization, article, product, or local business — in a consistent format.",
    fullExplanation:
      "What is structured data? Structured data is extra information embedded on a page so software can understand entities and relationships more clearly. Instead of only reading visible prose, systems can see labeled facts: this is an Organization, this is an Article, these are Breadcrumb links, this is a Product, this describes a Local Business.\n\nOn the web, that markup is often implemented with JSON-LD (JavaScript Object Notation for Linked Data) placed in the page. The idea is descriptive context, not a secret ranking switch. Structured data can support richer presentations in search when eligibility and quality rules are met — but it does not guarantee rich results, and it does not guarantee rankings.\n\nUseful structured data matches what the page actually shows. Marking up offers, reviews, or business details that users cannot see — or that conflict with visible content — undermines trust and can invalidate the markup's purpose.",
    whyItMatters:
      "Clear entity context helps search systems interpret who you are and what a page represents. For businesses, that can support more precise understanding of brand, location, products, and content types — especially when pages are otherwise ambiguous.\n\nIt also encourages editorial discipline: if you claim Product or Local Business details in markup, those details should be accurate and maintainable. Structured data is part of technical SEO hygiene alongside crawlability and canonical clarity — helpful when honest, harmful when decorative or misleading.",
    example:
      "A company about page includes Organization structured data with the official name, URL, and logo that match the visible site identity. A blog post includes Article markup aligned with its headline and publish date. Neither guarantees a special search layout, but both give crawlers clearer machine-readable context than unmarked HTML alone.",
    commonMisconceptions: [
      "Structured data guarantees rich results or higher rankings. Eligibility and rankings depend on many factors; markup is supportive context, not a promise.",
      "Schema is only for large ecommerce sites. Organization, Article, Breadcrumb, and Local Business patterns are relevant to many smaller business sites when they match real page content.",
    ],
    relatedTermSlugs: ["seo", "xml-sitemap"],
    relatedSeoHrefs: ["/seo/technical-seo"],
    glossaryTopicGroup: "search-technical-seo",
    topicIds: ["seo"],
    published: true,
    publishedAt: "2026-08-07",
    seoTitle: "What Is Structured Data? Schema Markup Explained",
    seoDescription:
      "Structured data (often JSON-LD) gives machine-readable context like Organization or Product. It does not guarantee rich results or rankings.",
  },
];
