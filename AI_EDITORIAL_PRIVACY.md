# AI Editorial Privacy

## Providers

| Concern | Detail |
| --- | --- |
| Admin providers | OpenAI, Anthropic (Claude), Google (Gemini), xAI (Grok), OpenRouter, Agent Router, Custom OpenAI-compatible |
| Key storage | Encrypted in `AIProviderAccount` (AES-256-GCM); Admin shows last 4 + Configured only |
| Encryption key | `AI_SECRETS_ENCRYPTION_KEY` (preferred) or `ADMIN_SESSION_SECRET` |
| Env fallbacks | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `XAI_API_KEY`, `OPENROUTER_API_KEY` |
| Optional research | Tavily (`TAVILY_API_KEY` / `AI_RESEARCH_API_KEY`) |

Full API keys are **never** returned to the browser after save. System Status shows Configured / Not Configured only.

## Data that may be sent to the AI provider

Only what is required for the current operation, typically:

- Working topic, brief, outline, draft markdown for the project  
- Selected research source metadata + short snippets  
- Verified published site summaries (Services, Solutions, Work claims as stored, Insights titles/descriptions, public verified testimonials)  
- Approved brand-voice profile  

### CMS Content Assistants (explicit invocation only)

Opening an Admin editor does **not** send data to the provider. Only when an authorized editor runs an assistant action:

- **Case Study AI:** current public Work fields plus, when **Approved for AI use** is enabled, structured `approvedProjectFacts`. Related Service/Industry/Platform metadata may be included as terminology context — not as invented project proof. Private Work notes (`designNotes`, etc.) are excluded by default.  
- **Testimonial Assistant:** the quote and limited public attribution when needed; related Work candidate metadata for relation suggestions. Prefer deterministic format/excerpt (may skip the provider entirely).  

## Never sent

- Enquiry / Free Website Review PII  
- Enquiry notes  
- Admin passwords / session tokens  
- Testimonial `internalVerificationNote` / private source URLs  
- Unapproved private Work notes  
- DB credentials / media secrets / notification API keys  
- Client email / phone / address (even if known from Enquiries) 

## Retention

Editorial content and run metadata live in PostgreSQL. Provider retention follows the vendor’s policy for API traffic — prefer minimizing payload size.

## Permissions

| Capability | Roles (default) |
| --- | --- |
| `use_ai_writer` | Super Admin, Editor, Content Manager |
| `manage_ai_settings` | Super Admin, Editor |
| `approve_ai_cms` | Super Admin, Editor, Content Manager |
| Create Insight draft | requires existing `edit_draft` |
| Publish | existing `publish` only — AI Writer never grants it |
