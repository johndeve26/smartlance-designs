import type { EmailRouteCategory, EmailTransportType } from "@prisma/client";
import { resolveActiveEmailTransport } from "@/lib/email/config";
import { getEmailSettingsRecord } from "@/lib/repositories/emailSettingsRepository";
import { getEmailRoutingRule } from "@/lib/repositories/emailRoutingRepository";
import {
  getDefaultEmailSendingProfileRecord,
  getEmailSendingProfileRecord,
} from "@/lib/repositories/emailSendingProfileRepository";
import { resolveCustomSmtpConfig } from "@/lib/repositories/emailSendingProfileRepository";
import type { ResolvedSmtpConfig } from "@/lib/email/types";

export type ResolvedSendingProfileSource =
  | "explicit"
  | "route"
  | "default"
  | "fallback_default"
  | "legacy";

export type ResolvedSendingProfile = {
  profileId: string | null;
  profileName: string | null;
  fromName: string;
  fromEmail: string;
  replyToName: string | null;
  replyToEmail: string | null;
  transportType: EmailTransportType | "LEGACY";
  source: ResolvedSendingProfileSource;
  /** SMTP config when transport is smtp (custom or system with profile identity). */
  smtpConfig: ResolvedSmtpConfig | null;
  /** Resend when system transport is resend. */
  resendApiKey: string | null;
  provider: "smtp" | "resend" | "none";
};

function buildLegacyProfile(): ResolvedSendingProfile {
  return {
    profileId: null,
    profileName: null,
    fromName: "",
    fromEmail: "",
    replyToName: null,
    replyToEmail: null,
    transportType: "LEGACY",
    source: "legacy",
    smtpConfig: null,
    resendApiKey: null,
    provider: "none",
  };
}

async function profileToResolved(
  row: NonNullable<Awaited<ReturnType<typeof getEmailSendingProfileRecord>>>,
  source: ResolvedSendingProfileSource,
): Promise<ResolvedSendingProfile> {
  if (row.transportType === "CUSTOM_SMTP") {
    const custom = resolveCustomSmtpConfig(row);
    if (!custom.ok) {
      throw new Error(custom.error);
    }
    return {
      profileId: row.id,
      profileName: row.name,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      replyToName: row.replyToName,
      replyToEmail: row.replyToEmail,
      transportType: row.transportType,
      source,
      smtpConfig: custom.config,
      resendApiKey: null,
      provider: "smtp",
    };
  }

  const transport = await resolveActiveEmailTransport();
  if (transport.kind === "smtp") {
    return {
      profileId: row.id,
      profileName: row.name,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      replyToName: row.replyToName,
      replyToEmail: row.replyToEmail,
      transportType: row.transportType,
      source,
      smtpConfig: {
        ...transport.config,
        fromName: row.fromName,
        fromEmail: row.fromEmail,
        replyToEmail: row.replyToEmail ?? transport.config.replyToEmail,
      },
      resendApiKey: null,
      provider: "smtp",
    };
  }
  if (transport.kind === "resend") {
    const fromFormatted =
      row.fromName.trim().length > 0
        ? `${row.fromName} <${row.fromEmail}>`
        : row.fromEmail;
    return {
      profileId: row.id,
      profileName: row.name,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      replyToName: row.replyToName,
      replyToEmail: row.replyToEmail,
      transportType: row.transportType,
      source,
      smtpConfig: null,
      resendApiKey: transport.apiKey,
      provider: "resend",
      // resend uses fromFormatted via send layer
    };
  }

  throw new Error("Email delivery is not configured.");
}

async function resolveLegacyWithTransport(): Promise<ResolvedSendingProfile> {
  const transport = await resolveActiveEmailTransport();
  const settings = await getEmailSettingsRecord();

  if (transport.kind === "smtp") {
    return {
      profileId: null,
      profileName: null,
      fromName: transport.config.fromName ?? settings?.fromName ?? "Smartlance Designs",
      fromEmail: transport.config.fromEmail,
      replyToName: null,
      replyToEmail: transport.config.replyToEmail ?? settings?.replyToEmail ?? null,
      transportType: "LEGACY",
      source: "legacy",
      smtpConfig: transport.config,
      resendApiKey: null,
      provider: "smtp",
    };
  }
  if (transport.kind === "resend") {
    return {
      profileId: null,
      profileName: null,
      fromName: "",
      fromEmail: transport.fromEmail,
      replyToName: null,
      replyToEmail: null,
      transportType: "LEGACY",
      source: "legacy",
      smtpConfig: null,
      resendApiKey: transport.apiKey,
      provider: "resend",
    };
  }

  return buildLegacyProfile();
}

export async function resolveEmailSendingProfile(input: {
  category: EmailRouteCategory;
  sendingProfileId?: string | null;
}): Promise<ResolvedSendingProfile> {
  if (input.sendingProfileId) {
    const explicit = await getEmailSendingProfileRecord(input.sendingProfileId);
    if (!explicit?.isActive) {
      throw new Error("Selected sending profile is not active.");
    }
    return profileToResolved(explicit, "explicit");
  }

  const route = await getEmailRoutingRule(input.category);
  if (route?.sendingProfile.isActive) {
    return profileToResolved(route.sendingProfile, "route");
  }

  if (route && !route.sendingProfile.isActive) {
    const fallback = await getDefaultEmailSendingProfileRecord();
    if (fallback) {
      console.warn(
        "[email:routing]",
        `Inactive profile for ${input.category}; falling back to default.`,
      );
      return profileToResolved(fallback, "fallback_default");
    }
  }

  const defaultProfile = await getDefaultEmailSendingProfileRecord();
  if (defaultProfile) {
    return profileToResolved(defaultProfile, "default");
  }

  return resolveLegacyWithTransport();
}

export function formatProfileReplyTo(profile: ResolvedSendingProfile): string | undefined {
  if (profile.replyToEmail?.trim()) {
    if (profile.replyToName?.trim()) {
      return `"${profile.replyToName.replace(/[\r\n"]/g, " ")}" <${profile.replyToEmail.trim()}>`;
    }
    return profile.replyToEmail.trim();
  }
  return undefined;
}

export function formatProfileFrom(profile: ResolvedSendingProfile): string {
  const name = profile.fromName?.trim();
  const email = profile.fromEmail.trim();
  if (!name) return email;
  return `"${name.replace(/[\r\n"]/g, " ")}" <${email}>`;
}

export function formatResendFrom(profile: ResolvedSendingProfile): string {
  return formatProfileFrom(profile);
}
