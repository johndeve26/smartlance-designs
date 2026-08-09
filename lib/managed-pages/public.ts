import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { PublishStatus } from "@prisma/client";

const published: PublishStatus = "PUBLISHED";

export async function getPublishedManagedPageByKey(key: string) {
  if (!hasDatabaseUrl()) return null;
  return prisma.managedPage.findFirst({
    where: { key, status: published },
  });
}
