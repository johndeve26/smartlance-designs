import { listActiveEmailSendingProfiles } from "@/lib/repositories/emailSendingProfileRepository";
import { resolveEmailSendingProfile } from "@/lib/email/routing/resolve-profile";

export type CrmSenderProfileOption = {
  id: string;
  name: string;
  fromEmail: string;
  fromName: string;
};

export async function listCrmSenderProfileOptions(): Promise<{
  profiles: CrmSenderProfileOption[];
  defaultProfileId: string | null;
}> {
  const profiles = await listActiveEmailSendingProfiles();
  const resolved = await resolveEmailSendingProfile({ category: "CRM_MANUAL" });
  return {
    profiles: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      fromEmail: p.fromEmail,
      fromName: p.fromName,
    })),
    defaultProfileId: resolved.profileId,
  };
}
