"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { startOnboardingAction } from "@/lib/admin/onboarding-actions";

type TemplateOption = {
  id: string;
  name: string;
  versions: Array<{ id: string; versionNumber: number }>;
  currentVersionId: string | null;
};

export function StartOnboardingForm({
  projectId,
  templates,
}: {
  projectId: string;
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const activeTemplates = templates.filter((t) => t.versions.length > 0);

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        formData.set("projectId", projectId);
        start(async () => {
          const result = await startOnboardingAction(formData);
          if (!result.ok) {
            alert(result.error);
            return;
          }
          router.push(`/admin/agency/onboarding/${result.onboardingId}`);
          router.refresh();
        });
      }}
    >
      <h3 className="font-medium">Start client onboarding</h3>
      <select name="templateVersionId" required className="admin-input w-full max-w-md">
        <option value="">Select onboarding template…</option>
        {activeTemplates.map((t) => {
          const versionId = t.currentVersionId ?? t.versions[0]?.id;
          if (!versionId) return null;
          return (
            <option key={t.id} value={versionId}>
              {t.name}
            </option>
          );
        })}
      </select>
      <input
        type="date"
        name="targetCompletionDate"
        className="admin-input w-full max-w-md"
      />
      <textarea
        name="clientMessage"
        placeholder="Optional welcome message for the client"
        className="admin-input w-full max-w-xl"
        rows={3}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendEmail" defaultChecked />
        Send invitation email
      </label>
      <button type="submit" disabled={pending || !activeTemplates.length} className="admin-btn admin-btn-primary">
        {pending ? "Starting…" : "Start onboarding"}
      </button>
    </form>
  );
}
