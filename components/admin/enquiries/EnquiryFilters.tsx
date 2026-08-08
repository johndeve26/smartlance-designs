"use client";

export function EnquiryFilters({
  basePath,
  defaults,
  showType,
}: {
  basePath: string;
  defaults: {
    q: string;
    type: string;
    status: string;
    delivery: string;
    range: string;
  };
  showType?: boolean;
}) {
  return (
    <form method="get" action={basePath} className="flex flex-wrap gap-2">
      <input
        name="q"
        defaultValue={defaults.q}
        placeholder="Search name, email, website, reference…"
        className="min-w-[14rem] flex-1 rounded border px-3 py-2 text-sm"
      />
      {showType ? (
        <select
          name="type"
          defaultValue={defaults.type}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="CONTACT">Contact</option>
          <option value="WEBSITE_REVIEW">Website review</option>
        </select>
      ) : null}
      <select
        name="status"
        defaultValue={defaults.status}
        className="rounded border px-3 py-2 text-sm"
      >
        <option value="">Active (excl. spam)</option>
        <option value="NEW">NEW</option>
        <option value="REVIEWING">REVIEWING</option>
        <option value="REPLIED">REPLIED</option>
        <option value="QUALIFIED">QUALIFIED</option>
        <option value="CLOSED">CLOSED</option>
        <option value="SPAM">SPAM</option>
        <option value="all">All including spam</option>
      </select>
      <select
        name="delivery"
        defaultValue={defaults.delivery}
        className="rounded border px-3 py-2 text-sm"
      >
        <option value="">Any delivery</option>
        <option value="SENT">SENT</option>
        <option value="FAILED">FAILED</option>
        <option value="NOT_ATTEMPTED">NOT ATTEMPTED</option>
      </select>
      <select
        name="range"
        defaultValue={defaults.range}
        className="rounded border px-3 py-2 text-sm"
      >
        <option value="">Any date</option>
        <option value="today">Today</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
      <button
        type="submit"
        className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
      >
        Filter
      </button>
    </form>
  );
}
