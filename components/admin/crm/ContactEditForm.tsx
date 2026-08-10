"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateContactAction } from "@/lib/admin/crm-actions";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORMS } from "@/lib/crm/social";
import { formatPropertyValueForDisplay } from "@/lib/crm/properties/validate";
import type { CrmContact, CrmContactSocialProfile, CrmContactPropertyValue, CrmPropertyDefinition } from "@prisma/client";

type ContactWithExtras = CrmContact & {
  socialProfiles: CrmContactSocialProfile[];
  propertyValues: (CrmContactPropertyValue & { definition: CrmPropertyDefinition })[];
};

export function ContactEditForm({
  contact,
  propertyDefinitions,
}: {
  contact: ContactWithExtras;
  propertyDefinitions: CrmPropertyDefinition[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const socialByPlatform = Object.fromEntries(
    contact.socialProfiles.map((s) => [s.platform, s.url]),
  );
  const valuesByDef = Object.fromEntries(
    contact.propertyValues.map((v) => [v.definitionId, v]),
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await updateContactAction(fd);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <AdminPanel>
      <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="contactId" value={contact.id} />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section>
        <h2 className="font-semibold">Contact information</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">First name<input className="admin-input mt-1" name="firstName" defaultValue={contact.firstName ?? ""} /></label>
          <label className="text-sm">Last name<input className="admin-input mt-1" name="lastName" defaultValue={contact.lastName ?? ""} /></label>
          <label className="text-sm sm:col-span-2">Display name<input className="admin-input mt-1" name="displayName" defaultValue={contact.displayName ?? ""} /></label>
          <label className="text-sm">Email<input className="admin-input mt-1" name="email" type="email" defaultValue={contact.email ?? ""} /></label>
          <label className="text-sm">Phone<input className="admin-input mt-1" name="phone" defaultValue={contact.phone ?? ""} /></label>
          <label className="text-sm sm:col-span-2">Job title<input className="admin-input mt-1" name="jobTitle" defaultValue={contact.jobTitle ?? ""} /></label>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Location</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Country code<input className="admin-input mt-1" name="countryCode" placeholder="NG" defaultValue={contact.countryCode ?? ""} /></label>
          <label className="text-sm">Country<input className="admin-input mt-1" name="countryName" defaultValue={contact.countryName ?? ""} /></label>
          <label className="text-sm">State/Region<input className="admin-input mt-1" name="stateRegion" defaultValue={contact.stateRegion ?? ""} /></label>
          <label className="text-sm">City<input className="admin-input mt-1" name="city" defaultValue={contact.city ?? ""} /></label>
          <label className="text-sm">Postal code<input className="admin-input mt-1" name="postalCode" defaultValue={contact.postalCode ?? ""} /></label>
          <label className="text-sm">Timezone<input className="admin-input mt-1" name="timezone" placeholder="Africa/Lagos" defaultValue={contact.timezone ?? ""} /></label>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Social profiles</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.filter((p) => p !== "OTHER").map((platform) => (
            <label key={platform} className="text-sm">
              {SOCIAL_PLATFORM_LABELS[platform]}
              <input
                className="admin-input mt-1"
                name={`social_${platform}`}
                type="url"
                defaultValue={socialByPlatform[platform] ?? ""}
                placeholder="https://"
              />
            </label>
          ))}
        </div>
      </section>

      {propertyDefinitions.length ? (
        <section>
          <h2 className="font-semibold">Custom properties</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {propertyDefinitions.map((def) => {
              const existing = valuesByDef[def.id];
              const display = existing
                ? formatPropertyValueForDisplay(def, existing)
                : "";
              return (
                <label key={def.id} className="text-sm">
                  {def.label}
                  <input
                    className="admin-input mt-1"
                    name={`property_${def.id}`}
                    defaultValue={display === "—" ? "" : display}
                  />
                </label>
              );
            })}
          </div>
        </section>
      ) : null}

      <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save contact"}
      </button>
      </form>
    </AdminPanel>
  );
}
