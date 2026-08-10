# Public AI & Automation Architecture

Canonical hub: `/ai-automation`

## Child routes

| Route | Purpose |
|-------|---------|
| `/ai-automation/ai-agents` | Focused assistants with guardrails |
| `/ai-automation/workflow-automation` | Cross-tool workflow automation |
| `/ai-automation/voice-ai` | Inbound voice enquiry handling |
| `/ai-automation/integrations` | System connections |
| `/ai-automation/crm-lead-automation` | Lead capture and follow-up |
| `/ai-automation/custom-ai-tools` | Focused custom tools |

## Legacy redirects

`/services/ai-*` → canonical `/ai-automation/*` (see `lib/public/ai-automation-routes.ts` and `proxy.ts`).

## Operations solutions

Problem-led pages at `/solutions/*` (typed content, no CMS seed required):

- `respond-to-leads-faster`
- `automate-repetitive-work`
- `stop-leads-falling-through-the-cracks`
- `automate-customer-enquiries`
- `connect-business-tools`
- `centralize-business-knowledge`

## Content rules

- Business problems before technology
- Capability examples ≠ client proof
- No hype phrases or unverified partnerships
- AI optional — deterministic automation is valid

## Homepage integration

Capability strip (Web / Growth / AI / Automation), core capabilities section, AI & Automation editorial block with workflow diagram.

## Work filters

`?capability=websites|ai|automation` — menu and filters only show categories with published portfolio projects.
