"use client";

import { useActionState } from "react";
import type { UserActionState } from "@/lib/admin/user-actions";

type Props = {
  action: (
    prev: UserActionState,
    formData: FormData,
  ) => Promise<UserActionState>;
};

const initial: UserActionState = {};

export function CreateUserForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}
      <label className="admin-field">
        <span className="admin-label">Name</span>
        <input name="name" required className="admin-input" />
      </label>
      <label className="admin-field">
        <span className="admin-label">Email</span>
        <input type="email" name="email" required className="admin-input" />
      </label>
      <label className="admin-field">
        <span className="admin-label">Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={10}
          className="admin-input"
        />
      </label>
      <label className="admin-field">
        <span className="admin-label">Role</span>
        <select name="role" defaultValue="EDITOR" className="admin-input">
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="EDITOR">Editor</option>
          <option value="CONTENT_MANAGER">Content Manager</option>
          <option value="REVIEWER">Reviewer</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="admin-btn-primary"
      >
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
