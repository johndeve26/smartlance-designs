import {
  AUDIENCE_CONSENT_TEXT,
} from "@/lib/audience/constants";
import {
  buildConfirmationUrlAsync,
  buildUnsubscribeUrlAsync,
} from "@/lib/audience/urls";

function greeting(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed ? `Hi ${trimmed},` : "Hi,";
}

export async function audienceConfirmationEmailContent(input: {
  name?: string | null;
  confirmationToken: string;
}) {
  const confirmUrl = await buildConfirmationUrlAsync(input.confirmationToken);
  return {
    subject: "Confirm your Smartlance Designs subscription",
    text: [
      greeting(input.name),
      "",
      "Please confirm that you'd like to receive occasional Smartlance Designs website, SEO and conversion insights.",
      "",
      confirmUrl,
      "",
      "If you didn't request this, you can ignore this email.",
    ].join("\n"),
  };
}

export async function audienceWelcomeEmailContent(input: {
  name?: string | null;
  unsubscribeToken: string;
}) {
  const unsubscribeUrl = await buildUnsubscribeUrlAsync(input.unsubscribeToken);
  return {
    subject: "You're subscribed to Smartlance Designs updates",
    text: [
      greeting(input.name),
      "",
      "Thanks for confirming. You'll receive occasional practical website, SEO and conversion insights from Smartlance Designs.",
      "",
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
  };
}

export function audienceConsentDisclosure() {
  return AUDIENCE_CONSENT_TEXT;
}
