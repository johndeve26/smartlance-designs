import { absoluteUrl, hasRealAddress, siteConfig } from "@/lib/site";
import { socialLinks } from "@/data/navigation";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(overrides?: {
  name?: string;
  legalName?: string;
  url?: string;
  description?: string;
  email?: string;
  phone?: string;
  sameAs?: string[];
  logoPath?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
}): JsonLd {
  const publishedSocials =
    overrides?.sameAs && overrides.sameAs.length > 0
      ? overrides.sameAs
      : socialLinks
          .filter((link) => !link.isPlaceholder && link.href)
          .map((link) => link.href);

  const name = overrides?.name || siteConfig.name;
  const url = overrides?.url || siteConfig.url;
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    name,
    legalName: overrides?.legalName || siteConfig.legalName,
    url,
    logo: absoluteUrl(overrides?.logoPath || "/images/brand/smartlance-logo-v2.webp"),
    description: overrides?.description || siteConfig.description,
    email: overrides?.email || siteConfig.email,
  };

  const phone = overrides?.phone ?? siteConfig.phone;
  if (phone) {
    data.telephone = phone;
  }

  if (publishedSocials.length > 0) {
    data.sameAs = publishedSocials;
  }

  const address = overrides?.address;
  if (
    address &&
    address.streetAddress &&
    address.addressLocality &&
    address.addressCountry
  ) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: address.streetAddress,
      addressLocality: address.addressLocality,
      addressRegion: address.addressRegion,
      postalCode: address.postalCode,
      addressCountry: address.addressCountry,
    };
  } else if (hasRealAddress()) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetAddress,
      addressLocality: siteConfig.address.addressLocality,
      addressRegion: siteConfig.address.addressRegion,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.addressCountry,
    };
  }

  return data;
}

export function websiteJsonLd(overrides?: {
  name?: string;
  url?: string;
  description?: string;
}): JsonLd {
  const name = overrides?.name || siteConfig.name;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: overrides?.url || siteConfig.url,
    description: overrides?.description || siteConfig.description,
    publisher: {
      "@type": "Organization",
      name,
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: {
      "@type": "ProfessionalService",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function faqJsonLd(
  faqs: { question: string; answer: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  updatedAt?: string;
  image?: string;
  author?: string;
  schemaType?: "BlogPosting" | "Article";
}): JsonLd {
  const authorName = input.author?.trim();
  return {
    "@context": "https://schema.org",
    "@type": input.schemaType ?? "BlogPosting",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: authorName
      ? {
          "@type": "Person",
          name: authorName,
        }
      : {
          "@type": "Organization",
          name: siteConfig.name,
        },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/brand/smartlance-logo-v2.webp"),
      },
    },
    ...(input.image
      ? {
          image: input.image.startsWith("http")
            ? input.image
            : absoluteUrl(input.image),
        }
      : {}),
    mainEntityOfPage: absoluteUrl(input.path),
  };
}

export function definedTermJsonLd(input: {
  name: string;
  description: string;
  path: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inDefinedTermSet: absoluteUrl("/glossary"),
  };
}
