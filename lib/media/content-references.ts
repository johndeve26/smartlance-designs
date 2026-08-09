import { parseCaseStudyContent } from "@/lib/work/case-study-content";
import { parseWorkDraftJson } from "@/lib/repositories/workDraftFields";
import { parseDraftJson as parseHomepageDraftJson } from "@/lib/repositories/homepageRepository";

export type ContentMediaReference = {
  entityType: string;
  entityId: string;
  label: string;
  href?: string;
  published: boolean;
  field: string;
  reference: string;
};

function pushRef(
  list: ContentMediaReference[],
  item: ContentMediaReference,
) {
  if (!item.reference?.trim()) return;
  list.push(item);
}

function collectStringRef(
  list: ContentMediaReference[],
  base: Omit<ContentMediaReference, "reference" | "field">,
  field: string,
  value: string | null | undefined,
) {
  if (!value?.trim()) return;
  pushRef(list, { ...base, field, reference: value.trim() });
}

export function extractCaseStudyContentImageRefs(
  content: unknown,
  base: Omit<ContentMediaReference, "reference" | "field">,
): ContentMediaReference[] {
  const refs: ContentMediaReference[] = [];
  const parsed = parseCaseStudyContent(content);
  if (!parsed) return refs;

  for (const item of parsed.gallery ?? []) {
    collectStringRef(refs, base, "caseStudyContent.gallery", item.src);
  }
  for (const feature of parsed.productFeatures ?? []) {
    if (feature.image?.src) {
      collectStringRef(
        refs,
        base,
        "caseStudyContent.productFeatures",
        feature.image.src,
      );
    }
  }

  return refs;
}

export function extractWorkMediaReferences(input: {
  id: string;
  name: string;
  status: string;
  coverImagePath: string | null;
  heroImagePath: string | null;
  ogImagePath: string | null;
  gallery: unknown;
  caseStudyContent: unknown;
  draftJson: unknown;
}): ContentMediaReference[] {
  const refs: ContentMediaReference[] = [];
  const published = input.status === "PUBLISHED";
  const base = {
    entityType: "WorkProject",
    entityId: input.id,
    label: input.name,
    href: `/admin/work/${input.id}`,
    published,
  };

  collectStringRef(refs, base, "coverImagePath", input.coverImagePath);
  collectStringRef(refs, base, "heroImagePath", input.heroImagePath);
  collectStringRef(refs, base, "ogImagePath", input.ogImagePath);
  if (Array.isArray(input.gallery)) {
    for (const item of input.gallery as Array<{ src?: string } | string>) {
      if (typeof item === "string") {
        collectStringRef(refs, base, "gallery", item);
      } else {
        collectStringRef(refs, base, "gallery", item?.src);
      }
    }
  }

  refs.push(
    ...extractCaseStudyContentImageRefs(input.caseStudyContent, base),
  );

  const draft = parseWorkDraftJson(input.draftJson);
  if (draft) {
    const draftBase = { ...base, published: false, label: `${input.name} (draft)` };
    collectStringRef(refs, draftBase, "draftJson.coverImagePath", draft.coverImagePath as string);
    collectStringRef(refs, draftBase, "draftJson.heroImagePath", draft.heroImagePath as string);
    collectStringRef(refs, draftBase, "draftJson.ogImagePath", draft.ogImagePath as string);
    if (draft.gallery) {
      for (const item of draft.gallery as Array<{ src?: string }>) {
        collectStringRef(refs, draftBase, "draftJson.gallery", item?.src);
      }
    }
    refs.push(
      ...extractCaseStudyContentImageRefs(draft.caseStudyContent, draftBase).map(
        (ref) => ({
          ...ref,
          field: `draftJson.${ref.field}`,
        }),
      ),
    );
  }

  return refs;
}

export function extractHomepageMediaReferences(input: {
  ogImagePath: string | null;
  sections: unknown;
  draftJson: unknown;
}): ContentMediaReference[] {
  const refs: ContentMediaReference[] = [];
  const base = {
    entityType: "HomepageContent",
    entityId: "home",
    label: "Homepage",
    href: "/admin/homepage",
    published: true,
  };

  collectStringRef(refs, base, "ogImagePath", input.ogImagePath);
  if (input.sections) {
    const blob = JSON.stringify(input.sections);
    const matches = blob.match(/\/(?:images|og)\/[^"'\s]+/g) ?? [];
    for (const match of matches) {
      pushRef(refs, { ...base, field: "sections", reference: match });
    }
  }

  const draft = parseHomepageDraftJson(input.draftJson);
  if (draft) {
    const draftBase = { ...base, published: false, label: "Homepage (draft)" };
    collectStringRef(refs, draftBase, "draftJson.ogImagePath", draft.ogImagePath ?? null);
    if (draft.sections) {
      const blob = JSON.stringify(draft.sections);
      const matches = blob.match(/\/(?:images|og)\/[^"'\s]+/g) ?? [];
      for (const match of matches) {
        pushRef(refs, {
          ...draftBase,
          field: "draftJson.sections",
          reference: match,
        });
      }
    }
  }

  return refs;
}
