# CRM Location and Social Profiles

## Location (first-class)

| Field | Notes |
|-------|--------|
| countryCode | ISO 3166-1 alpha-2 (e.g. NG, US) |
| countryName | Display name from `i18n-iso-countries` |
| stateRegion | Free text (Oyo, California, etc.) |
| city | Free text, no geocoding |
| postalCode | Optional |
| timezone | Optional IANA timezone |

Country inputs normalized on import and edit. Unknown countries → validation warning/issue, not invented codes.

## Social profiles

Model: `CrmContactSocialProfile`

Platforms: LINKEDIN, X, FACEBOOK, INSTAGRAM, GITHUB, YOUTUBE, TIKTOK, OTHER

- HTTPS URLs only; no `javascript:` / `data:`
- Known platforms optionally host-validated
- No profile scraping or enrichment
- Upsert by contact + platform on import (no duplicate LinkedIn per contact)

## Filters

- Country, city, has/missing location
- Has LinkedIn / any social / missing social
