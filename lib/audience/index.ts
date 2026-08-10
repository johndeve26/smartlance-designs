export {
  AUDIENCE_CONSENT_TEXT,
  AUDIENCE_CONSENT_VERSION,
  PUBLIC_SUBSCRIBE_SUCCESS_ACTIVE,
  PUBLIC_SUBSCRIBE_SUCCESS_PENDING,
} from "@/lib/audience/constants";

export {
  subscribeFormSchema,
  subscriberSourceSchema,
  normalizeSubscriberEmail,
  normalizeSourceUrl,
  type SubscribeFormInput,
  type SubscriberSourceValue,
} from "@/lib/audience/schema";

export {
  subscribeToAudience,
  confirmSubscription,
  unsubscribeByToken,
  tryOptionalAudienceSubscribe,
  getAudienceSettings,
  countSubscribersByStatus,
  listSubscribers,
  getSubscriberById,
  adminUnsubscribeSubscriber,
  exportSubscribersCsv,
  toAdminSubscriberDto,
  parseSubscribePayload,
  type AdminSubscriberDto,
  type AudienceSettings,
  type SubscribeResult,
} from "@/lib/audience/service";

export { buildUnsubscribeUrlAsync } from "@/lib/audience/urls";

export { audienceConsentDisclosure } from "@/lib/audience/email-templates";
