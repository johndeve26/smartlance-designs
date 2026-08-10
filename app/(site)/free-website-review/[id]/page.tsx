import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ReviewResultView } from "@/components/prospect/ReviewResultView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function FreeWebsiteReviewResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();

  return (
    <Section className="!pt-10 !pb-12">
      <Container className="max-w-3xl">
        <ReviewResultView reviewId={id} />
      </Container>
    </Section>
  );
}
