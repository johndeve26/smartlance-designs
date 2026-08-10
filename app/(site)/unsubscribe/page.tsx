import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { unsubscribeByToken } from "@/lib/audience";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim();

  if (!token) {
    return (
      <UnsubscribeShell
        title="This unsubscribe link is invalid."
        body="If you continue receiving emails, please contact us."
      />
    );
  }

  const result = await unsubscribeByToken(token);

  if (!result.ok) {
    return (
      <UnsubscribeShell
        title="This unsubscribe link is invalid."
        body="If you continue receiving emails, please contact us."
      />
    );
  }

  return (
    <UnsubscribeShell
      title="You're unsubscribed."
      body="You won't receive future Smartlance updates at this email address."
      showResubscribe
    />
  );
}

function UnsubscribeShell({
  title,
  body,
  showResubscribe,
}: {
  title: string;
  body: string;
  showResubscribe?: boolean;
}) {
  return (
    <Section className="!py-16 sm:!py-20">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{body}</p>
          {showResubscribe ? (
            <p className="mt-8 text-sm text-muted">
              Changed your mind?{" "}
              <Link href="/blog" className="font-semibold text-accent-text hover:underline">
                Subscribe again
              </Link>
            </p>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
