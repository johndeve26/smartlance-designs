import type { PrismaClient } from "@prisma/client";
import type { ActiveEmailTransport } from "@/lib/email/types";
import type { SendTransactionalEmailResult } from "@/lib/email/types";
import { resolveActiveEmailTransport } from "@/lib/email/config";
import {
  sendSmartlanceEmail,
  type SendSmartlanceEmailInput,
} from "@/lib/email/send-smartlance";
import { prisma as defaultPrisma } from "@/lib/db";

export type SchedulerHooks = {
  /** Called after claim, before any step processing — for race tests. */
  afterClaim?: (ctx: { executionId: string; enrollmentId: string }) => Promise<void>;
  /** Called immediately before transport send — for suppression race tests. */
  beforeTransport?: (ctx: { executionId: string; emailId: string }) => Promise<void>;
  /** Called after transport returns — for fault injection after SMTP success. */
  afterTransport?: (ctx: {
    executionId: string;
    emailId: string;
    sendResult: SendTransactionalEmailResult;
  }) => Promise<void>;
  /** Called before DB finalization after successful transport. */
  beforeFinalize?: (ctx: { executionId: string; emailId: string }) => Promise<void>;
};

export type SchedulerDeps = {
  db: PrismaClient;
  now: () => Date;
  resolveTransport: () => Promise<ActiveEmailTransport>;
  sendEmail: (input: SendSmartlanceEmailInput) => Promise<SendTransactionalEmailResult>;
  hooks?: SchedulerHooks;
};

export const defaultSchedulerDeps = (): SchedulerDeps => ({
  db: defaultPrisma,
  now: () => new Date(),
  resolveTransport: resolveActiveEmailTransport,
  sendEmail: (input) =>
    sendSmartlanceEmail({ ...input, category: input.category ?? "CRM_SEQUENCE" }),
});

export function mergeSchedulerDeps(
  overrides?: Partial<SchedulerDeps>,
): SchedulerDeps {
  const defaults = defaultSchedulerDeps();
  return {
    ...defaults,
    ...overrides,
    hooks: { ...defaults.hooks, ...overrides?.hooks },
  };
}
