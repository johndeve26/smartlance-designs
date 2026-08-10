import { prisma } from "@/lib/db";
import { normalizeCrmEmail } from "@/lib/crm/normalize";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  createPortalToken,
  hashPortalToken,
  portalInviteExpiresAt,
} from "@/lib/portal/tokens";
import { createPortalSession, setPortalSessionCookie } from "@/lib/portal/session";
import { upsertProspectProfile } from "@/lib/prospect/profile";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { emailSiteUrl } from "@/lib/email/site-url";

async function resolveSystemAdminId() {
  const admin = await prisma.adminUser.findFirst({
    where: { status: "ACTIVE", role: "SUPER_ADMIN" },
    select: { id: true },
  });
  if (admin) return admin.id;
  const fallback = await prisma.adminUser.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  if (!fallback) throw new Error("No active admin user available for portal invite.");
  return fallback.id;
}

async function ensurePortalUser(contactId: string, email: string) {
  return prisma.clientPortalUser.upsert({
    where: { contactId },
    create: {
      contactId,
      email: email.trim().toLowerCase(),
      status: "ACTIVE",
    },
    update: {
      email: email.trim().toLowerCase(),
      status: "ACTIVE",
      lastLoginAt: new Date(),
    },
  });
}

export async function registerProspectAccount(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  primaryWebsite?: string;
}) {
  const normalized = normalizeCrmEmail(input.email);
  if (!normalized) throw new Error("A valid email address is required.");

  const nameParts = [input.firstName, input.lastName].filter(Boolean);
  const displayName =
    nameParts.length > 0 ? nameParts.join(" ") : normalized.split("@")[0];

  let contact = await prisma.crmContact.findUnique({
    where: { emailNormalized: normalized },
  });

  if (!contact) {
    try {
      contact = await prisma.crmContact.create({
        data: {
          email: normalized,
          emailNormalized: normalized,
          firstName: input.firstName?.trim() || null,
          lastName: input.lastName?.trim() || null,
          displayName,
          phone: input.phone?.trim() || null,
          lifecycleStage: "PROSPECT",
          source: "PROSPECT_WORKSPACE",
          sourceDetail: "prospect_signup",
        },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        contact = await prisma.crmContact.findUniqueOrThrow({
          where: { emailNormalized: normalized },
        });
      } else {
        throw err;
      }
    }
  } else {
    contact = await prisma.crmContact.update({
      where: { id: contact.id },
      data: {
        firstName: contact.firstName ?? (input.firstName?.trim() || null),
        lastName: contact.lastName ?? (input.lastName?.trim() || null),
        displayName: contact.displayName ?? displayName,
        phone: contact.phone ?? (input.phone?.trim() || null),
      },
    });
  }

  const portalUser = await ensurePortalUser(contact.id, normalized);

  await upsertProspectProfile({
    portalUserId: portalUser.id,
    firstName: input.firstName ?? contact.firstName,
    lastName: input.lastName ?? contact.lastName,
    companyName: input.companyName,
    phone: input.phone ?? contact.phone,
    primaryWebsite: input.primaryWebsite,
  });

  const session = await createPortalSession(portalUser.id);
  await setPortalSessionCookie(session.token, session.expiresAt);

  return { portalUser, contact, sessionToken: session.token };
}

export async function requestProspectMagicLink(email: string) {
  const normalized = normalizeCrmEmail(email);
  if (!normalized) return { ok: false as const, error: "Email is required." };

  let contact = await prisma.crmContact.findUnique({
    where: { emailNormalized: normalized },
  });

  if (!contact) {
    contact = await prisma.crmContact.create({
      data: {
        email: normalized,
        emailNormalized: normalized,
        displayName: contactDisplayName({ email: normalized }),
        lifecycleStage: "PROSPECT",
        source: "PROSPECT_WORKSPACE",
        sourceDetail: "magic_link_login",
      },
    });
  }

  const portalUser = await ensurePortalUser(contact.id, normalized);

  await upsertProspectProfile({
    portalUserId: portalUser.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
  });

  const token = createPortalToken();
  const tokenHash = hashPortalToken(token);
  const expiresAt = portalInviteExpiresAt();

  await prisma.clientPortalInvite.create({
    data: {
      portalUserId: portalUser.id,
      tokenHash,
      expiresAt,
      createdById: await resolveSystemAdminId(),
    },
  });

  const baseUrl = emailSiteUrl();
  const loginUrl = `${baseUrl}/workspace/auth/${token}`;

  void sendSmartlanceEmail({
    category: "AUTH_MAGIC_LINK",
    to: normalized,
    subject: "Your Smartlance workspace login link",
    text: [
      "Use this link to sign in to your Smartlance workspace:",
      "",
      loginUrl,
      "",
      "This link expires and can only be used once.",
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `<p>Use this link to sign in to your Smartlance workspace:</p><p><a href="${loginUrl}">Sign in to workspace</a></p><p>This link expires and can only be used once.</p><p>If you did not request this, you can ignore this email.</p>`,
  }).catch((err) => {
    console.error("[prospect:magic-link-email]", err instanceof Error ? err.message : err);
  });

  return { ok: true as const, loginUrl, email: normalized };
}

export async function acceptProspectMagicLink(token: string) {
  const tokenHash = hashPortalToken(token);
  const invite = await prisma.clientPortalInvite.findUnique({
    where: { tokenHash },
    include: { portalUser: { include: { contact: true } } },
  });

  if (!invite) throw new Error("Invalid or expired login link.");
  if (invite.status === "REVOKED") throw new Error("This login link has been revoked.");
  if (invite.status === "ACCEPTED") throw new Error("This login link has already been used.");
  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.clientPortalInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("This login link has expired.");
  }

  await prisma.clientPortalInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await prisma.clientPortalUser.update({
    where: { id: invite.portalUserId },
    data: { status: "ACTIVE", lastLoginAt: new Date() },
  });

  const session = await createPortalSession(invite.portalUserId);
  await setPortalSessionCookie(session.token, session.expiresAt);

  return { portalUser: invite.portalUser, sessionToken: session.token };
}
