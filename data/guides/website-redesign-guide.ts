import type { GuideContent } from "@/data/resource-content-types";

export const websiteRedesignGuide: GuideContent = {
  type: "guide",
  slug: "website-redesign-guide",
  title: "The Complete Website Redesign Guide",
  description:
    "A practical guide to redesigning a website without overlooking strategy, content, SEO, performance, conversion, migration and launch planning.",
  deck: "A website redesign affects far more than visual style. This guide covers the decisions that should happen before, during and after the rebuild — from content and structure to SEO, performance and launch.",
  intro:
    "A website redesign is not just a visual project. It can change content, URLs, SEO foundations, navigation, conversion paths, performance, analytics, forms, integrations, CMS workflows, brand expression and mobile experience. Treating redesign as a skin refresh often creates new problems — broken journeys, lost search visibility, harder editing, or a site that looks newer but works worse. This guide walks through the decisions that should happen before, during and after a rebuild so you preserve what works and improve what does not.",
  published: true,
  featured: true,
  publishedAt: "2026-08-07",
  readingTime: "28 min read",
  topicIds: [
    "website-design",
    "website-development",
    "seo",
    "conversion",
    "website-performance",
    "platforms",
  ],
  seoTitle: "Website Redesign Guide: Planning, SEO & Launch",
  seoDescription:
    "A practical guide to redesigning a website without overlooking strategy, content, SEO, performance, conversion, migration and launch planning.",
  relatedServiceHrefs: [
    "/services/website-redesign",
    "/services/website-strategy",
    "/services/website-migration",
    "/services/website-audit",
  ],
  relatedSolutionSlugs: ["outdated-website", "website-migration"],
  relatedInsightSlugs: [
    "website-redesign-checklist",
    "what-makes-a-website-convert",
    "technical-seo-foundations",
  ],
  tableOfContents: [
    { id: "before-you-redesign", title: "Before You Redesign, Understand Why" },
    { id: "audit-current-website", title: "Audit Before You Delete" },
    {
      id: "refresh-vs-redesign-vs-rebuild",
      title: "Refresh vs Redesign vs Rebuild",
    },
    {
      id: "define-website-goals",
      title: "What Should the New Website Actually Do Better?",
    },
    {
      id: "understand-the-audience",
      title: "Design Around Customer Questions, Not Internal Departments",
    },
    {
      id: "site-structure",
      title: "Plan the Site Structure Before Designing Pages",
    },
    {
      id: "review-existing-content",
      title: "Decide What to Keep, Improve, Merge or Remove",
    },
    {
      id: "plan-new-content",
      title: "Do Not Put Old Copy Into New Boxes Without Reviewing It",
    },
    {
      id: "design-user-experience",
      title: "Design the Experience, Not Only the Look",
    },
    {
      id: "seo-during-redesign",
      title: "Plan SEO Before the New Website Is Built",
    },
    {
      id: "platform-choice",
      title: "Redesigning Doesn't Automatically Mean Changing Platforms",
    },
    {
      id: "performance-accessibility",
      title: "Do Not Build a Beautiful Website That Becomes Slower",
    },
    {
      id: "plan-conversion",
      title: "What Should Visitors Be Able to Do More Easily?",
    },
    {
      id: "build-and-validate",
      title: "Build With Consistency, Editing and Testing in Mind",
    },
    { id: "pre-launch", title: "Prepare for Launch" },
    {
      id: "after-launch",
      title: "The Redesign Is Not Finished the Moment the Site Goes Live",
    },
    { id: "common-mistakes", title: "Common Redesign Mistakes" },
    { id: "redesign-checklist", title: "Redesign Checklist Summary" },
    {
      id: "scope-of-change",
      title: "Not Every Redesign Needs to Change Everything",
    },
    {
      id: "when-to-get-help",
      title: "When Professional Help Makes Sense",
    },
    { id: "planning-a-redesign", title: "Planning a Redesign?" },
    {
      id: "conclusion",
      title: "A Disciplined Redesign Preserves Value",
    },
  ],
  sections: [
    {
      id: "before-you-redesign",
      title: "Before You Redesign, Understand Why",
      body: `A redesign should answer a clear problem. Age alone is not a reason. Many sites look dated and still convert well; others look polished and frustrate visitors every day.

Common reasons a redesign becomes worthwhile:

- The business has changed — offers, markets or positioning no longer match the site
- Services or products have expanded, narrowed or been renamed
- The brand has moved on and the site still speaks an older identity
- Visitors struggle to find what they need
- Performance is poor enough to hurt use
- Mobile experience is awkward or incomplete
- Conversion paths are weak or confusing
- Content structure no longer fits how people buy or enquire
- The platform limits design, editing, commerce or integrations
- Search visibility problems are tied to structure, content or technical foundations

Write down the reasons in plain language. If the list is vague — “it feels old,” “competitors look nicer” — dig further. A redesign that starts from taste alone often ends with a nicer homepage and the same underlying friction.

> Tip: Separate symptoms from causes. Slow pages, unclear services and weak enquiries may share one root problem — or three different ones. Your priorities change once you know which.

Useful goals are business outcomes, not style preferences. Prefer statements such as:

- Make services easier to understand
- Increase qualified enquiries
- Improve product discovery
- Support direct bookings
- Strengthen organic-search foundations
- Make the site easier for the team to maintain
- Improve the mobile experience

Avoid goals like “make it modern.” Modern is not measurable, and it rarely guides structure, content or conversion decisions.`,
    },
    {
      id: "audit-current-website",
      title: "Audit Before You Delete",
      body: `Before you redesign, inventory what already exists. Deleting without understanding is how useful pages, working journeys and search value disappear.

### What to review

**Pages and structure.** List key templates and landing pages. Note which pages exist only because they always have, and which ones still earn their place.

**Traffic and useful landing pages.** Where available, note pages that attract visits or enquiries. Popular does not always mean valuable — but it is a signal not to remove casually.

**Search visibility.** Identify pages that appear for meaningful queries, and any known indexing or crawl issues. Link this later to [technical SEO](/seo/technical-seo) and broader [SEO](/seo) work.

**Backlinks.** Where data exists, note pages that attract external links. Those URLs deserve careful handling if destinations change.

**Content.** Flag outdated claims, duplicated topics, thin pages and strong pages worth keeping.

**Forms and CTAs.** What actions exist today? Which ones work? Which feel buried or unclear?

**Performance and mobile.** Note where the site feels slow, awkward or broken on smaller screens. Deeper diagnosis can sit alongside a [slow website](/solutions/slow-website) review.

**Analytics.** Confirm tracking is present and that you understand which events matter. Do not collect personal data you do not need.

**Integrations.** CRM, email, booking, payments, chat, reviews and automation all need an audit — not an assumption that they will “just move.”

**[CMS](/glossary/cms) and media.** How content is edited, how images are stored, and what reusable blocks already exist will affect redesign and migration effort.

**Redirects and legal content.** Existing redirects, privacy and terms pages, and other required content should be accounted for before cutover.

### What should not change without a reason

A redesign is not a licence to reset everything. Protect what already works unless there is a clear reason to change it:

- Valuable URLs
- Search-performing content
- Useful navigation concepts visitors already understand
- Strong copy
- Familiar customer journeys
- Working integrations
- High-performing landing pages

> Important: Change things because they limit the business — not because redesign creates an opportunity to rearrange them.`,
    },
    {
      id: "refresh-vs-redesign-vs-rebuild",
      title: "Refresh vs Redesign vs Rebuild",
      visual: "refresh-redesign-rebuild",
      body: `Not every site problem needs the same depth of change. Naming the scope early prevents overbuilding — or underbuilding.

**Refresh.** Targeted visual and content improvements. Templates, imagery, messaging and polish improve without a full restructure of information architecture or platform.

**Redesign.** Broader change to presentation and user experience. Navigation, page patterns, content hierarchy and conversion journeys are reconsidered, usually on a clearer plan than a surface refresh.

**Rebuild.** The underlying technical or platform foundation changes substantially as well — often alongside design and content work. This is closer to migration territory when the current stack cannot support what the business needs.

These are planning labels, not rigid products. A project can refresh some areas and redesign others. What matters is matching effort to the real constraints.

If you are still diagnosing whether the current site has become a liability, read [Is Your Website Outdated?](/solutions/outdated-website) for a deeper decision frame. This guide assumes redesign is already under serious consideration and focuses on how to plan and run it well.`,
    },
    {
      id: "define-website-goals",
      title: "What Should the New Website Actually Do Better?",
      body: `Goals decide priorities. Without them, design debates become taste contests.

Ask what the new site should do better than the current one. Typical answers include:

- Clarify services or products
- Build trust faster
- Generate enquiries
- Take bookings
- Sell
- Support organic search
- Support marketing campaigns
- Show work or proof
- Reduce customer confusion
- Support internal editing and publishing

Goals influence everything downstream: which pages matter most, what content must improve first, how navigation is organised, which templates deserve the most design attention, and what “done” means at launch.

Write goals in language the business can recognise. “Improve conversion” is weaker than “make it clearer how to request a quote from a service page.” Specific goals also make post-launch review more honest.

> Tip: Rank goals. A site that tries to sell, educate, book and showcase everything equally often does none of them well.`,
    },
    {
      id: "understand-the-audience",
      title: "Design Around Customer Questions, Not Internal Departments",
      body: `Businesses often structure websites around internal organisation — teams, departments, product lines as the company sees them. Visitors arrive with questions:

- Do you do what I need?
- Is this for people like me?
- How does it work?
- What does it cost, or how do I get pricing?
- Can I trust you?
- What happens next?

When navigation mirrors the org chart instead of those questions, people bounce between pages that make sense to staff and little sense to customers.

Map primary audiences and the jobs they are trying to do. A first-time visitor comparing options needs different clarity than a returning customer looking for support. A local service buyer may need reassurance and contact options sooner than a long-form research buyer.

Use audience thinking to pressure-test:

- Top-level navigation labels
- Homepage priority
- Service and product page order
- Proof placement
- Form length and CTA wording

You do not need personas with invented biographies. You need enough clarity that page structure answers real questions in a sensible order.`,
    },
    {
      id: "site-structure",
      title: "Plan the Site Structure Before Designing Pages",
      visual: "sitemap",
      wideVisual: true,
      body: `Structure before screens. Designing beautiful pages on a weak information architecture usually means rebuilding those pages later.

Plan:

- Primary navigation
- Service or product hierarchy
- Industry or use-case pages where they earn their place
- Location pages only where they are real and useful
- Resources, insights or support content
- Work, case studies or proof
- Contact and conversion destinations
- URL patterns
- Internal linking between related pages

A conceptual sitemap might look like:

- Home
- Services → Service A, Service B
- Work
- About
- Resources
- Contact

That is illustrative only. The right structure depends on what you sell and how people choose. E-commerce needs categories and filters. Multi-service businesses need clear service hierarchy. Content-led brands need a resource structure that supports both readers and search.

URL decisions belong here, not at the end. Do not change URLs only because a new structure looks cleaner. Change them when the new architecture needs clearer, durable paths — and map old destinations carefully when you do. See [website migration](/solutions/website-migration) when moves are substantial.

Internal links should reinforce hierarchy: important pages should be reachable, related pages should connect, and orphan pages should be rare on purpose rather than by accident.`,
    },
    {
      id: "review-existing-content",
      title: "Decide What to Keep, Improve, Merge or Remove",
      visual: "content-decision",
      body: `Redesign does not mean every old page should move into the new site. Content should earn its place.

Work through each important page or content group with a simple decision:

- **Keep** — still accurate, useful and aligned with goals
- **Improve** — worth keeping, but needs clearer structure, proof or updating
- **Merge** — overlapping pages that should become one stronger page
- **Remove** — outdated, thin, duplicated or no longer relevant
- **Redirect** — removed or merged URLs that still need a sensible destination

Evaluate against:

- Accuracy
- Usefulness to visitors
- Search value where it exists
- Business relevance
- Duplication
- Quality

Moving everything “just in case” creates clutter. Removing everything “for a clean start” can discard hard-won clarity and visibility. The disciplined middle is an inventory with decisions.

When content moves between platforms or URL patterns change at scale, treat it as migration work — not only design work. [Planning a website migration](/solutions/website-migration) covers the operational side of that move.`,
    },
    {
      id: "plan-new-content",
      title: "Do Not Put Old Copy Into New Boxes Without Reviewing It",
      body: `A new layout does not fix weak messaging. If you pour old copy into new components without review, you get a prettier version of the same confusion.

Use redesign as a chance to improve:

- Value proposition
- Service and product explanations
- Headings and page titles
- Proof and trust signals
- CTAs
- FAQs
- Alignment with search intent where pages need organic visibility
- Tone and clarity

That does not mean rewriting every sentence. Keep what already works. Improve what is vague, outdated, overly internal or disconnected from what visitors need to decide.

Content planning should happen alongside structure. Page templates need real content priorities — not placeholder paragraphs that never get replaced. If a page exists mainly to support search or campaigns, say so early so design and SEO are not fighting each other later.

Browse related thinking on conversion and redesign planning in the [Insights](/blog) library when you want shorter companion reads.`,
    },
    {
      id: "design-user-experience",
      title: "Design the Experience, Not Only the Look",
      body: `Visual design matters. Experience matters more. A redesign should make it easier to understand, navigate and act — not only easier to admire.

### Design direction

Brand, hierarchy, typography, spacing, imagery, responsive behaviour, components and interaction should support communication and usability. Avoid chasing trends for their own sake. Consistency across templates usually helps visitors more than one spectacular homepage and weaker interior pages.

### UX priorities

Consider:

- Navigation clarity
- Page hierarchy and information order
- Mobile experience
- Forms and error handling
- Search or filtering where the site needs it
- Booking or checkout flows where relevant
- Accessibility basics
- CTA priority and placement

### Wireframes when useful

Wireframes help when pages are complex, structure is new, journeys are multiple, screens are conversion-critical, or content is heavy. They are less necessary for tiny sites with simple templates. Use them where they reduce expensive redesign later — not as ceremony.

### Mobile should be designed, not just stacked

Mobile is not desktop columns collapsed into a pile. Design for:

- Navigation that remains usable
- Content priority on a smaller screen
- Adequate tap areas
- Forms that do not punish thumbs
- Tables and filters that remain workable
- Sticky elements that help rather than cover content
- Image loading that does not stall the page
- CTAs that remain visible at the right moments

If performance or mobile friction is already a known problem, connect redesign priorities to a [slow website](/solutions/slow-website) diagnosis rather than hoping new visuals fix speed.`,
    },
    {
      id: "seo-during-redesign",
      title: "Plan SEO Before the New Website Is Built",
      visual: "seo-risks",
      body: `SEO belongs in the plan before build, not as a launch-week patch. A redesign can protect existing search foundations or accidentally damage them. It does not automatically improve rankings.

### Plan with the current site in view

Review:

- Existing rankings and useful landing pages
- URL decisions
- Redirects for changed or removed URLs
- Site architecture and page topics
- Titles and headings
- Internal links
- Content quality and intent match
- Crawlability
- [Canonical URLs](/glossary/canonical-url)
- [Structured data](/glossary/structured-data) where it is appropriate and accurate
- [XML sitemap](/glossary/xml-sitemap)
- Robots rules

For foundations, see [SEO](/seo) and [technical SEO](/seo/technical-seo). If visibility is already weak for reasons beyond design, a redesign alone will not fix [website not ranking](/solutions/website-not-ranking) problems.

### URL decisions

Do not change URLs simply because a new structure looks tidier. Change them when there is a meaningful reason — clearer hierarchy, removed duplication, corrected paths, or platform constraints.

When URLs change:

- Map each important old URL to the most relevant new destination
- Prefer page-to-page redirects over dumping everything to the homepage
- Keep a redirect map as a project artefact, not a last-minute spreadsheet

A [301 redirect](/glossary/301-redirect) tells browsers and search engines that a resource has permanently moved. Keep the concept at that level here; server and platform configuration belong in implementation, not in this guide.

### Common SEO migration risks

Watch for:

- Missing redirects
- Removed valuable pages without replacements
- Accidental noindex
- Incorrect canonical tags
- Broken internal links
- Missing titles or metadata
- Robots changes that block crawl
- Sitemap mistakes or stale sitemaps after launch

> Important: SEO should be reviewed before URLs are changed. Redirect maps and content decisions are cheaper early than after launch.

No careful process can promise that rankings will be perfectly preserved. The goal is to avoid preventable loss and give the new site coherent technical and content foundations.`,
    },
    {
      id: "platform-choice",
      title: "Redesigning Doesn't Automatically Mean Changing Platforms",
      body: `A redesign can stay on the current platform if the platform is not the problem. Changing systems because “we are redesigning anyway” adds migration risk without guaranteed benefit.

Evaluate whether the current platform supports what you need for:

- Design flexibility
- Content modelling and editing
- Commerce, if relevant
- Integrations
- Performance
- SEO fundamentals
- Ongoing maintenance

If yes, redesigning in place is often the lower-risk path. If no — because of structural limits, editing friction, commerce constraints or integration gaps — migration may belong in scope. See [website migration](/solutions/website-migration) when the foundation itself needs to change.

Platforms such as WordPress, Shopify, WooCommerce, BigCommerce, Webflow, Wix Studio, Squarespace, Framer and HubSpot CMS can all be valid directions depending on content, commerce, marketing and editing needs. The right choice is the one that fits the business constraints — not the one that appears most often in design inspiration galleries.

Explore options on [Platforms](/platforms). Detailed platform comparisons may be published separately later; do not invent comparison routes that do not exist yet.`,
    },
    {
      id: "performance-accessibility",
      title: "Do Not Build a Beautiful Website That Becomes Slower",
      body: `Performance is part of the redesign, not an afterthought. A site that looks refined and loads poorly still fails visitors.

### Performance planning

Pay attention to:

- Image weight and formats
- Font loading
- JavaScript weight
- Third-party scripts
- Animation cost
- Video embeds
- Apps, plugins and tags
- Hosting and caching realities
- Loading strategy for above-the-fold content

[Core Web Vitals](/glossary/core-web-vitals) give a useful shorthand:

- **[LCP](/glossary/lcp)** — how quickly the main content appears
- **[INP](/glossary/inp)** — how responsive the page feels to interaction
- **[CLS](/glossary/cls)** — how much the layout shifts unexpectedly

They are not the whole story, but they help keep performance concrete. For deeper diagnosis, see [slow website](/solutions/slow-website) and [website performance optimization](/services/website-performance-optimization).

### Accessibility

Plan accessibility into the redesign rather than treating it as a post-launch patch. Practical basics include:

- Colour contrast that remains readable
- Keyboard operability
- Clear form labels
- Visible focus states
- Semantic headings
- Alternative text for meaningful images
- Responsive behaviour that does not trap content
- Motion that respects reduced-motion preferences

Accessibility work improves usability for many people. This guide does not claim legal compliance outcomes; requirements vary by context, and compliance needs its own review when it applies.

> Tip: Performance and accessibility often improve together when templates stay simple, media is intentional and interactions are purposeful.`,
    },
    {
      id: "plan-conversion",
      title: "What Should Visitors Be Able to Do More Easily?",
      body: `Redesign should make primary actions easier. Identify those actions before layouts are finalised.

Depending on the site, visitors may need to:

- Enquire
- Book
- Buy
- Register
- Download
- Call
- Visit
- Compare options

### CTA hierarchy

Give pages a clear primary action and supporting secondary actions. Avoid:

- Several buttons competing with equal weight
- Vague labels that hide the next step
- Actions disconnected from the page’s purpose

You do not need exactly one CTA everywhere. You do need hierarchy. A service page, a blog article and a checkout flow should not all shout the same way.

### Forms

Keep forms aligned with the decision being asked:

- Required versus optional fields
- Field count
- Mobile usability
- Validation and error states
- Confirmation of success
- Privacy context without unnecessary personal data

Long forms can be justified for complex requests. They are rarely justified by habit.

### Define measurement before launch

Decide what you will measure:

- Form submissions
- Bookings or purchases
- Important CTA clicks
- Phone or email actions where tracked appropriately
- Key page progressions
- Search Console coverage and indexing signals
- Analytics for the journeys that matter

Do not collect personal data you do not need. Set up measurement intentionally with [analytics and conversion tracking](/services/analytics-conversion-tracking) rather than discovering after launch that nothing useful was recorded.

### Integrations

Audit CRM, email marketing, booking, payments, chat, analytics, forms, reviews and automation during redesign. Do not assume integrations can be copied unchanged between platforms or templates. Each connection needs an owner, a test plan and a fallback if cutover fails.`,
    },
    {
      id: "build-and-validate",
      title: "Build With Consistency, Editing and Testing in Mind",
      body: `Build quality is not only “does it match the mockup?” It is whether the site stays consistent, editable and reliable under real use.

### Build-stage considerations

- Responsive implementation across real devices
- Component consistency
- CMS editing that matches how the team works
- Performance budgets and media discipline
- Semantic markup
- Browser and device testing
- Integration behaviour
- Error handling for forms and key flows

### A simple design system — not enterprise theatre

Reusable components help with consistent experience, easier maintenance, faster future pages and less visual drift. For most sites, that means a clear set of buttons, type styles, sections and content patterns — not a heavy enterprise design-system programme. Match the system to the scale of the site.

### Two users: visitors and the team

The website has visitors and the people who manage it. Redesign should consider:

- Editing and publishing workflows
- Image handling
- Content fields that match real content
- Permissions where relevant
- Reusable templates for common page types

Avoid locking ordinary updates behind development when the business needs to manage content itself. A beautiful site that only developers can update becomes outdated quickly for a different reason.

Validate as you build. Waiting until the week of launch to test forms, mobile navigation and CMS fields is how preventable issues become launch emergencies.`,
    },
    {
      id: "pre-launch",
      title: "Prepare for Launch",
      visual: "launch-phases",
      body: `Launch is a sequence, not a switch. Prepare deliberately.

### Pre-launch checks

Review:

- Navigation and key journeys
- Internal and external links
- Forms and confirmations
- Responsive behaviour
- Images and media
- Performance on critical templates
- Metadata and titles
- URL map and redirects
- Canonical tags
- Sitemap and robots
- Custom 404 behaviour
- Analytics and conversion events
- Search Console readiness
- Integrations
- Accessibility basics
- Social sharing previews where relevant
- Legal and policy content

### Launch sequence (high level)

1. Freeze content where appropriate so last-minute edits do not race cutover
2. Keep a backup or clear reference to the current site
3. Deploy the new site to the intended environment
4. Complete DNS or platform cutover if required
5. Verify redirects for important old URLs
6. Test critical pages and journeys
7. Confirm forms and notifications
8. Confirm analytics and key events
9. Submit or update the sitemap

> Tip: Audit the existing site before deciding what to remove — and re-check the redirect map before cutover, not after the first 404 reports arrive.

Keep operational detail in the hands of whoever manages hosting and DNS. This guide stays at planning level on purpose.`,
    },
    {
      id: "after-launch",
      title: "The Redesign Is Not Finished the Moment the Site Goes Live",
      body: `Going live is a milestone, not the end of the project. The days and weeks after launch reveal what planning missed.

Monitor:

- 404s and redirect gaps
- Form delivery and spam behaviour
- Analytics integrity
- Search visibility and indexing
- Performance on real templates
- User feedback
- Conversion actions against the goals you set
- Bugs and content errors

There is no universal monitoring window that fits every site. What matters is having owners, a shortlist of critical checks, and a willingness to fix issues quickly while the redesign is still fresh.

Compare outcomes to the goals you defined earlier. If the goal was clearer service pages and easier enquiries, judge the launch on those terms — not only on whether the homepage looks new.

Continue improving. A redesign creates a better baseline. It does not remove the need for content updates, SEO attention, performance care or conversion refinement over time.`,
    },
    {
      id: "common-mistakes",
      title: "Common Redesign Mistakes",
      body: `These patterns show up often. Avoiding them saves more time than adding another round of visual polish.

1. **Starting with visuals before goals** — taste debates replace priorities.
2. **Deleting useful content without review** — clean does not mean empty.
3. **Changing every URL** — migration work created for cosmetic reasons.
4. **Ignoring SEO until launch** — preventable visibility damage.
5. **Copying competitor designs** — their structure may not match your offer or audience.
6. **Overloading pages with animation** — motion that slows or distracts is not refinement.
7. **Treating mobile as an afterthought** — stacked desktop layouts are not a mobile experience.
8. **Changing platform without a clear reason** — extra risk without extra benefit.
9. **Launching without analytics** — no way to know what improved.
10. **Failing to test forms and integrations** — silent failure after a public launch.

> Important: Avoid redirecting every old page to the homepage. Irrelevant redirects frustrate people and weaken the value of careful URL mapping.`,
    },
    {
      id: "redesign-checklist",
      title: "Redesign Checklist Summary",
      body: `Use this as a compact project checklist. It is not a substitute for the decisions in the sections above.

### Before

- Write clear reasons for redesigning
- Define business goals in plain language
- Audit pages, content, SEO signals, forms, integrations and CMS
- Identify what must be preserved
- Choose refresh, redesign or rebuild scope
- Draft site structure and URL approach

### During

- Decide keep / improve / merge / remove / redirect for content
- Review copy before placing it in new layouts
- Design UX and mobile deliberately
- Plan SEO, redirects and performance early
- Confirm platform fit or migration need
- Define conversion actions and measurement
- Build for consistency and editable templates

### Before launch

- QA navigation, links, forms, responsive layouts and media
- Verify metadata, redirects, canonicals, sitemap and robots
- Confirm analytics, Search Console and integrations
- Check accessibility basics and legal pages
- Freeze content and prepare rollback reference

### After launch

- Watch 404s, forms, analytics and indexing
- Fix critical bugs quickly
- Review performance and conversion against goals
- Continue content and SEO improvement

For shorter companion reading, see related Insights such as the [website redesign checklist](/blog/website-redesign-checklist), [what makes a website convert](/blog/what-makes-a-website-convert) and [technical SEO foundations](/blog/technical-seo-foundations).`,
    },
    {
      id: "scope-of-change",
      title: "Not Every Redesign Needs to Change Everything",
      body: `Scope should match need. Projects can be:

- A visual refresh of key templates
- Selected template and content improvements
- Navigation and content restructuring
- A full redesign of experience and presentation
- A platform rebuild with migration

Trying to treat every project as a total rebuild wastes budget. Treating a deep structural problem as a colour refresh wastes the opportunity. Name the scope, protect what works, and spend effort where the site is actually limiting the business.

This principle also reduces risk. Smaller, well-aimed change is often easier to test, launch and learn from than a simultaneous rewrite of brand, IA, CMS, SEO and platform.`,
    },
    {
      id: "when-to-get-help",
      title: "When Professional Help Makes Sense",
      body: `Some redesigns are manageable in-house. Others carry enough complexity that experienced help reduces risk.

Professional support is especially useful when:

- The site is large or content-heavy
- Organic traffic matters and URLs or structure will change
- Integrations are complex
- E-commerce flows are involved
- Platform migration is in scope
- Content needs major restructuring
- The internal team lacks time or specialist experience
- Launch risk is high because the site is business-critical

Help can mean strategy and planning, design and build, SEO and migration, performance work, or a focused [website audit](/services/website-audit) before decisions lock in. The point is not to outsource thinking — it is to avoid expensive mistakes in areas where mistakes are hard to reverse.`,
    },
    {
      id: "planning-a-redesign",
      title: "Planning a Redesign?",
      body: `Smartlance Designs helps businesses plan and deliver website redesigns with strategy, design, development, SEO, migration, performance and conversion in view — not as disconnected workstreams.

If you are scoping a project, these starting points are useful:

- [Website Redesign](/services/website-redesign)
- [Website Strategy](/services/website-strategy)
- [Website Migration](/services/website-migration)
- [Website Audit](/services/website-audit)

Bring what is changing, what must be preserved, and what the new site should do better. Clear inputs produce clearer scope.`,
    },
    {
      id: "conclusion",
      title: "A Disciplined Redesign Preserves Value",
      body: `A successful redesign preserves what is valuable, fixes what limits the site, and plans strategy, content, UX, SEO and technical change together. Visual improvement is part of that work — not a substitute for it.

Start from reasons and goals. Audit before you delete. Choose the right depth of change. Structure before screens. Review content with intent. Protect search foundations when URLs move. Keep performance and accessibility in the build. Make conversion actions clearer. Launch carefully, then keep watching.

That discipline is what separates a redesign that merely looks newer from one that works better.`,
    },
  ],
};
