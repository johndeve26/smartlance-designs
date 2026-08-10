import type { Prisma } from "@prisma/client";
import type { SegmentFilter } from "@/lib/crm/segments/filter-schema";
import { SEGMENT_FILTER_VERSION_V3 } from "@/lib/crm/segments/filter-schema";
import { contactFilterV3ToWhere } from "@/lib/crm/filters/contact-filter-query";
import type { ContactFilterV3 } from "@/lib/crm/filters/contact-filter-schema";

type LegacySegmentFilter = Exclude<SegmentFilter, ContactFilterV3>;

/** Build a Prisma where clause from a validated segment filter. */
export async function segmentFilterToWhere(
  filter: SegmentFilter,
): Promise<Prisma.CrmContactWhereInput> {
  if (filter.version === SEGMENT_FILTER_VERSION_V3) {
    return contactFilterV3ToWhere(filter as ContactFilterV3);
  }
  return segmentFilterToWhereLegacy(filter);
}

/** Legacy v1/v2 flat segment filters. */
export function segmentFilterToWhereLegacy(filter: LegacySegmentFilter): Prisma.CrmContactWhereInput {
  const where: Prisma.CrmContactWhereInput = { isArchived: false };

  if (filter.lifecycle?.length) {
    where.lifecycleStage = { in: filter.lifecycle };
  }
  if (filter.source?.length) {
    where.source = { in: filter.source };
  }
  if (filter.ownerId) {
    where.ownerId = filter.ownerId;
  }
  if (filter.emailStatus?.length) {
    where.emailStatus = { in: filter.emailStatus };
  }
  if (filter.companyId) {
    where.companyId = filter.companyId;
  }
  if (filter.outreachPaused === true) {
    where.outreachPaused = true;
  } else if (filter.outreachPaused === false) {
    where.outreachPaused = false;
  }

  if (filter.leadStatus?.length || filter.temperature?.length || filter.servicesInterested?.length) {
    const leadWhere: Prisma.CrmLeadWhereInput = {};
    if (filter.leadStatus?.length) {
      leadWhere.status = { in: filter.leadStatus };
    } else {
      leadWhere.status = { notIn: ["UNQUALIFIED", "CLOSED"] };
    }
    if (filter.temperature?.length) {
      leadWhere.temperature = { in: filter.temperature };
    }
    if (filter.servicesInterested?.length) {
      leadWhere.servicesInterested = { hasSome: filter.servicesInterested };
    }
    where.leads = { some: leadWhere };
  }

  if (filter.dealStage?.length) {
    where.deals = {
      some: {
        stage: { in: filter.dealStage },
        isArchived: false,
      },
    };
  } else if (filter.hasOpenDeal) {
    where.deals = {
      some: {
        isArchived: false,
        stage: { notIn: ["WON", "LOST"] },
      },
    };
  }

  if (filter.hasOpenTask) {
    where.tasks = { some: { status: "OPEN" } };
  }
  if (filter.noOpenTask) {
    where.tasks = { none: { status: "OPEN" } };
  }
  if (filter.overdueTask) {
    where.tasks = {
      some: { status: "OPEN", dueAt: { lt: new Date() } },
    };
  }

  if (filter.notContactedDays) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - filter.notContactedDays);
    where.OR = [
      { lastContactedAt: null },
      { lastContactedAt: { lt: cutoff } },
    ];
  }

  if (filter.lastContactedBefore || filter.lastContactedAfter) {
    where.lastContactedAt = {};
    if (filter.lastContactedBefore) {
      where.lastContactedAt.lt = new Date(filter.lastContactedBefore);
    }
    if (filter.lastContactedAfter) {
      where.lastContactedAt.gt = new Date(filter.lastContactedAfter);
    }
  }

  if (filter.createdBefore || filter.createdAfter) {
    where.createdAt = {};
    if (filter.createdBefore) {
      where.createdAt.lt = new Date(filter.createdBefore);
    }
    if (filter.createdAfter) {
      where.createdAt.gt = new Date(filter.createdAfter);
    }
  }

  if (filter.inActiveSequence === true) {
    where.sequenceEnrollments = {
      some: { status: { in: ["ACTIVE", "PAUSED"] } },
    };
  } else if (filter.inActiveSequence === false) {
    where.sequenceEnrollments = {
      none: { status: { in: ["ACTIVE", "PAUSED"] } },
    };
  }

  if ("hasDetectedOpen" in filter && filter.hasDetectedOpen === true) {
    where.emails = {
      some: {
        direction: "OUTBOUND",
        openDetectedCount: { gt: 0 },
      },
    };
  }

  if ("hasDetectedClick" in filter && filter.hasDetectedClick === true) {
    where.emails = {
      some: {
        direction: "OUTBOUND",
        clickDetectedCount: { gt: 0 },
      },
    };
  }

  if (
    "lastDetectedClickFrom" in filter ||
    "lastDetectedClickTo" in filter
  ) {
    const clickRange: { gte?: Date; lte?: Date } = {};
    if ("lastDetectedClickFrom" in filter && filter.lastDetectedClickFrom) {
      clickRange.gte = new Date(filter.lastDetectedClickFrom);
    }
    if ("lastDetectedClickTo" in filter && filter.lastDetectedClickTo) {
      clickRange.lte = new Date(filter.lastDetectedClickTo);
    }
    if (Object.keys(clickRange).length) {
      where.emails = {
        some: {
          direction: "OUTBOUND",
          lastClickDetectedAt: clickRange,
        },
      };
    }
  }

  return where;
}
