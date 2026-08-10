import type { AgencyServiceType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  addTemplateQuestion,
  addTemplateRequirement,
  addTemplateSection,
  createOnboardingTemplate,
  publishOnboardingTemplateVersion,
} from "@/lib/onboarding/templates";

type OnboardingStarterSeed = {
  systemKey: string;
  name: string;
  description: string;
  serviceType: AgencyServiceType;
  welcomeText: string;
  sections: Array<{
    title: string;
    description?: string;
    questions?: Array<{
      key: string;
      label: string;
      type: Prisma.AgencyOnboardingTemplateQuestionCreateInput["type"];
      required?: boolean;
      helpText?: string;
      options?: Array<{ key: string; label: string }>;
    }>;
    requirements?: Array<{
      sourceKey: string;
      title: string;
      type: Prisma.AgencyOnboardingTemplateRequirementCreateInput["type"];
      required?: boolean;
      description?: string;
      offsetDaysDue?: number;
    }>;
  }>;
};

const STARTER_ONBOARDING_SEEDS: OnboardingStarterSeed[] = [
  {
    systemKey: "onboarding-website-design",
    name: "Website Design Onboarding",
    description: "Editable starter onboarding for new website design projects.",
    serviceType: "WEBSITE_DESIGN",
    welcomeText:
      "Welcome! Please complete this onboarding so we can start your website project with the right information and assets.",
    sections: [
      {
        title: "Business",
        description: "Tell us about your business and goals.",
        questions: [
          {
            key: "business_name",
            label: "Business name",
            type: "SHORT_TEXT",
            required: true,
          },
          {
            key: "business_summary",
            label: "Brief business summary",
            type: "LONG_TEXT",
            required: true,
            helpText: "What you do, who you serve, and what makes you different.",
          },
          {
            key: "primary_goal",
            label: "Primary website goal",
            type: "SINGLE_SELECT",
            required: true,
            options: [
              { key: "leads", label: "Generate enquiries" },
              { key: "sales", label: "Sell online" },
              { key: "credibility", label: "Build credibility" },
              { key: "other", label: "Other" },
            ],
          },
        ],
      },
      {
        title: "Brand",
        requirements: [
          {
            sourceKey: "brand_logo_files",
            title: "Logo files",
            type: "BRAND_ASSET",
            required: true,
            description: "Vector or high-resolution logo files (SVG, PNG, or PDF).",
            offsetDaysDue: 7,
          },
          {
            sourceKey: "brand_guidelines",
            title: "Brand guidelines (if available)",
            type: "BRAND_ASSET",
            required: false,
            offsetDaysDue: 7,
          },
        ],
      },
      {
        title: "Technical Access",
        requirements: [
          {
            sourceKey: "domain_access",
            title: "Domain / DNS access invitation",
            type: "ACCESS",
            required: false,
            description:
              "Invite the Smartlance team email with the permissions needed to manage DNS. Do not share account passwords.",
            offsetDaysDue: 14,
          },
          {
            sourceKey: "hosting_access",
            title: "Hosting / CMS access invitation",
            type: "ACCESS",
            required: false,
            description:
              "Invite the Smartlance team as a collaborator or administrator. Do not share master passwords.",
            offsetDaysDue: 14,
          },
        ],
      },
    ],
  },
  {
    systemKey: "onboarding-website-redesign",
    name: "Website Redesign Onboarding",
    description: "Editable starter onboarding for website redesign projects.",
    serviceType: "WEBSITE_REDESIGN",
    welcomeText: "Help us understand your current site and redesign priorities.",
    sections: [
      {
        title: "Existing Site",
        questions: [
          {
            key: "current_site_url",
            label: "Current website URL",
            type: "URL",
            required: true,
          },
          {
            key: "redesign_problems",
            label: "What is not working today?",
            type: "LONG_TEXT",
            required: true,
          },
        ],
        requirements: [
          {
            sourceKey: "cms_access",
            title: "CMS / admin access invitation",
            type: "ACCESS",
            required: true,
            description: "Invite Smartlance as a collaborator. Do not share passwords.",
            offsetDaysDue: 5,
          },
          {
            sourceKey: "analytics_access",
            title: "Analytics access invitation",
            type: "ACCESS",
            required: false,
            description: "Invite Smartlance to Google Analytics or similar.",
            offsetDaysDue: 7,
          },
        ],
      },
    ],
  },
  {
    systemKey: "onboarding-landing-page",
    name: "Landing Page Onboarding",
    description: "Editable starter onboarding for landing page projects.",
    serviceType: "LANDING_PAGE",
    welcomeText: "Share campaign context and assets for your landing page.",
    sections: [
      {
        title: "Campaign",
        questions: [
          {
            key: "campaign_offer",
            label: "Offer / headline focus",
            type: "LONG_TEXT",
            required: true,
          },
          {
            key: "target_audience",
            label: "Target audience",
            type: "LONG_TEXT",
            required: true,
          },
        ],
        requirements: [
          {
            sourceKey: "landing_copy",
            title: "Draft copy or bullet points",
            type: "CONTENT",
            required: false,
            offsetDaysDue: 5,
          },
        ],
      },
    ],
  },
  {
    systemKey: "onboarding-ecommerce",
    name: "E-commerce Onboarding",
    description: "Editable starter onboarding for e-commerce projects.",
    serviceType: "ECOMMERCE",
    welcomeText: "Tell us about your products, platform, and operational requirements.",
    sections: [
      {
        title: "Store",
        questions: [
          {
            key: "catalog_size",
            label: "Approximate catalog size",
            type: "NUMBER",
            required: true,
          },
          {
            key: "shipping_regions",
            label: "Shipping regions",
            type: "LONG_TEXT",
            required: true,
          },
        ],
        requirements: [
          {
            sourceKey: "platform_access",
            title: "Store platform access invitation",
            type: "ACCESS",
            required: true,
            description: "Invite Smartlance as staff/collaborator. Do not share payment or API secrets here.",
            offsetDaysDue: 7,
          },
        ],
      },
    ],
  },
  {
    systemKey: "onboarding-seo",
    name: "SEO Onboarding",
    description: "Editable starter onboarding for SEO engagements.",
    serviceType: "SEO",
    welcomeText: "Share your markets, services, and existing analytics access.",
    sections: [
      {
        title: "Markets & Services",
        questions: [
          {
            key: "target_services",
            label: "Priority services or products",
            type: "LONG_TEXT",
            required: true,
          },
          {
            key: "target_locations",
            label: "Target locations / markets",
            type: "LONG_TEXT",
            required: false,
          },
        ],
        requirements: [
          {
            sourceKey: "search_console_access",
            title: "Google Search Console access invitation",
            type: "ACCESS",
            required: false,
            offsetDaysDue: 7,
          },
        ],
      },
    ],
  },
  {
    systemKey: "onboarding-branding",
    name: "Branding Onboarding",
    description: "Editable starter onboarding for branding projects.",
    serviceType: "BRANDING",
    welcomeText: "Help us understand your brand direction and existing assets.",
    sections: [
      {
        title: "Brand Direction",
        questions: [
          {
            key: "audience",
            label: "Target audience",
            type: "LONG_TEXT",
            required: true,
          },
          {
            key: "brand_personality",
            label: "Brand personality / tone",
            type: "LONG_TEXT",
            required: true,
          },
        ],
        requirements: [
          {
            sourceKey: "existing_assets",
            title: "Existing brand assets",
            type: "BRAND_ASSET",
            required: false,
            offsetDaysDue: 7,
          },
        ],
      },
    ],
  },
  {
    systemKey: "onboarding-website-maintenance",
    name: "Website Maintenance Onboarding",
    description: "Editable starter onboarding for maintenance retainers.",
    serviceType: "WEBSITE_MAINTENANCE",
    welcomeText: "Share platform details and access invitations for ongoing maintenance.",
    sections: [
      {
        title: "Platform",
        questions: [
          {
            key: "site_platform",
            label: "Website platform (WordPress, Webflow, etc.)",
            type: "SHORT_TEXT",
            required: true,
          },
          {
            key: "current_issues",
            label: "Current issues or priorities",
            type: "LONG_TEXT",
            required: false,
          },
        ],
        requirements: [
          {
            sourceKey: "maintenance_access",
            title: "Maintenance access invitation",
            type: "ACCESS",
            required: true,
            description: "Invite Smartlance with appropriate collaborator permissions.",
            offsetDaysDue: 3,
          },
        ],
      },
    ],
  },
];

