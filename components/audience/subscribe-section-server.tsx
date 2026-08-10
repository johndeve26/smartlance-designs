import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";
import {
  SubscribeSection,
  type SubscribeSectionProps,
} from "@/components/audience/subscribe-section";

export async function AudienceSubscribeSection(
  props: Omit<SubscribeSectionProps, "enabled">,
) {
  const settings = await getPublicSettings();
  return (
    <SubscribeSection {...props} enabled={settings.audienceEnabled} />
  );
}
