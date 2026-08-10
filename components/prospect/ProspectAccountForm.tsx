"use client";

import { useState } from "react";
import { updateAccountAction } from "@/lib/prospect/actions";
import type { ProspectProfileDto } from "@/lib/prospect/dto";

export function ProspectAccountForm({ account }: { account: ProspectProfileDto }) {
  const [firstName, setFirstName] = useState(account.firstName ?? "");
  const [lastName, setLastName] = useState(account.lastName ?? "");
  const [companyName, setCompanyName] = useState(account.companyName ?? "");
  const [phone, setPhone] = useState(account.phone ?? "");
  const [primaryWebsite, setPrimaryWebsite] = useState(account.primaryWebsite ?? "");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateAccountAction({ firstName, lastName, companyName, phone, primaryWebsite });
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Company</label>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Primary website</label>
        <input
          value={primaryWebsite}
          onChange={(e) => setPrimaryWebsite(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-[#F47A48] px-4 py-2 text-sm font-medium text-white"
      >
        Save
      </button>
      {saved ? <p className="text-sm text-green-700">Saved</p> : null}
    </form>
  );
}
