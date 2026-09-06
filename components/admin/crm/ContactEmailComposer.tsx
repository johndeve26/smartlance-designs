"use client";

import { useCallback, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  renderContactEmailTemplateAction,
  sendContactEmailAction,
} from "@/lib/admin/crm-actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";

export type ContactEmailComposerProfile = {
  id: string;
  name: string;
  fromEmail: string;
  fromName: string;
};

export type ContactEmailComposerTemplate = {
  id: string;
  name: string;
};

type ComposerState = "idle" | "composing" | "sending" | "sent" | "error";

type SentSnapshot = {
  emailId: string;
  subject: string;
  sentAt: string;
  fromName: string | null;
  fromEmail: string | null;
  toEmail: string;
  sendingProfileId: string | null;
};

const FOLLOW_UP_PRESETS = [
  { value: "", label: "No follow-up" },
  { value: "1", label: "1 day" },
  { value: "2", label: "2 days" },
  { value: "3", label: "3 days" },
  { value: "5", label: "5 days" },
  { value: "7", label: "7 days" },
  { value: "custom", label: "Custom" },
] as const;

function formatFrom(name: string | null | undefined, email: string | null | undefined) {
  if (name && email) return `${name} <${email}>`;
  return email || name || "—";
}

function newClientRequestId() {
  return crypto.randomUUID();
}

