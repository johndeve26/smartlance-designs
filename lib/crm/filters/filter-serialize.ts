import { parseContactFilterV3, type ContactFilterV3 } from "@/lib/crm/filters/contact-filter-schema";

export function encodeContactFilterParam(filter: ContactFilterV3): string {
  const json = JSON.stringify(filter);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf8").toString("base64url");
  }
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeContactFilterParam(encoded: string): ContactFilterV3 | null {
  try {
    let json: string;
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(encoded, "base64url").toString("utf8");
    } else {
      const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      json = decodeURIComponent(escape(atob(b64)));
    }
    return parseContactFilterV3(JSON.parse(json));
  } catch {
    return null;
  }
}

export function mergeQuickFiltersIntoAdvanced(
  advanced: ContactFilterV3 | null | undefined,
  quick: ContactFilterV3["conditions"],
): ContactFilterV3 {
  const base = advanced ?? { version: 3 as const, match: "ALL" as const, conditions: [] };
  return {
    version: 3,
    match: base.match,
    conditions: [...base.conditions, ...quick],
  };
}

export function quickConditionsFromSearchParams(sp: {
  lifecycle?: string;
  leadStatus?: string;
  temperature?: string;
  countryCode?: string;
  source?: string;
  ownerId?: string;
  emailStatus?: string;
}): ContactFilterV3["conditions"] {
  const conditions: ContactFilterV3["conditions"] = [];
  if (sp.lifecycle) {
    conditions.push({ kind: "STANDARD", field: "lifecycleStage", operator: "IS", value: sp.lifecycle });
  }
  if (sp.leadStatus) {
    conditions.push({ kind: "STANDARD", field: "leadStatus", operator: "IS", value: sp.leadStatus });
  }
  if (sp.temperature) {
    conditions.push({ kind: "STANDARD", field: "temperature", operator: "IS", value: sp.temperature });
  }
  if (sp.countryCode) {
    conditions.push({ kind: "STANDARD", field: "countryCode", operator: "IN", value: [sp.countryCode] });
  }
  if (sp.source) {
    conditions.push({ kind: "STANDARD", field: "source", operator: "IS", value: sp.source });
  }
  if (sp.ownerId) {
    conditions.push({ kind: "STANDARD", field: "ownerId", operator: "IS", value: sp.ownerId });
  }
  if (sp.emailStatus) {
    conditions.push({ kind: "STANDARD", field: "emailStatus", operator: "IS", value: sp.emailStatus });
  }
  return conditions;
}
