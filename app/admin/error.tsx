"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold text-neutral-900">
        Something went wrong
      </h1>
      <p className="text-sm text-neutral-600">
        This Admin screen hit an unexpected error. Try again. If it keeps
        happening, note the reference below and check System / logs.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-neutral-500">
          Reference: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