export const STARTER_ONBOARDING_TEMPLATE_SYSTEM_KEYS = STARTER_ONBOARDING_SEEDS.map(
  (s) => s.systemKey,
);

async function createStarterFromSeed(seed: OnboardingStarterSeed, createdById: string) {
  const template = await createOnboardingTemplate({
    name: seed.name,
    description: seed.description,
    serviceType: seed.serviceType,
    welcomeText: seed.welcomeText,
    createdById,
  });

  const versionId = template.currentVersionId!;
  for (const [sectionIndex, sectionSeed] of seed.sections.entries()) {
    const section = await addTemplateSection({
      versionId,
      title: sectionSeed.title,
      description: sectionSeed.description,
      position: sectionIndex,
    });

    for (const q of sectionSeed.questions ?? []) {
      await addTemplateQuestion({
        versionId,
        sectionId: section.id,
        key: q.key,
        label: q.label,
        type: q.type,
        required: q.required,
        helpText: q.helpText,
        optionsJson: q.options?.map((o, i) => ({
          key: o.key,
          label: o.label,
          position: i,
          active: true,
        })),
      });
    }

    for (const r of sectionSeed.requirements ?? []) {
      await addTemplateRequirement({
        versionId,
        sectionId: section.id,
        sourceKey: r.sourceKey,
        title: r.title,
        type: r.type,
        required: r.required,
        description: r.description,
        offsetDaysDue: r.offsetDaysDue,
      });
    }
  }

  await prisma.agencyOnboardingTemplate.update({
    where: { id: template.id },
    data: { systemKey: seed.systemKey, status: "ACTIVE" },
  });

  await publishOnboardingTemplateVersion({
    templateId: template.id,
    versionId,
  });

  return template.id;
}

export async function installStarterOnboardingTemplates(createdById: string) {
  let created = 0;
  let skipped = 0;

  for (const seed of STARTER_ONBOARDING_SEEDS) {
    const existing = await prisma.agencyOnboardingTemplate.findUnique({
      where: { systemKey: seed.systemKey },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await createStarterFromSeed(seed, createdById);
    created++;
  }

  return { created, skipped, total: STARTER_ONBOARDING_SEEDS.length };
}
