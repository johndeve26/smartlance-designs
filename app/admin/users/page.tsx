import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/session";
import { roleLabel } from "@/lib/admin/rbac";
import { listAdminUsers } from "@/lib/repositories/adminUsersRepository";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  createUserAction,
  setUserStatusAction,
  updateUserRoleAction,
} from "@/lib/admin/user-actions";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { AdminSection } from "@/components/admin/patterns/AdminPanel";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/ui/format";

export const metadata: Metadata = {
  title: "Users",
};

type PageProps = {
  searchParams: Promise<{ created?: string; updated?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminUser("manage_users");
  const params = await searchParams;
  const users = await listAdminUsers();

  return (
    <div className="space-y-6">
      <AdminListPage
        title="Users"
        description="Manage admin accounts and roles."
        isEmpty={users.length === 0}
        empty={{
          title: "No admin users yet",
          description: "Create the first admin account below.",
        }}
      >
        <DataTable
          rows={users}
          rowKey={(u) => u.id}
          columns={[
            { key: "name", header: "Name", cell: (u) => <span className="font-medium">{u.name}</span> },
            { key: "email", header: "Email", cell: (u) => u.email },
            {
              key: "role",
              header: "Role",
              cell: (u) => (
                <form action={updateUserRoleAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <select
                    name="role"
                    defaultValue={u.role}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="CONTENT_MANAGER">Content Manager</option>
                    <option value="REVIEWER">Reviewer</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium hover:bg-surface-muted"
                  >
                    Set
                  </button>
                  <span className="sr-only">{roleLabel(u.role)}</span>
                </form>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (u) => <StatusBadge status={u.status} />,
            },
            {
              key: "lastLogin",
              header: "Last login",
              className: "whitespace-nowrap text-muted",
              cell: (u) => (u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"),
            },
            {
              key: "actions",
              header: "Actions",
              cell: (u) => (
                <form action={setUserStatusAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={u.status === "ACTIVE" ? "DISABLED" : "ACTIVE"}
                  />
                  <button
                    type="submit"
                    className={
                      u.status === "ACTIVE"
                        ? "rounded-md border border-error/30 bg-error-soft px-2 py-1 text-xs font-medium text-error"
                        : "rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium hover:bg-surface-muted"
                    }
                  >
                    {u.status === "ACTIVE" ? "Disable" : "Enable"}
                  </button>
                </form>
              ),
            },
          ]}
        />
      </AdminListPage>

      {params.created ? (
        <Alert tone="success">User created.</Alert>
      ) : null}
      {params.updated ? (
        <Alert tone="success">User updated.</Alert>
      ) : null}

      <AdminSection title="Create user">
        <AdminPanel className="max-w-lg">
          <CreateUserForm action={createUserAction} />
        </AdminPanel>
      </AdminSection>
    </div>
  );
}
