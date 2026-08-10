import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { confirmSubscription } from "@/lib/audience";

export const metadata: Metadata = {
  title: "Confirm subscription",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SubscribeConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim();

  if (!token) {
    return (
      <ConfirmShell
        title="This confirmation link is invalid or has expired."
        body="Please subscribe again to receive Smartlance updates."
        actionHref="/blog"
        actionLabel="Read our Insights"
      />
    );
  }

  const result = await confirmSubscription(token);

  if (!result.ok) {
    return (
      <ConfirmShell
        title="This confirmation link is invalid or has expired."
        body="Please subscribe again to receive Smartlance updates."
        actionHref="/blog"
        actionLabel="Read our Insights"
      />
    );
  }

  return (
    <ConfirmShell
      title="You're subscribed."
      body="Thanks for confirming. You'll receive occasional website, SEO and conversion insights from Smartlance Designs."
      actionHref="/blog"
      actionLabel="Read our Insights"
      secondaryHref="/resources"
      secondaryLabel="Explore Resources"
    />
  );
}

function ConfirmShell({
  title,
  body,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Section className="!py-16 sm:!py-20">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{body}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={actionHref}
              className="inline-flex h-11 items-center justify-center rounded-[0.5rem] bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {actionLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-11 items-center justify-center rounded-[0.5rem] border border-border px-5 text-sm font-semibold text-foreground hover:bg-surface"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
