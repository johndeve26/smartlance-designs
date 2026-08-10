import type { AgencyProspectRequestSourceDetail } from "@prisma/client";
import { recordCrmActivity } from "@/lib/crm/activities";
import { upsertContactFromEnquiry } from "@/lib/crm/contacts";
import { upsertLeadFromEnquiry } from "@/lib/crm/leads";

export type ProspectRequestCrmInput = {
  requestId: string;
  requestNumber: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  website?: string | null;
  title: string;
  sourceDetail: AgencyProspectRequestSourceDetail;
};

export async function tryIntegrateProspectRequestWithCrm(
  input: ProspectRequestCrmInput,
): Promise<{ contactId: string; leadId: string }> {
  const contact = await upsertContactFromEnquiry({
    name: input.name,
    email: input.email,
    phone: input.phone,
    companyName: input.company,
    website: input.website,
    source: "PROSPECT_WORKSPACE",
    sourceUrl: `/workspace/requests/${input.requestId}`,
  });

  const lead = await upsertLeadFromEnquiry({
    contactId: contact.id,
    companyId: contact.companyId,
    source: "PROSPECT_WORKSPACE",
    interestSummary: input.title,
    servicesInterested: [],
    temperature: "WARM",
  });

  await recordCrmActivity({
    contactId: contact.id,
    companyId: contact.companyId,
    leadId: lead.id,
    type: "FORM_SUBMISSION",
    subject: "Prospect project request submitted",
    metadata: {
      requestId: input.requestId,
      requestNumber: input.requestNumber,
      sourceDetail: input.sourceDetail,
      adminPath: `/admin/crm/contacts/${contact.id}`,
    },
  });

  return { contactId: contact.id, leadId: lead.id };
}
