import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPortalUser } from "@/lib/portal/session";
import { getReviewForAccess } from "@/lib/prospect/reviews/service";
import { ReviewResultView } from "@/components/prospect/ReviewResultView";

export default async function WorkspaceReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/workspace/login");

  const { id } = await params;
  const review = await getReviewForAccess(id, { portalUserId: user.id });
  if (!review) notFound();

  if (review.status === "COMPLETED" || review.status === "FAILED") {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/workspace/reviews" className="text-sm text-[#F47A48] hover:underline">
          ← All reviews
        </Link>
        <div className="mt-4">
          <ReviewResultView reviewId={id} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ReviewResultView reviewId={id} />
    </div>
  );
}
