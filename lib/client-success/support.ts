import type {
  AgencySupportRequestCategory,
  AgencySupportRequestPriority,
  AgencySupportRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateSupportRequestNumber } from "@/lib/client-success/support-number";
import {
  assertWebsiteAccess,
  assertWebsiteSubmitSupport,
  getWebsiteAccessRole,
  websiteRoleCanRespondSupport,
} from "@/lib/client-success/website-access";
import {
  sendSupportConfirmationEmail,
  sendSupportReplyNotificationEmail,
  sendSupportWaitingOnClientEmail,
} from "@/lib/client-success/support-email";

const OPEN_STATUSES = new Set<AgencySupportRequestStatus>([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_ON_CLIENT",
  "RESOLVED",
]);

export async function portalSupportCanView(input: {
  supportRequestId: string;
  portalUserId: string;
}) {
  const sr = await prisma.agencySupportRequest.findUnique({
    where: { id: input.supportRequestId },
    select: { websiteId: true },
  });
  if (!sr) return false;
  return assertWebsiteAccess({ websiteId: sr.websiteId, portalUserId: input.portalUserId })
    .then(() => true)
    .catch(() => false);
}

export async function assertSupportView(input: {
  supportRequestId: string;
  portalUserId: string;
}) {
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
    select: { websiteId: true },
  });
  await assertWebsiteAccess({ websiteId: sr.websiteId, portalUserId: input.portalUserId });
}

export async function assertSupportReply(input: {
  supportRequestId: string;
  portalUserId: string;
}) {
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
    select: { websiteId: true, status: true },
  });
  await assertWebsiteAccess({ websiteId: sr.websiteId, portalUserId: input.portalUserId });
  const role = await getWebsiteAccessRole({ websiteId: sr.websiteId, portalUserId: input.portalUserId });
  if (!websiteRoleCanRespondSupport(role)) {
    throw new Error("You do not have permission to respond to this support request.");
  }
  if (!OPEN_STATUSES.has(sr.status) || sr.status === "CLOSED") {
    throw new Error("This support request is closed.");
  }
}

export async function createSupportRequest(input: {
  websiteId: string;
  portalUserId: string;
  contactId: string;
  category: AgencySupportRequestCategory;
  priority: AgencySupportRequestPriority;
  subject: string;
  description: string;
}) {
  await assertWebsiteSubmitSupport({ websiteId: input.websiteId, portalUserId: input.portalUserId });

  const website = await prisma.agencyManagedWebsite.findUniqueOrThrow({
    where: { id: input.websiteId },
    select: { primaryProjectId: true, name: true, domain: true },
  });

  const supportNumber = await generateSupportRequestNumber();

  const request = await prisma.agencySupportRequest.create({
    data: {
      supportNumber,
      websiteId: input.websiteId,
      projectId: website.primaryProjectId,
      submittedByPortalUserId: input.portalUserId,
      submittedByContactId: input.contactId,
      category: input.category,
      priority: input.priority,
      subject: input.subject.trim(),
      description: input.description.trim(),
      status: "OPEN",
      waitingOn: "SMARTLANCE",
    },
  });

  await sendSupportConfirmationEmail({ supportRequestId: request.id }).catch(() => undefined);

  return request;
}

export async function addClientSupportMessage(input: {
  supportRequestId: string;
  portalUserId: string;
  body: string;
}) {
  await assertSupportReply(input);
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
  });

  const message = await prisma.agencySupportMessage.create({
    data: {
      supportRequestId: input.supportRequestId,
      authorType: "CLIENT",
      portalUserId: input.portalUserId,
      body: input.body.trim(),
      clientVisible: true,
    },
  });

  const nextStatus =
    sr.status === "WAITING_ON_CLIENT" || sr.status === "RESOLVED" ? "OPEN" : sr.status;

  await prisma.agencySupportRequest.update({
    where: { id: input.supportRequestId },
    data: {
      status: nextStatus,
      waitingOn: "SMARTLANCE",
      updatedAt: new Date(),
      ...(sr.status === "RESOLVED" ? { resolvedAt: null } : {}),
    },
  });

  return message;
}

