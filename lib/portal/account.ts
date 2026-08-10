import { prisma } from "@/lib/db";

export async function getPortalAccount(portalUserId: string) {
  const user = await prisma.clientPortalUser.findUniqueOrThrow({
    where: { id: portalUserId },
    select: {
      id: true,
      email: true,
      status: true,
      lastLoginAt: true,
      contact: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true,
          company: {
            select: {
              id: true,
              name: true,
              website: true,
            },
          },
        },
      },
    },
  });

  const contact = user.contact;
  const displayName =
    contact.displayName?.trim() ||
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    contact.email;

  const projectAccess = await prisma.agencyProjectClientAccess.findMany({
    where: {
      portalUserId,
      revokedAt: null,
    },
    select: {
      role: true,
      contact: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const peopleByContact = new Map<
    string,
    { name: string; email: string | null; roles: Set<string> }
  >();

  for (const row of projectAccess) {
    const c = row.contact;
    const name =
      c.displayName?.trim() ||
      [c.firstName, c.lastName].filter(Boolean).join(" ") ||
      c.email ||
      "Contact";
    const existing = peopleByContact.get(c.id) ?? {
      name,
      email: c.email,
      roles: new Set<string>(),
    };
    existing.roles.add(row.role);
    peopleByContact.set(c.id, existing);
  }

  const team = Array.from(peopleByContact.entries()).map(([contactId, p]) => ({
    contactId,
    name: p.name,
    email: p.email,
    roles: Array.from(p.roles),
  }));

  return {
    user: {
      email: user.email,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    },
    profile: {
      displayName,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.jobTitle,
      company: contact.company
        ? { name: contact.company.name, website: contact.company.website }
        : null,
    },
    team,
  };
}
