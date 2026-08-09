import type { Testimonial, FaqItem, TeamMember } from "@/types";

/**
 * STATIC / PRE-IMPORT FALLBACK ONLY for Homepage and legacy surfaces.
 * Production Homepage Testimonials use DB via `loadHomepageTestimonials()`.
 */
export const testimonials: Testimonial[] = [
  {
    id: "gemini-anderson",
    name: "Anderson",
    company: "Gemini Corporate Relocations",
    quote:
      "Smartlance Designs transformed our online presence with their outstanding work on our new website.",
    service: "Website Design",
    source: "Project page",
    sourceUrl:
      "https://www.smartlancedesigns.com/project/gemini-corporate-relocations/",
    projectSlug: "gemini-corporate-relocations",
    published: true,
  },
  {
    id: "katerinas-place-team",
    name: "The Katerinas Place Team",
    company: "Katerina's Place",
    quote:
      "Smartlance Designs did an amazing job with our new website. Their professionalism, creativity, and technical skills brought our vision to life. The real-time collaboration was incredibly effective, and the final website perfectly showcases our unique properties while boosting our online presence. The post-launch support and training were exceptional, allowing us to manage the site confidently. We highly recommend Smartlance Designs for their outstanding work!",
    service: "Website Design",
    source: "Project page",
    sourceUrl: "https://www.smartlancedesigns.com/project/katerinas-place/",
    projectSlug: "katerinas-place",
    published: true,
  },
  {
    id: "the-coast-abdullah",
    name: "Abdullah Khan",
    company: "The Coast",
    quote:
      "I used smartlance designs to build a website for our boutique villa. They were very patient and helpful to help navigate through things especially as I have limited Tech experience. Thanks Smartlance and would recommend them for future works",
    service: "Website Design",
    source: "Project page",
    sourceUrl: "https://www.smartlancedesigns.com/project/the-coast/",
    projectSlug: "the-coast",
    published: true,
  },
  {
    id: "banyan-vacations",
    name: "Banyan Vacations",
    company: "Banyan Vacations",
    quote:
      "Smartlance Designs met our expectations with their work on our website. Their professionalism, creativity, and technical expertise ensured our vision was perfectly realized.",
    service: "Website Design",
    source: "Project page",
    sourceUrl: "https://www.smartlancedesigns.com/project/banyan-vacations/",
    projectSlug: "banyan-vacations",
    published: true,
  },
  {
    id: "overlook-cabin-team",
    name: "The Overlook Cabin Rentals Team",
    company: "Overlook Cabin Rentals",
    quote:
      "Smartlance Designs did an amazing job on our new website. Their professionalism, creativity, and technical expertise brought our vision to life perfectly. The new website beautifully showcases our cabins and has significantly boosted our online presence.",
    service: "Website Design",
    source: "Project page",
    sourceUrl:
      "https://www.smartlancedesigns.com/project/overlook-cabin-rentals/",
    projectSlug: "overlook-cabin-rentals",
    published: true,
  },
  {
    id: "nashville-home-viewer-team",
    name: "Nashville Home Viewer Team",
    company: "Nashville Home Viewer",
    quote:
      "Smartlance Designs delivered exceptional results for Nashville Home Viewer. Their professionalism, creativity, and technical skills ensured our vision was brought to life perfectly. The real-time collaboration via Zoom was highly efficient, and the final website exceeded our expectations, beautifully showcasing our properties and significantly enhancing our online presence. The comprehensive post-launch support and training empowered us to manage the site confidently. We highly recommend Smartlance Designs for their outstanding work!",
    service: "Website Design",
    source: "Project page",
    sourceUrl:
      "https://www.smartlancedesigns.com/project/nashville-home-viewer/",
    projectSlug: "nashville-home-viewer",
    published: true,
  },
  {
    id: "kaerek-homes",
    name: "Kaerek Homes",
    company: "Kaerek Homes",
    quote:
      "Working with Smartlance Designs was a great experience. Their team was professional, creative, and highly skilled, ensuring our vision was realized. The real-time collaboration via Zoom was incredibly efficient, and the final website exceeded our expectations. It showcases our properties and has significantly boosted our online presence. The post-launch support and training were also top-notch, allowing us to confidently manage the site ourselves. We highly recommend Smartlance Designs for their excellent work!",
    service: "Website Design",
    source: "Project page",
    sourceUrl: "https://www.smartlancedesigns.com/project/kaerek-homes/",
    projectSlug: "kaerek-homes",
    published: true,
  },
];

export function getPublishedTestimonials() {
  return testimonials.filter(
    (item) =>
      item.published &&
      !item.isPlaceholder &&
      item.quote.trim().length > 0 &&
      item.name.trim().length > 0,
  );
}

export function getTestimonialById(id: string) {
  return getPublishedTestimonials().find((item) => item.id === id);
}

export function getTestimonialForProject(slug: string) {
  return getPublishedTestimonials().find((item) => item.projectSlug === slug);
}

/** Add team members when ready; unpublished entries stay hidden. */
export const teamMembers: TeamMember[] = [];

export function getPublishedTeam() {
  return teamMembers.filter(
    (member) => member.published && member.name.trim().length > 0,
  );
}

export const servicesHubFaqs: FaqItem[] = [
  {
    question: "How do design, development and SEO work together?",
    answer:
      "Your website should attract the right people, explain what you offer, and make it easy to enquire or buy. We plan design, development, SEO and conversion together so those pieces support each other rather than competing.",
  },
  {
    question: "Do I need every service?",
    answer:
      "No. Some businesses need a full redesign and SEO programme. Others need a landing page, technical fixes or conversion improvements. We recommend based on your goals and current site.",
  },
  {
    question: "Can you redesign my existing website?",
    answer:
      "Yes. Many projects start with an audit of what is working, what is confusing and what needs to change — then a focused redesign or rebuild plan.",
  },
  {
    question: "Can you work with my current platform?",
    answer:
      "Often yes. We work with WordPress, Shopify, BigCommerce and other established platforms when they are the right fit for your content, commerce or maintenance needs.",
  },
  {
    question: "How long does a typical website project take?",
    answer:
      "It depends on scope, content readiness and feedback speed. A focused marketing site often takes several weeks. Larger redesigns or e-commerce projects take longer. We confirm timelines during discovery.",
  },
  {
    question: "Do you provide ongoing support?",
    answer:
      "Yes. Website maintenance, SEO improvements and conversion work can continue after launch when you need updates, monitoring or further growth support.",
  },
];

export const contactFaqs: FaqItem[] = [
  {
    question: "What happens after I submit the form?",
    answer:
      "We review your details and follow up with the most useful next step — a quote conversation, a discovery call, or guidance on whether a free website review makes sense first.",
  },
  {
    question: "Do you work with businesses outside your local area?",
    answer:
      "Yes. Remote collaboration works well for most website and SEO projects.",
  },
  {
    question: "What if I’m not sure which service I need?",
    answer:
      "Choose “Not Sure Yet” in the form and share what you want to improve. We will help identify whether design, development, SEO, conversion work — or a combination — is the right starting point.",
  },
  {
    question: "Can you review my existing website first?",
    answer:
      "Yes. Existing websites can be reviewed before recommending a redesign or other work. You can also start with a Free Website Review if you prefer a structured review first.",
  },
  {
    question: "What should I prepare before getting in touch?",
    answer:
      "A formal brief is not required. A short note about your goals, your current website URL if you have one, and any timeline or budget range helps us respond with useful guidance.",
  },
];
