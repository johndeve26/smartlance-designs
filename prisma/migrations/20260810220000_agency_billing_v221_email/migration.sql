-- Agency Billing V2.2.1 — payment confirmation email idempotency
ALTER TABLE "AgencyPayment" ADD COLUMN IF NOT EXISTS "confirmationEmailSentAt" TIMESTAMP(3);
ALTER TABLE "AgencyPayment" ADD COLUMN IF NOT EXISTS "confirmationEmailClaimedAt" TIMESTAMP(3);
