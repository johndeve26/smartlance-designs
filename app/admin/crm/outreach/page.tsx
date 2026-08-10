import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getOutreachAnalytics } from "@/lib/crm/outreach/analytics";
import { getReliabilityAttentionItems } from "@/lib/crm/outreach/reliability-analytics";
import { getOutreachSettings } from "@/lib/crm/outreach/settings";
import { RunSchedulerButton } from "@/components/admin/crm/RunSchedulerButton";
import { ReliabilityAttentionPanel } from "@/components/admin/crm/ReliabilityAttentionPanel";
import { OutreachEngagementSettingsPanel } from "@/components/admin/crm/OutreachEngagementSettingsPanel";
import {
  AdminSection,
  AdminStatGrid,
} from "@/components/admin/patterns/AdminDashboardPanels";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function CrmOutreachPage() {
  const user = await requireAdminUser("view_crm");
  const [analytics, settings, attention] = await Promise.all([
    getOutreachAnalytics(),
    getOutreachSettings(),
    getReliabilityAttentionItems(),
  ]);
  const engagement = analytics.engagement;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Outreach Analytics"
        description="Factual outreach metrics — engagement signals are approximate and distinct from verified replies."
        action={can(user.role, "send_crm_email") ? <RunSchedulerButton /> : undefined}
      />

      {attention.needsAttention > 0 ? (
        <ReliabilityAttentionPanel
          items={attention}
          canManage={can(user.role, "manage_crm")}
          canSend={can(user.role, "send_crm_email")}
        />
      ) : null}

      <OutreachEngagementSettingsPanel
        trackEmailOpens={settings.trackEmailOpens}
        trackEmailClicks={settings.trackEmailClicks}
        canManage={can(user.role, "manage_crm")}
      />

      <AdminStatGrid
        stats={[
          { label: "Active enrollments", value: analytics.activeEnrollments },
          { label: "Emails sent today", value: analytics.emailsSentToday },
          { label: "Detected opens today", value: engagement.opensToday },
          { label: "Detected clicks today", value: engagement.clicksToday },
          { label: "Contacts with detected open", value: engagement.contactsWithDetectedOpen },
          { label: "Contacts with detected click", value: engagement.contactsWithDetectedClick },
          {
            label: "Approx. detected open rate",
            value: engagement.detectedOpenRate != null ? `${engagement.detectedOpenRate}%` : "—",
          },
          {
            label: "Detected click rate",
            value: engagement.detectedClickRate != null ? `${engagement.detectedClickRate}%` : "—",
          },
          { label: "Total open detections", value: engagement.totalOpenDetections },
          { label: "Total link click detections", value: engagement.totalClickDetections },
          { label: "Possible automated clicks", value: engagement.possibleAutomatedClicks },
          { label: "Verified replies (inbound)", value: analytics.verifiedRepliesTotal },
          { label: "Manual replies recorded", value: analytics.manualRepliesRecorded },
        ]}
      />

      <AdminSection title="Send limits">
        <AdminPanel>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Max sequence emails / day</dt>
              <dd>{settings.maxDailySequenceEmails}</dd>
            </div>
            <div>
              <dt className="text-muted">Min gap per contact (hours)</dt>
              <dd>{settings.minContactEmailGapHours}</dd>
            </div>
            <div>
              <dt className="text-muted">Min step delay (minutes)</dt>
              <dd>{settings.minStepDelayMinutes}</dd>
            </div>
            <div>
              <dt className="text-muted">Send window (UTC)</dt>
              <dd>
                {settings.sendWindowStartUtc}:00 – {settings.sendWindowEndUtc}:00
              </dd>
            </div>
          </dl>
        </AdminPanel>
      </AdminSection>

      <AdminSection title="Signal reliability">
        <AdminPanel>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>
              <strong className="text-foreground">Sent</strong> — provider accepted according to
              delivery state.
            </li>
            <li>
              <strong className="text-foreground">Open detected</strong> — tracking image requested;
              not proof the person read the email.
            </li>
            <li>
              <strong className="text-foreground">Click detected</strong> — redirect requested; may
              include security scanner activity.
            </li>
            <li>
              <strong className="text-foreground">Verified reply</strong> — inbound mailbox received
              a message matched to the thread.
            </li>
          </ul>
        </AdminPanel>
      </AdminSection>

      <AdminSection title="Sequences">
        <AdminPanel flush>
          <ul className="divide-y divide-border text-sm">
            {analytics.sequences.map((s) => (
              <li key={s.id} className="flex justify-between px-4 py-2">
                <span>{s.name}</span>
                <span className="text-muted">
                  {s.activeEnrollments} active · {s.completedEnrollments} completed
                </span>
              </li>
            ))}
            {!analytics.sequences.length ? (
              <li className="px-4 py-6 text-muted">No sequences yet.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </AdminSection>
    </div>
  );
}
