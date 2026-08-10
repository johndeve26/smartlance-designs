import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import {
  getAdminSiteSettingsExtras,
  getSiteSettingsAdmin,
} from "@/lib/repositories/siteSettingsRepository";
import { getDeploymentEnvStatus } from "@/lib/admin/deployment-env-status";
import { getSystemStatus } from "@/lib/ops/system-status";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireAdminUser("manage_settings");
  const [settings, system, deploymentEnvRows] = await Promise.all([
    getSiteSettingsAdmin(),
    getSystemStatus(),
    Promise.resolve(getDeploymentEnvStatus()),
  ]);

  if (!settings) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Settings"
          description={
            <>
              Site settings not initialized. Run{" "}
              <code>npm run content:import:phase4</code>.
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site settings"
        description="Public configuration is DB-managed. Deployment secrets stay in environment variables and are never shown here."
      />
      <SettingsForm
        settings={{
          siteName: settings.siteName,
          businessName: settings.businessName,
          defaultSiteDescription: settings.defaultSiteDescription,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          whatsapp: settings.whatsapp,
          canonicalHost: settings.canonicalHost,
          footerDescription: settings.footerDescription,
          primaryLogoPath: settings.primaryLogoPath,
          logoOnDarkPath: settings.logoOnDarkPath,
          brandMarkPath: settings.brandMarkPath,
          faviconPath: settings.faviconPath,
          defaultMetaTitle: settings.defaultMetaTitle,
          defaultMetaDescription: settings.defaultMetaDescription,
          defaultOgImagePath: settings.defaultOgImagePath,
          defaultTitleTemplate: settings.defaultTitleTemplate,
          publisherName: settings.publisherName,
          gaMeasurementId: settings.gaMeasurementId,
          gtmContainerId: settings.gtmContainerId,
          clarityProjectId: settings.clarityProjectId,
          analyticsEnabled: settings.analyticsEnabled,
          contactFormEnabled: settings.contactFormEnabled,
          freeReviewFormEnabled: settings.freeReviewFormEnabled,
          audienceEnabled: settings.audienceEnabled,
          audienceRequireConfirmation: settings.audienceRequireConfirmation,
          formSuccessMessage: settings.formSuccessMessage,
          formFallbackMessage: settings.formFallbackMessage,
          showPublicPricing: settings.showPublicPricing,
          robotsDefaultIndex: settings.robotsDefaultIndex,
          socialLinks: Array.isArray(settings.socialLinks)
            ? (settings.socialLinks as Array<{
                platform: string;
                url: string;
                enabled: boolean;
                displayOrder: number;
              }>)
            : [],
          presentation: getAdminSiteSettingsExtras(settings),
        }}
        isSuperAdmin={can(user.role, "settings_critical")}
        envStatus={{
          email: system.emailDelivery.label,
          media: system.mediaStorage.label,
          analytics: system.analytics.label,
        }}
        deploymentEnvRows={deploymentEnvRows}
      />
      <AdminPanel>
        <h2 className="text-section-heading">Email delivery</h2>
        <p className="mt-1 text-body-sm">
          SMTP outbound and inbound mailbox sync are configured on the Email screen.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-3">
          <Link href="/admin/email">Open Email settings</Link>
        </Button>
      </AdminPanel>
    </div>
  );
}
