import type { EmailRouteCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { OUTBOUND_TIMEOUTS, timeoutSignal } from "@/lib/ops/request-timeout";
import { normalizeSmtpError, safeSmtpLogDetail } from "@/lib/email/errors";
import {
  formatProfileReplyTo,
  formatResendFrom,
  resolveEmailSendingProfile,
} from "@/lib/email/routing/resolve-profile";
import { sendViaCachedSmtp } from "@/lib/email/transport/cache";
import { escapeHeaderFragment } from "@/lib/email/send";
import type { SendTransactionalEmailResult } from "@/lib/email/types";

export type SendSmartlanceEmailInput = {
  category: EmailRouteCategory;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  /** Overrides profile reply-to when needed for threading. */
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  messageId?: string;
  sendingProfileId?: string | null;
  snapshotTarget?: { crmEmailId: string };
};

async function writeCrmEmailSnapshot(
  crmEmailId: string,
  profile: Awaited<ReturnType<typeof resolveEmailSendingProfile>>,
) {
  await prisma.crmEmail.update({
    where: { id: crmEmailId },
    data: {
      sendingProfileId: profile.profileId,
      fromNameSnapshot: profile.fromName,
      fromEmailSnapshot: profile.fromEmail,
      replyToSnapshot: profile.replyToEmail,
      transportTypeSnapshot:
        profile.transportType === "LEGACY" ? null : profile.transportType,
      fromAddress: profile.fromEmail,
    },
  });
}

export async function sendSmartlanceEmail(
  input: SendSmartlanceEmailInput,
): Promise<SendTransactionalEmailResult> {
  let profile: Awaited<ReturnType<typeof resolveEmailSendingProfile>>;
  try {
    profile = await resolveEmailSendingProfile({
      category: input.category,
      sendingProfileId: input.sendingProfileId,
    });
  } catch (error) {
    return {
      success: false,
      provider: "none",
      errorCode: "PROFILE_RESOLVE_FAILED",
      errorMessage:
        error instanceof Error ? error.message : "Could not resolve sending profile.",
    };
  }

  // #region agent log
  {
    const { agentDebugLog } = await import("@/lib/debug/agent-log");
    agentDebugLog({
      hypothesisId: "C",
      location: "send-smartlance.ts:resolved",
      message: "resolved sending profile",
      data: {
        requestedSendingProfileId: input.sendingProfileId ?? null,
        category: input.category,
        resolvedProfileId: profile.profileId,
        resolvedName: profile.profileName,
        resolvedFromEmail: profile.fromEmail,
        resolvedFromName: profile.fromName,
        source: profile.source,
        provider: profile.provider,
        transportType: profile.transportType,
        smtpFromEmail: profile.smtpConfig?.fromEmail ?? null,
        smtpUsername: profile.smtpConfig?.username ?? null,
      },
    });
  }
  // #endregion

  if (profile.provider === "none") {
    return {
      success: false,
      provider: "none",
      errorCode: "UNCONFIGURED",
      errorMessage: "Email delivery is not configured.",
    };
  }

  if (input.snapshotTarget) {
    await writeCrmEmailSnapshot(input.snapshotTarget.crmEmailId, profile);
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  const subject = escapeHeaderFragment(input.subject);
  const replyTo =
    input.replyTo != null
      ? escapeHeaderFragment(input.replyTo)
      : formatProfileReplyTo(profile);
  const inReplyTo = input.inReplyTo
    ? escapeHeaderFragment(input.inReplyTo)
    : undefined;
  const references = input.references
    ? escapeHeaderFragment(input.references)
    : undefined;
  const messageId = input.messageId
    ? escapeHeaderFragment(input.messageId)
    : undefined;

  if (profile.provider === "smtp" && profile.smtpConfig) {
    const cacheKey = profile.profileId ?? "legacy-system";
    try {
      const result = await sendViaCachedSmtp(cacheKey, profile.smtpConfig, {
        to,
        subject,
        text: input.text,
        html: input.html,
        replyTo,
        inReplyTo,
        references,
        messageId,
      });
      return {
        success: true,
        messageId: result.messageId,
        provider: "smtp",
      };
    } catch (error) {
      console.error("[email:smtp]", safeSmtpLogDetail(error), {
        category: input.category,
        profileId: profile.profileId,
      });
      const normalized = normalizeSmtpError(error);
      return {
        success: false,
        provider: "smtp",
        errorCode: normalized.code,
        errorMessage: normalized.message,
      };
    }
  }

  if (profile.provider === "resend" && profile.resendApiKey) {
    try {
      const resendFrom = formatResendFrom(profile);
      // #region agent log
      {
        const { agentDebugLog } = await import("@/lib/debug/agent-log");
        agentDebugLog({
          hypothesisId: "E",
          location: "send-smartlance.ts:resend",
          message: "resend from header about to send",
          data: {
            fromHeader: resendFrom,
            profileId: profile.profileId,
            fromEmail: profile.fromEmail,
          },
        });
      }
      // #endregion
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${profile.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to,
          reply_to: replyTo || undefined,
          subject,
          text: input.text,
          html: input.html,
          headers: {
            ...(inReplyTo ? { "In-Reply-To": inReplyTo } : {}),
            ...(references ? { References: references } : {}),
            ...(messageId ? { "Message-ID": messageId } : {}),
          },
        }),
        signal: timeoutSignal(OUTBOUND_TIMEOUTS.notification),
      });

      if (!response.ok) {
        return {
          success: false,
          provider: "resend",
          errorCode: "HTTP_ERROR",
          errorMessage: "Email delivery failed.",
        };
      }

      const body = (await response.json().catch(() => ({}))) as { id?: string };
      return {
        success: true,
        messageId: body.id,
        provider: "resend",
      };
    } catch (error) {
      console.error(
        "[email:resend]",
        error instanceof Error ? error.message : "Resend request failed",
        { category: input.category, profileId: profile.profileId },
      );
      return {
        success: false,
        provider: "resend",
        errorCode: "DELIVERY_FAILED",
        errorMessage: "Email delivery failed.",
      };
    }
  }

  return {
    success: false,
    provider: "none",
    errorCode: "UNCONFIGURED",
    errorMessage: "Email delivery is not configured.",
  };
}
