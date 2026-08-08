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
      <div>
        <h1 className="admin-page-title">Users</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage admin accounts and roles
        </p>
      </div>

      {params.created ? (
        <p className="text-sm text-emerald-700">User created.</p>
      ) : null}
      {params.updated ? (
        <p className="text-sm text-emerald-700">User updated.</p>
      ) : null}

      <section className="admin-card overflow-x-auto">
        {users.length === 0 ? (
          <div className="admin-empty">No admin users yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <form
                      action={updateUserRoleAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="admin-input py-1 text-sm"
                      >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="EDITOR">Editor</option>
                        <option value="CONTENT_MANAGER">Content Manager</option>
                        <option value="REVIEWER">Reviewer</option>
                      </select>
                      <button type="submit" className="admin-btn">
                        Set
                      </button>
                    </form>
                    <span className="sr-only">{roleLabel(u.role)}</span>
                  </td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="whitespace-nowrap text-neutral-500">
                    {u.lastLoginAt
                      ? u.lastLoginAt.toLocaleString()
                      : "Never"}
                  </td>
                  <td>
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
                            ? "admin-btn-danger"
                            : "admin-btn"
                        }
                      >
                        {u.status === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-card max-w-lg">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Create user
        </h2>
        <CreateUserForm action={createUserAction} />
      </section>
    </div>
  );
}
