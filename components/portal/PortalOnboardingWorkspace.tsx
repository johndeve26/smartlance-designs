"use client";

import { useTransition } from "react";
import {
  saveOnboardingResponseAction,
  submitAccessRequirementAction,
  submitOnboardingAction,
  uploadOnboardingFileAction,
} from "@/lib/portal/onboarding-actions";

type PortalOnboardingData = NonNullable<
  Awaited<ReturnType<typeof import("@/lib/portal/onboarding").getPortalProjectOnboarding>>
>;

export function PortalOnboardingWorkspace({ data }: { data: PortalOnboardingData }) {
  const [pending, start] = useTransition();
  const { onboarding, sections, questions, requirements, progress } = data;
  const readOnly = onboarding.status === "COMPLETED" || onboarding.status === "CANCELLED";

  const questionsBySection = new Map<string, typeof questions>();
  for (const q of questions) {
    const list = questionsBySection.get(q.sectionId) ?? [];
    list.push(q);
    questionsBySection.set(q.sectionId, list);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Project onboarding</h1>
        <p className="mt-1 text-sm text-neutral-600">{onboarding.statusLabel}</p>
        <p className="mt-2 text-sm">
          Progress: {progress.percentComplete}% ({progress.requiredQuestionsComplete +
            progress.requiredRequirementsComplete}{" "}
          of{" "}
          {progress.requiredQuestionsTotal + progress.requiredRequirementsTotal} required items
          complete)
        </p>
        {onboarding.clientMessage ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{onboarding.clientMessage}</p>
        ) : null}
      </div>

      {sections.map((section) => (
        <section key={section.id} className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">{section.title}</h2>
          {section.description ? <p className="mt-1 text-sm text-neutral-600">{section.description}</p> : null}
          <div className="mt-4 space-y-4">
            {(questionsBySection.get(section.id) ?? []).map((q) => (
              <div key={q.id} className="border-t pt-3">
                <label className="block text-sm font-medium">
                  {q.label}
                  {q.required ? " *" : ""}
                </label>
                {q.helpText ? <p className="text-xs text-neutral-600">{q.helpText}</p> : null}
                {q.response?.reviewStatus === "NEEDS_CLARIFICATION" && q.response.reviewNote ? (
                  <p className="mt-1 text-sm text-amber-800">Needs clarification: {q.response.reviewNote}</p>
                ) : null}
                {q.type === "FILE_REQUEST" ? (
                  <form
                    className="mt-2"
                    action={(fd) => {
                      fd.set("onboardingId", onboarding.id);
                      fd.set("questionId", q.id);
                      start(async () => {
                        await uploadOnboardingFileAction(fd);
                      });
                    }}
                  >
                    <input type="file" name="file" required={q.required && !q.fileCount} disabled={readOnly} />
                    {q.fileCount ? (
                      <p className="mt-1 text-xs text-neutral-600">{q.fileCount} file(s) uploaded</p>
                    ) : null}
                    {!readOnly ? (
                      <button type="submit" disabled={pending} className="mt-2 text-sm underline">
                        Upload file
                      </button>
                    ) : null}
                  </form>
                ) : (
                  <form
                    className="mt-2 space-y-2"
                    action={(fd) => {
                      fd.set("onboardingId", onboarding.id);
                      fd.set("questionId", q.id);
                      start(async () => {
                        await saveOnboardingResponseAction(fd);
                      });
                    }}
                  >
                    {q.type === "LONG_TEXT" ? (
                      <textarea
                        name="valueText"
                        defaultValue={q.response?.valueText ?? ""}
                        className="w-full rounded border px-3 py-2 text-sm"
                        rows={4}
                        disabled={readOnly || q.response?.reviewStatus === "ACCEPTED"}
                      />
                    ) : q.type === "BOOLEAN" ? (
                      <select
                        name="valueText"
                        defaultValue={q.response?.valueText ?? ""}
                        className="rounded border px-3 py-2 text-sm"
                        disabled={readOnly || q.response?.reviewStatus === "ACCEPTED"}
                      >
                        <option value="">Select…</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        name="valueText"
                        defaultValue={q.response?.valueText ?? ""}
                        className="w-full rounded border px-3 py-2 text-sm"
                        disabled={readOnly || q.response?.reviewStatus === "ACCEPTED"}
                      />
                    )}
                    {!readOnly && q.response?.reviewStatus !== "ACCEPTED" ? (
                      <button type="submit" disabled={pending} className="text-sm underline">
                        Save answer
                      </button>
                    ) : null}
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">What we need from you</h2>
        <ul className="mt-3 space-y-4 text-sm">
          {requirements.map((req) => (
            <li key={req.id} className="border-t pt-3">
              <div className="font-medium">
                {req.title}
                {req.required ? " *" : ""}
              </div>
              <p className="text-neutral-600">{req.typeLabel} · {req.statusLabel}</p>
              {req.description ? <p className="mt-1">{req.description}</p> : null}
              {req.clientReviewNote ? (
                <p className="mt-1 text-amber-800">Needs clarification: {req.clientReviewNote}</p>
              ) : null}
              {req.type === "ACCESS" ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-neutral-600">
                    Do not enter passwords or secret keys here. Use collaborator invitations instead.
                  </p>
                  {req.accessMetadataJson &&
                  typeof req.accessMetadataJson === "object" &&
                  req.accessMetadataJson !== null ? (
                    <pre className="rounded bg-neutral-50 p-2 text-xs whitespace-pre-wrap">
                      {JSON.stringify(req.accessMetadataJson, null, 2)}
                    </pre>
                  ) : null}
                  {!readOnly && ["REQUESTED", "NEEDS_CLARIFICATION"].includes(req.status) ? (
                    <form
                      action={(fd) => {
                        fd.set("requirementId", req.id);
                        start(async () => {
                          await submitAccessRequirementAction(fd);
                        });
                      }}
                    >
                      <textarea
                        name="clientNote"
                        placeholder="Optional note (e.g. invitation sent)"
                        className="w-full rounded border px-3 py-2 text-sm"
                        rows={2}
                      />
                      <button type="submit" disabled={pending} className="mt-2 text-sm underline">
                        I&apos;ve sent the invitation
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : req.type === "BRAND_ASSET" || req.type === "CONTENT" ? (
                !readOnly && ["REQUESTED", "NEEDS_CLARIFICATION"].includes(req.status) ? (
                  <form
                    className="mt-2"
                    action={(fd) => {
                      fd.set("onboardingId", onboarding.id);
                      fd.set("requirementId", req.id);
                      start(async () => {
                        await uploadOnboardingFileAction(fd);
                      });
                    }}
                  >
                    <input type="file" name="file" />
                    {req.files.length ? (
                      <ul className="mt-1 text-xs text-neutral-600">
                        {req.files.map((f) => (
                          <li key={f.id}>{f.filename}</li>
                        ))}
                      </ul>
                    ) : null}
                    <button type="submit" disabled={pending} className="mt-2 text-sm underline">
                      Upload file
                    </button>
                  </form>
                ) : null
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {!readOnly && onboarding.status !== "UNDER_REVIEW" ? (
        <form
          action={() => {
            start(async () => {
              if (!confirm("Submit onboarding for Smartlance review?")) return;
              await submitOnboardingAction(onboarding.id);
            });
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Submit for review
          </button>
        </form>
      ) : null}

      {onboarding.status === "COMPLETED" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Onboarding is complete. Thank you — we have what we need to move forward.
        </p>
      ) : null}
    </div>
  );
}
