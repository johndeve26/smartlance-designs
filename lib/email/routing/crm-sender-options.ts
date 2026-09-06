import { listActiveEmailSendingProfiles } from "@/lib/repositories/emailSendingProfileRepository";
import { resolveEmailSendingProfile } from "@/lib/email/routing/resolve-profile";

export type CrmSenderProfileOption = {
  id: string;
  name: string;
  fromEmail: string;
  fromName: string;
};

export type CrmRoutedSenderDefault = {
  profileId: string | null;
  fromName: string;
  fromEmail: string;
  /** How the CRM_MANUAL route resolved when no explicit profile is chosen. */
  source: string;
};

export async function listCrmSenderProfileOptions(): Promise<{
  profiles: CrmSenderProfileOption[];
  defaultProfileId: string | null;
  routedDefault: CrmRoutedSenderDefault;
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
    routedDefault: {
      profileId: resolved.profileId,
      fromName: resolved.fromName,
      fromEmail: resolved.fromEmail,
      source: resolved.source,
    },
  };
}
