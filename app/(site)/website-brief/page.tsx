import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getPortalUser } from "@/lib/portal/session";
import { WebsiteBriefBuilder } from "@/components/prospect/WebsiteBriefBuilder";
import { buildManagedPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("website-brief", {
    title: "Website Project Brief",
    description:
      "Build a detailed website project brief with Smartlance — goals, audience, pages, content, functionality and scope.",
    path: "/website-brief",
  });
}

export default async function WebsiteBriefPage({
  searchParams,
}: {
  searchParams: Promise<{ reviewId?: string; submit?: string }>;
}) {
  const params = await searchParams;
  const user = await getPortalUser();

  return (
    <Section className="!pt-10 !pb-12">
      <Container className="max-w-4xl">
        <WebsiteBriefBuilder
          isAuthenticated={Boolean(user)}
          sourceReviewId={params.reviewId}
          openSubmit={params.submit === "1"}
        />
      </Container>
    </Section>
  );
}
