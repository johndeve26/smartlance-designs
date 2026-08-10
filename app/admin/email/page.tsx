import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getAdminEmailSettings } from "@/lib/repositories/emailSettingsRepository";
import { getAdminInboundEmailSettings } from "@/lib/repositories/inboundEmailSettingsRepository";
import { listEmailSendingProfiles } from "@/lib/repositories/emailSendingProfileRepository";
import { listEmailRoutingForAdmin } from "@/lib/repositories/emailRoutingRepository";
import { EmailAdminShell } from "@/components/admin/EmailAdminShell";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  const user = await requireAdminUser("manage_settings");
  const [emailSettings, inboundSettings, profiles, routing] = await Promise.all([
    getAdminEmailSettings(),
    getAdminInboundEmailSettings(),
    listEmailSendingProfiles(),
    listEmailRoutingForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email"
        description="Sending profiles, routing, system SMTP, and inbound mailbox sync."
      />
      <EmailAdminShell
        emailSettings={emailSettings}
        inboundSettings={inboundSettings}
        adminEmail={user.email}
        profiles={profiles}
        routing={routing}
        canManageProfiles={can(user.role, "manage_email_profiles")}
        canManageRouting={can(user.role, "manage_email_routing")}
      />
    </div>
  );
}
