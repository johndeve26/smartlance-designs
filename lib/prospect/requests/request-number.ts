import { prisma } from "@/lib/db";

export async function generateProspectRequestNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.agencyProspectRequestCounter.findUnique({
      where: { year },
    });
    if (existing) {
      return tx.agencyProspectRequestCounter.update({
        where: { year },
        data: { lastNumber: { increment: 1 } },
      });
    }
    return tx.agencyProspectRequestCounter.create({
      data: { year, lastNumber: 1 },
    });
  });
  const num = String(counter.lastNumber).padStart(4, "0");
  return `PR-${year}-${num}`;
}
