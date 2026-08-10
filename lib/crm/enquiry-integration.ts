import type { EnquiryType } from "@prisma/client";
import { recordCrmActivity } from "@/lib/crm/activities";
import { upsertContactFromEnquiry } from "@/lib/crm/contacts";
import { upsertLeadFromEnquiry } from "@/lib/crm/leads";
import type { CrmContactSource } from "@prisma/client";

export type EnquiryCrmInput = {
  enquiryId: string;
  reference: string;
  type: EnquiryType;
  name: string;
  email: string;
  company?: string | null;
  website?: string | null;
  service?: string | null;
  mainConcern?: string | null;
  sourcePath?: string | null;
};

function enquirySource(type: EnquiryType): CrmContactSource {
  return type === "CONTACT" ? "CONTACT_FORM" : "WEBSITE_REVIEW";
}

function enquiryAdminPath(type: EnquiryType, enquiryId: string) {
  return type === "CONTACT"
    ? `/admin/enquiries/contact/${enquiryId}`
    : `/admin/enquiries/reviews/${enquiryId}`;
}

/**
 * Safe post-persist CRM integration for inbound enquiries.
 * Failures are logged and swallowed — enquiry persistence is never rolled back.
 */
export async function tryIntegrateEnquiryWithCrm(
  input: EnquiryCrmInput,
): Promise<void> {
  try {
    const source = enquirySource(input.type);

    const contact = await upsertContactFromEnquiry({
      name: input.name,
      email: input.email,
      companyName: input.company,
      website: input.website,
      source,
      sourceUrl: input.sourcePath,
    });

    const interestSummary =
      input.type === "CONTACT"
        ? [input.service, input.mainConcern].filter(Boolean).join(" — ") || null
        : input.mainConcern ?? null;

    const servicesInterested = input.service ? [input.service] : [];

    const lead = await upsertLeadFromEnquiry({
      contactId: contact.id,
      companyId: contact.companyId,
      source,
      interestSummary,
      servicesInterested,
      temperature: "WARM",
    });

    await recordCrmActivity({
      contactId: contact.id,
      companyId: contact.companyId,
      leadId: lead.id,
      type: "FORM_SUBMISSION",
      subject:
        input.type === "CONTACT"
          ? "Contact form submitted"
          : "Website review submitted",
      metadata: {
        enquiryId: input.enquiryId,
        reference: input.reference,
        source: input.type,
        adminPath: enquiryAdminPath(input.type, input.enquiryId),
      },
    });
  } catch (error) {
    console.error(
      "[crm:enquiry-integration]",
      error instanceof Error ? error.message : "CRM integration failed",
    );
  }
}
