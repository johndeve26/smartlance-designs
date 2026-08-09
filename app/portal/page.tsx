import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalHomeData } from "@/lib/portal/projects";
import { getPortalUser } from "@/lib/portal/session";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const data = await getPortalHomeData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-600">{user.email}</p>
      </div>

      {data.needsAttention.length ? (
        <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Needs your attention</h2>
          <ul className="divide-y text-sm">
            {data.needsAttention.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex justify-between gap-2 py-2">
                <div>
                  <Link href={`/portal/projects/${item.projectId}`} className="font-medium hover:underline">
                    {item.projectNumber} · {item.title}
                  </Link>
                  <p className="text-neutral-600">{item.projectName}</p>
                </div>
                <span className="text-neutral-500">{item.statusLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Your projects</h2>
        <ul className="divide-y text-sm">
          {data.projects.map((p) => (
            <li key={p.id} className="flex justify-between gap-2 py-3">
              <div>
                <Link href={`/portal/projects/${p.id}`} className="font-medium hover:underline">
                  {p.projectNumber} · {p.name}
                </Link>
                <p className="text-neutral-600">{p.statusLabel}</p>
              </div>
              {p.targetDueDate ? (
                <span className="text-neutral-500">
                  Due {new Date(p.targetDueDate).toLocaleDateString()}
                </span>
              ) : null}
            </li>
          ))}
          {!data.projects.length ? (
            <li className="py-4 text-neutral-500">No projects are shared with you yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
