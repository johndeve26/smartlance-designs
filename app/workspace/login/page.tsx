import Link from "next/link";
import { ProspectLoginForm } from "@/components/prospect/ProspectLoginForm";

export default async function WorkspaceLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ saveReview?: string }>;
}) {
  const params = await searchParams;
  const message = params.saveReview
    ? "Sign in or create an account to save your review and access your workspace."
    : undefined;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-[#535353]">Sign in to your workspace</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Save reviews, build briefs and track project requests.
      </p>
      <div className="mt-8">
        <ProspectLoginForm redirectMessage={message} />
      </div>
      <p className="mt-6 text-center text-sm text-neutral-500">
        New here? Enter your email — we&apos;ll create your workspace when you sign in.
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/" className="text-neutral-500 hover:underline">
          Back to Smartlance
        </Link>
      </p>
    </div>
  );
}