export function ContactEmailComposer({
  contactId,
  contactName,
  contactEmail,
  canChooseSender,
  sendingProfiles,
  defaultSendingProfileId,
  routedDefaultFromName,
  routedDefaultFromEmail,
  templates = [],
  initiallyOpen = false,
  onRequestClose,
}: {
  contactId: string;
  contactName: string;
  contactEmail: string;
  canChooseSender: boolean;
  sendingProfiles: ContactEmailComposerProfile[];
  defaultSendingProfileId?: string | null;
  /** Platform/route From when no sending profile is explicitly chosen. */
  routedDefaultFromName?: string | null;
  routedDefaultFromEmail?: string | null;
  templates?: ContactEmailComposerTemplate[];
  initiallyOpen?: boolean;
  onRequestClose?: () => void;
}) {
  const router = useRouter();
  const formId = useId();
  const [state, setState] = useState<ComposerState>(initiallyOpen ? "composing" : "idle");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [followUpPreset, setFollowUpPreset] = useState("");
  const [followUpCustom, setFollowUpCustom] = useState("");
  const [sendingProfileId, setSendingProfileId] = useState(defaultSendingProfileId ?? "");
  const [lastSendingProfileId, setLastSendingProfileId] = useState<string | null>(
    defaultSendingProfileId ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [ambiguous, setAmbiguous] = useState(false);
  const [sent, setSent] = useState<SentSnapshot | null>(null);
  const [clientRequestId, setClientRequestId] = useState(newClientRequestId);
  const [pending, start] = useTransition();

  // Only treat as "default profile" when CRM routing actually resolves to a profile id.
  // Never fall back to sendingProfiles[0] — that falsely labels the platform/legacy From as John.
  const defaultProfile = useMemo(
    () =>
      defaultSendingProfileId
        ? sendingProfiles.find((p) => p.id === defaultSendingProfileId) ?? null
        : null,
    [sendingProfiles, defaultSendingProfileId],
  );

  const selectedProfile = useMemo(() => {
    if (sendingProfileId) {
      return sendingProfiles.find((p) => p.id === sendingProfileId) ?? null;
    }
    return defaultProfile;
  }, [sendingProfileId, sendingProfiles, defaultProfile]);

  const effectiveFromEmail =
    selectedProfile?.fromEmail ||
    routedDefaultFromEmail ||
    null;
  const effectiveFromName =
    selectedProfile?.fromName ||
    routedDefaultFromName ||
    null;
  const isPlatformFallback = !sendingProfileId && !defaultSendingProfileId;

  const routedFromLabel = formatFrom(
    routedDefaultFromName || defaultProfile?.fromName,
    routedDefaultFromEmail || defaultProfile?.fromEmail,
  );

  const resetComposerFields = useCallback(
    (keepFromProfileId?: string | null) => {
      setSubject("");
      setBody("");
      setFollowUpPreset("");
      setFollowUpCustom("");
      const nextFrom =
        keepFromProfileId !== undefined
          ? keepFromProfileId ?? ""
          : lastSendingProfileId ?? defaultSendingProfileId ?? "";
      setSendingProfileId(nextFrom);
      setError(null);
      setAmbiguous(false);
      setClientRequestId(newClientRequestId());
    },
    [defaultSendingProfileId, lastSendingProfileId],
  );

  const openComposer = () => {
    setState("composing");
    setError(null);
    setAmbiguous(false);
    setSent(null);
  };

  const cancelComposer = () => {
    resetComposerFields(defaultSendingProfileId ?? "");
    setSent(null);
    setState("idle");
    onRequestClose?.();
  };

  const sendAnother = () => {
    // Keep the From that was just used — do not silently fall back to platform contact@.
    resetComposerFields(lastSendingProfileId ?? sent?.sendingProfileId ?? "");
    setSent(null);
    setState("composing");
  };

  const followUpDays = (): number | undefined => {
    if (!followUpPreset) return undefined;
    if (followUpPreset === "custom") {
      const n = Number(followUpCustom);
      if (!Number.isFinite(n) || n < 1 || n > 90) return undefined;
      return Math.floor(n);
    }
    return Number(followUpPreset);
  };

  const onSend = () => {
    if (state === "sending" || pending) return;
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required.");
      setState("error");
      return;
    }
    if (followUpPreset === "custom") {
      const n = Number(followUpCustom);
      if (!Number.isFinite(n) || n < 1 || n > 90) {
        setError("Custom follow-up must be between 1 and 90 days.");
        setState("error");
        return;
      }
    }

    setError(null);
    setAmbiguous(false);
    setState("sending");

    start(async () => {
      const profileIdForSend = canChooseSender ? sendingProfileId || null : null;
      // #region agent log
      fetch('http://127.0.0.1:7865/ingest/6a47cb52-3efc-4de2-8a82-c4e8f9bb5986',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e4098e'},body:JSON.stringify({sessionId:'e4098e',runId:'post-fix',hypothesisId:'A',location:'ContactEmailComposer.tsx:onSend',message:'client send payload',data:{canChooseSender,sendingProfileIdState:sendingProfileId||null,profileIdForSend,selectedProfileId:selectedProfile?.id??null,selectedFromEmail:selectedProfile?.fromEmail??null,effectiveFromEmail,isPlatformFallback,routedDefaultFromEmail:routedDefaultFromEmail??null,defaultSendingProfileId:defaultSendingProfileId??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const result = await sendContactEmailAction({
        contactId,
        subject: subject.trim(),
        body: body.trim(),
        createFollowUpDays: followUpDays() ?? null,
        sendingProfileId: profileIdForSend,
        clientRequestId,
      });

      if (!result.ok) {
        // #region agent log
        fetch('http://127.0.0.1:7865/ingest/6a47cb52-3efc-4de2-8a82-c4e8f9bb5986',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e4098e'},body:JSON.stringify({sessionId:'e4098e',runId:'post-fix',hypothesisId:'A',location:'ContactEmailComposer.tsx:onSend:fail',message:'client send failed',data:{error:result.error,ambiguous:result.ambiguous},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setError(result.error);
        setAmbiguous(Boolean(result.ambiguous));
        setState("error");
        return;
      }

      setLastSendingProfileId(profileIdForSend);
      // #region agent log
      fetch('http://127.0.0.1:7865/ingest/6a47cb52-3efc-4de2-8a82-c4e8f9bb5986',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e4098e'},body:JSON.stringify({sessionId:'e4098e',runId:'post-fix',hypothesisId:'E',location:'ContactEmailComposer.tsx:onSend:ok',message:'client received snapshots',data:{emailId:result.emailId,fromName:result.fromName,fromEmail:result.fromEmail,deliveryStatus:result.deliveryStatus,profileIdForSend},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setSent({
        emailId: result.emailId,
        subject: result.subject,
        sentAt: result.sentAt,
        fromName: result.fromName,
        fromEmail: result.fromEmail,
        toEmail: contactEmail,
        sendingProfileId: profileIdForSend,
      });
      setState("sent");
      router.refresh();
    });
  };

  if (state === "idle") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={openComposer}>
          Compose email
        </Button>
      </div>
    );
  }

  if (state === "sent" && sent) {
    return (
      <AdminPanel className="mx-auto w-full max-w-[760px]">
        <div className="space-y-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-foreground">✓ Email sent</p>
            <StatusBadge status="SENT" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">{sent.subject}</p>
            <p className="mt-1 text-sm text-muted">Sent just now</p>
          </div>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-subtle">To</dt>
              <dd className="text-foreground">{sent.toEmail}</dd>
            </div>
            <div>
              <dt className="text-subtle">From</dt>
              <dd className="text-foreground">
                {formatFrom(sent.fromName, sent.fromEmail)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={`#email-${sent.emailId}`}>View email</a>
            </Button>
            <Button type="button" size="sm" onClick={sendAnother}>
              Send another email
            </Button>
          </div>
        </div>
      </AdminPanel>
    );
  }

  const sending = state === "sending" || pending;
  const fromLabel = selectedProfile
    ? formatFrom(selectedProfile.fromName, selectedProfile.fromEmail)
    : routedFromLabel !== "—"
      ? routedFromLabel
      : "Platform email (routed default)";

  return (
    <AdminPanel className="mx-auto w-full max-w-[760px]">
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Send email</h3>
          {sending ? (
            <span className="text-sm text-muted" aria-live="polite">
              Sending…
            </span>
          ) : null}
        </div>

        <div>
          <label className="admin-field-label" htmlFor={`${formId}-to`}>
            To
          </label>
          <p id={`${formId}-to`} className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
            {contactName} &lt;{contactEmail}&gt;
          </p>
        </div>

        <div>
          <label className="admin-field-label" htmlFor={`${formId}-from`}>
            From
          </label>
          {canChooseSender && sendingProfiles.length ? (
            <>
              <select
                id={`${formId}-from`}
                className="admin-input w-full"
                value={sendingProfileId}
                disabled={sending}
                onChange={(e) => setSendingProfileId(e.target.value)}
              >
                <option value="">
                  {defaultProfile
                    ? `${defaultProfile.name} (${defaultProfile.fromEmail}) — routed default`
                    : routedDefaultFromEmail
                      ? `Platform / system email (${routedDefaultFromEmail})`
                      : "Platform / system email"}
                </option>
                {sendingProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.fromEmail}
                  </option>
                ))}
              </select>
              <p
                className={`mt-2 text-sm ${isPlatformFallback ? "font-medium text-amber-800" : "text-muted"}`}
                aria-live="polite"
              >
                Will send as:{" "}
                <span className="text-foreground">
                  {formatFrom(effectiveFromName, effectiveFromEmail)}
                </span>
                {isPlatformFallback ? " (system SMTP — not a sending profile)" : null}
              </p>
            </>
          ) : (
            <p
              id={`${formId}-from`}
              className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
            >
              {fromLabel}
            </p>
          )}
        </div>

        {templates.length ? (
          <div>
            <label className="admin-field-label" htmlFor={`${formId}-template`}>
              Insert template
            </label>
            <select
              id={`${formId}-template`}
              className="admin-input w-full"
              defaultValue=""
              disabled={sending}
              onChange={(e) => {
                const templateId = e.target.value;
                if (!templateId) return;
                start(async () => {
                  const res = await renderContactEmailTemplateAction({
                    contactId,
                    templateId,
                  });
                  if (!res.ok) {
                    setError(res.error);
                    setState("error");
                    return;
                  }
                  setSubject(res.subject);
                  setBody(res.body);
                  if (res.hasUnresolved) {
                    setError("Template has unresolved variables — edit before sending.");
                    setState("error");
                  } else {
                    setError(null);
                    setState("composing");
                  }
                });
                e.target.value = "";
              }}
            >
              <option value="">Choose…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className="admin-field-label" htmlFor={`${formId}-subject`}>
            Subject
          </label>
          <input
            id={`${formId}-subject`}
            className="admin-input w-full"
            value={subject}
            disabled={sending}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div>
          <label className="admin-field-label" htmlFor={`${formId}-body`}>
            Message
          </label>
          <textarea
            id={`${formId}-body`}
            className="admin-input min-h-[180px] w-full"
            value={body}
            disabled={sending}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="admin-field-label" htmlFor={`${formId}-followup`}>
            Follow-up
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              id={`${formId}-followup`}
              className="admin-input min-w-[180px]"
              value={followUpPreset}
              disabled={sending}
              onChange={(e) => setFollowUpPreset(e.target.value)}
            >
              {FOLLOW_UP_PRESETS.map((opt) => (
                <option key={opt.value || "none"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {followUpPreset === "custom" ? (
              <input
                type="number"
                min={1}
                max={90}
                className="admin-input w-28"
                placeholder="Days"
                value={followUpCustom}
                disabled={sending}
                onChange={(e) => setFollowUpCustom(e.target.value)}
                aria-label="Custom follow-up days"
              />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-subtle">
            Creates an open follow-up task after a successful send.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={sending}
            onClick={cancelComposer}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={sending || (ambiguous && state === "error")}
          >
            {sending ? "Sending…" : ambiguous ? "Check history first" : "Send email"}
          </Button>
        </div>
        {ambiguous ? (
          <p className="text-sm text-muted" aria-live="polite">
            Do not resend until you confirm whether the message appears in Email History.
          </p>
        ) : null}
      </form>
    </AdminPanel>
  );
}