export async function confirmSupportResolution(input: {
  supportRequestId: string;
  portalUserId: string;
}) {
  await assertSupportReply({ supportRequestId: input.supportRequestId, portalUserId: input.portalUserId });
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
  });
  if (sr.status !== "RESOLVED") {
    throw new Error("This request is not awaiting your confirmation.");
  }
  return prisma.agencySupportRequest.update({
    where: { id: input.supportRequestId },
    data: {
      status: "CLOSED",
      waitingOn: "NONE",
      closedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function stillNeedHelp(input: {
  supportRequestId: string;
  portalUserId: string;
  message: string;
}) {
  await assertSupportReply(input);
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
  });
  if (sr.status !== "RESOLVED") {
    throw new Error("This action is only available for resolved requests.");
  }

  await prisma.agencySupportMessage.create({
    data: {
      supportRequestId: input.supportRequestId,
      authorType: "CLIENT",
      portalUserId: input.portalUserId,
      body: input.message.trim(),
      clientVisible: true,
    },
  });

  return prisma.agencySupportRequest.update({
    where: { id: input.supportRequestId },
    data: {
      status: "OPEN",
      waitingOn: "SMARTLANCE",
      resolvedAt: null,
      closedAt: null,
      updatedAt: new Date(),
    },
  });
}

// --- Admin / trusted actions ---

export async function addSmartlanceSupportMessage(input: {
  supportRequestId: string;
  adminUserId: string;
  body: string;
  clientVisible?: boolean;
}) {
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
  });
  if (sr.status === "CLOSED") throw new Error("Cannot reply to a closed support request.");

  const message = await prisma.agencySupportMessage.create({
    data: {
      supportRequestId: input.supportRequestId,
      authorType: "SMARTLANCE",
      adminUserId: input.adminUserId,
      body: input.body.trim(),
      clientVisible: input.clientVisible ?? true,
    },
  });

  if (input.clientVisible !== false) {
    await prisma.agencySupportRequest.update({
      where: { id: input.supportRequestId },
      data: {
        status: sr.status === "OPEN" ? "IN_PROGRESS" : sr.status,
        waitingOn: "CLIENT",
        updatedAt: new Date(),
      },
    });
    await sendSupportReplyNotificationEmail({ supportRequestId: input.supportRequestId }).catch(
      () => undefined,
    );
  }

  return message;
}

export async function markSupportWaitingOnClient(input: {
  supportRequestId: string;
  adminUserId: string;
  message?: string;
}) {
  if (input.message?.trim()) {
    await addSmartlanceSupportMessage({
      supportRequestId: input.supportRequestId,
      adminUserId: input.adminUserId,
      body: input.message,
    });
  }
  const updated = await prisma.agencySupportRequest.update({
    where: { id: input.supportRequestId },
    data: {
      status: "WAITING_ON_CLIENT",
      waitingOn: "CLIENT",
      updatedAt: new Date(),
    },
  });
  await sendSupportWaitingOnClientEmail({ supportRequestId: input.supportRequestId }).catch(
    () => undefined,
  );
  return updated;
}

export async function resolveSupportRequest(input: {
  supportRequestId: string;
  adminUserId: string;
  message?: string;
}) {
  if (input.message?.trim()) {
    await addSmartlanceSupportMessage({
      supportRequestId: input.supportRequestId,
      adminUserId: input.adminUserId,
      body: input.message,
    });
  }
  return prisma.agencySupportRequest.update({
    where: { id: input.supportRequestId },
    data: {
      status: "RESOLVED",
      waitingOn: "CLIENT",
      resolvedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function linkSupportToChangeRequest(input: {
  supportRequestId: string;
  changeRequestId: string;
  adminUserId: string;
}) {
  return prisma.agencySupportRequest.update({
    where: { id: input.supportRequestId },
    data: { changeRequestId: input.changeRequestId, updatedAt: new Date() },
  });
}

export async function listSupportRequestsForAdmin(filters?: {
  status?: AgencySupportRequestStatus;
  websiteId?: string;
}) {
  return prisma.agencySupportRequest.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.websiteId ? { websiteId: filters.websiteId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      website: { select: { id: true, name: true, domain: true } },
      submittedByContact: {
        select: { displayName: true, firstName: true, lastName: true, email: true },
      },
    },
    take: 100,
  });
}

export async function getSupportRequestForAdmin(id: string) {
  return prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id },
    include: {
      website: true,
      submittedByContact: true,
      changeRequest: { select: { id: true, changeRequestNumber: true, title: true, status: true, projectId: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { adminUser: { select: { name: true } } } },
      files: {
        where: { clientVisible: true },
        include: { projectFile: { select: { id: true, filename: true, mimeType: true, byteSize: true } } },
      },
    },
  });
}
