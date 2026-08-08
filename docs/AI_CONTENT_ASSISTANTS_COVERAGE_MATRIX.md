# AI Content Assistants — Coverage Matrix

| CONTENT TYPE | ASSISTANT | MAIN INTENT | RESEARCH POLICY | PROOF POLICY | PROTECTED FIELDS | TI HANDOFF | DRAFT SAFE | STATUS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage | Homepage Copy Assistant | Brand, positioning, routing, conversion copy | Normally none | No invented trust metrics; curated IDs only | Visibility, noIndex, canonical, draft system, IDs | UPDATE_HOMEPAGE (high confidence) | Yes (`draftJson`) | Active |
| Service | Service AI | Commercial service clarity | Optional | No invented metrics | status, slug system, publish | UPDATE_SERVICE_PAGE | Yes | Active |
| Solution | Solution AI | Problem-first solution pages | Optional | No invented outcomes | status, publish flags | UPDATE_SOLUTION_PAGE | Yes | Active |
| Platform | Platform AI | Accurate platform facts | Recommended / required on research ops | Official/primary sources | verifiedExperience, match, featured, lastReviewedAt | UPDATE_PLATFORM_PAGE | Yes | Active |
| Industry | Industry AI | Industry framing within experience | Optional / recommended | Proven vs supported boundaries | group, hasVerifiedProjectExperience, featured | UPDATE_INDUSTRY_PAGE | Yes | Active |
| Work | Case Study AI | Present verified projects | Rare | Verified project facts only; news ≠ proof | status, featured, client identity, approved facts flags | UPDATE_WORK_PAGE (existing only) | Yes | Active |
| Testimonial | Testimonial Assistant | Format verified feedback | None | Never invent quotes; verified only | verified, attribution, originalQuote | **Never generate** | Yes | Active |
| Guide | Guide AI | Evergreen education | Optional / required on research | Section IDs preserved | status, slug, payload wholesale | EXPAND (GUIDE) | Yes | Active |
| Comparison | Comparison AI | Neutral decision support | Research both options | No winners / fake ratings | status, payload wholesale | EXPAND (COMPARISON) | Yes | Active |
| Checklist | Checklist AI | Actionable checklist copy | Optional | Stable item IDs | item/section IDs | EXPAND (CHECKLIST) | Yes | Active |
| Glossary | Glossary AI | Plain definitions | Prefer official sources | No obsolete metrics as current | status, slug | EXPAND (GLOSSARY) | Yes | Active |
| Template | Template Assistant | Labels / help / placeholders | Optional | Field IDs / conditionals | field IDs, showWhenAny | Manual / existing only | Yes | Active |
| Tool | Tool Copy Assistant | Public ToolContent copy | Optional | Scoring isolated | weights, signals, question IDs | Manual / existing only | Yes | Active |
| Insights | AI Editorial Studio | Editorial Insight projects | Editorial pipeline | Editorial Claim Ledger | CMS publish separate | WRITE_NEW | Yes | Active |

**Registry count:** 13 specialized CMS assistants + Insight Editorial Studio.
