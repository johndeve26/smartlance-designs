import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="text-sm text-neutral-600">
        That Admin page does not exist or you do not have access.
      </p>
      <Link href="/admin" className="text-sm font-medium text-[#F47A48] hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
