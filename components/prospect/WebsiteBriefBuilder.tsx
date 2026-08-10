"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { websiteProjectBriefTemplate } from "@/data/templates/website-project-brief-template";
import { getTemplateNav } from "@/data/templates";
import { ProjectBriefForm } from "@/components/templates/project-brief-form";
import { calculateBriefCompletion } from "@/lib/prospect/brief/schema";
import { saveBriefAction, createBriefAction, submitRequestAction } from "@/lib/prospect/actions";
import type { TemplateValues } from "@/components/templates/brief-plain-text";
import { PROSPECT_BRIEF_STORAGE_KEY } from "@/lib/prospect/constants";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Props = {
  briefId?: string;
  isAuthenticated: boolean;
  sourceReviewId?: string;
  openSubmit?: boolean;
};

export function WebsiteBriefBuilder({
  briefId: initialBriefId,
  isAuthenticated,
  sourceReviewId,
  openSubmit,
}: Props) {
  const router = useRouter();
  const [briefId, setBriefId] = useState(initialBriefId);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const nav = useMemo(() => getTemplateNav(websiteProjectBriefTemplate), []);

  useEffect(() => {
    if (initialBriefId || !isAuthenticated) return;
    void createBriefAction(sourceReviewId).then((r) => setBriefId(r.briefId));
  }, [initialBriefId, isAuthenticated, sourceReviewId]);

  const handleSaveAuthenticated = useCallback(
    async (values: TemplateValues) => {
      if (!briefId || !isAuthenticated) return;
      setSaving(true);
      setSaveState("saving");
      try {
        await saveBriefAction(briefId, values);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      } finally {
        setSaving(false);
      }
    },
    [briefId, isAuthenticated],
  );

  async function handleSubmit() {
    if (!isAuthenticated) {
      router.push("/workspace/login");
      return;
    }
    if (!briefId) return;

    const raw = localStorage.getItem(PROSPECT_BRIEF_STORAGE_KEY);
    const values = raw ? (JSON.parse(raw) as TemplateValues) : {};
    await saveBriefAction(briefId, values);

    setSubmitting(true);
    try {
      const result = await submitRequestAction({
        briefId,
        reviewId: sourceReviewId,
        submissionIdempotencyKey: crypto.randomUUID(),
        sourceDetail: sourceReviewId ? "FREE_WEBSITE_REVIEW" : "WEBSITE_BRIEF",
      });
      router.push(`/workspace/requests/${result.request.id}`);
    } catch {
      setSaveState("error");
    } finally {
      setSubmitting(false);
    }
  }

  const completion = useMemo(() => {
    if (typeof window === "undefined") {
      return { completionPercent: 0, completedSectionIds: [] as string[] };
    }
    const raw = localStorage.getItem(PROSPECT_BRIEF_STORAGE_KEY);
    const values = raw ? (JSON.parse(raw) as TemplateValues) : {};
    return calculateBriefCompletion(values);
  }, [saving, saveState]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-page-title">Website Brief</h1>
          <p className="mt-1 text-body-sm">
            {completion.completedSectionIds.length} of {nav.length} sections complete
            {completion.completionPercent > 0 ? ` · ${completion.completionPercent}%` : ""}
          </p>
          {saveState === "saving" ? (
            <p className="mt-1 text-xs text-subtle" aria-live="polite">
              Saving…
            </p>
          ) : saveState === "saved" ? (
            <p className="mt-1 text-xs text-success" aria-live="polite">
              Saved
            </p>
          ) : saveState === "error" ? (
            <p className="mt-1 text-xs text-error" aria-live="polite">
              Could not save
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {isAuthenticated && briefId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => {
                const raw = localStorage.getItem(PROSPECT_BRIEF_STORAGE_KEY);
                if (raw) void handleSaveAuthenticated(JSON.parse(raw) as TemplateValues);
              }}
            >
              Save
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/workspace/login">Sign in to save</Link>
            </Button>
          )}
          <Button type="button" size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending…" : "Send to Smartlance"}
          </Button>
        </div>
      </header>

      {sourceReviewId ? (
        <Alert tone="info">
          Suggested from your{" "}
          <Link href={`/workspace/reviews/${sourceReviewId}`} className="font-medium underline">
            website review
          </Link>
          .
        </Alert>
      ) : null}

      {openSubmit ? (
        <p className="text-body-sm">
          Preview your brief below, then send it to Smartlance when ready.
        </p>
      ) : null}

      <div className={cn("prospect-brief-builder", isAuthenticated && "rounded-lg")}>
        <ProjectBriefForm template={websiteProjectBriefTemplate} nav={nav} />
      </div>
    </div>
  );
}
