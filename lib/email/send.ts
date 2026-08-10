import { OUTBOUND_TIMEOUTS, timeoutSignal } from "@/lib/ops/request-timeout";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import type {
  SendTransactionalEmailInput,
  SendTransactionalEmailResult,
} from "@/lib/email/types";

/** Strip CR/LF for email headers / subject fragments */
export function escapeHeaderFragment(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .replace(/[\r\n]+/g, " ");
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  return sendSmartlanceEmail({
    category: "GENERAL_SYSTEM",
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
    inReplyTo: input.inReplyTo,
    references: input.references,
    messageId: input.messageId,
  });
}
