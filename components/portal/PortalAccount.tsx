import Link from "next/link";
import type { getPortalAccount } from "@/lib/portal/account";
import { formatPortalDate } from "@/lib/portal/status-labels";
import { PortalCard } from "@/components/portal/PortalShell";

type AccountData = Awaited<ReturnType<typeof getPortalAccount>>;

const ROLE_LABELS: Record<string, string> = {
  CLIENT_ADMIN: "Admin",
  CLIENT_MEMBER: "Member",
  VIEWER: "Viewer",
  BILLING: "Billing",
};

export function PortalAccountView({ account }: { account: AccountData }) {
  const { profile, user, team } = account;

  return (
    <div className="space-y-6">
      <PortalCard>
        <h2 className="font-semibold text-[#535353]">Your profile</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Name</dt>
            <dd className="font-medium">{profile.displayName}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Email</dt>
            <dd>{profile.email ?? user.email}</dd>
          </div>
          {profile.phone ? (
            <div>
              <dt className="text-neutral-500">Phone</dt>
              <dd>{profile.phone}</dd>
            </div>
          ) : null}
          {profile.jobTitle ? (
            <div>
              <dt className="text-neutral-500">Job title</dt>
              <dd>{profile.jobTitle}</dd>
            </div>
          ) : null}
          {profile.company ? (
            <>
              <div>
                <dt className="text-neutral-500">Company</dt>
                <dd>{profile.company.name}</dd>
              </div>
              {profile.company.website ? (
                <div>
                  <dt className="text-neutral-500">Website</dt>
                  <dd>
                    <a
                      href={profile.company.website}
                      className="text-[#F47A48] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.company.website}
                    </a>
                  </dd>
                </div>
              ) : null}
            </>
          ) : null}
          {user.lastLoginAt ? (
            <div>
              <dt className="text-neutral-500">Last sign in</dt>
              <dd>{formatPortalDate(user.lastLoginAt)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-4 text-xs text-neutral-500">
          Profile changes do not alter signed contracts or issued invoices.
        </p>
      </PortalCard>

      <PortalCard>
        <h2 className="font-semibold text-[#535353]">People with access</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Team members who can access your Smartlance projects.
        </p>
        {team.length ? (
          <ul className="mt-4 divide-y divide-neutral-100">
            {team.map((person) => (
              <li key={person.contactId} className="py-3 text-sm">
                <p className="font-medium text-[#535353]">{person.name}</p>
                {person.email ? <p className="text-neutral-600">{person.email}</p> : null}
                <p className="mt-0.5 text-xs text-neutral-500">
                  {person.roles.map((r) => ROLE_LABELS[r] ?? r).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">No other team members listed yet.</p>
        )}
      </PortalCard>

      <div className="text-sm">
        <Link href="/portal/logout" className="text-neutral-600 hover:underline">
          Sign out
        </Link>
      </div>
    </div>
  );
}
