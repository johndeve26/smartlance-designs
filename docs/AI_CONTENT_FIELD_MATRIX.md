# AI Content Field Matrix

**Status:** AUDIT ONLY  
**Legend — AI ACTION:** GENERATE | SUGGEST | IMPROVE | SUMMARIZE | RESEARCH | HUMAN_ONLY | SYSTEM_ONLY | PROTECTED  
**OVERWRITE:** Never on published live without draft accept; Prefer missing-only unless user chooses Propose rewrite.

Classifications are recommendations for future assistants based on inspected Prisma models and Admin forms.

---

## SERVICE (`Service`)

| FIELD | TYPE | AI ACTION | RESEARCH | PROOF | OVERWRITE? | REVIEW | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | system | SYSTEM_ONLY | — | — | No | — | |
| slug | identity | SUGGEST | — | — | Never if published | Human | Use existing slug+redirect workflow |
| href | identity | SYSTEM_ONLY / SUGGEST | — | — | Rare | Human | Usually derived `/services/{slug}` |
| title | identity | SUGGEST | — | — | Careful | Human | Positioning name |
| shortTitle | identity | SUGGEST / IMPROVE | — | — | Yes with accept | — | |
| category / group / icon | taxonomy | SUGGEST | — | — | Careful | Human | Prefer known enums |
| summary | hero | GENERATE / IMPROVE | Optional | — | Missing or propose | Yes | |
| description | content | GENERATE / IMPROVE | Optional | Capabilities must match offer | Missing or propose | Yes | Not Blog essay |
| tagline | hero | GENERATE / IMPROVE | — | — | Yes with accept | — | |
| narrativeTitle / narrative | content | GENERATE / IMPROVE | Optional | — | Yes with accept | Yes | |
| seoConnection | content | GENERATE / IMPROVE | Optional | — | Yes with accept | — | |
| audience | content | GENERATE / IMPROVE | Optional | — | Yes with accept | — | |
| platformsNote | content | IMPROVE / RESEARCH | Optional | No fake platform claims | Yes with accept | — | |
| visualVariant | display | HUMAN_ONLY | — | — | — | — | |
| featured / navigationFeatured / displayOrder | ops | HUMAN_ONLY | — | — | — | — | |
| capabilities[] | structured | GENERATE / IMPROVE | Optional | Must be real offer | Missing or propose | Yes | |
| idealFor[] / problems[] / deliverables[] | structured | GENERATE / IMPROVE | Optional | No invented deliverables | Missing or propose | Yes | |
| process[] | structured | GENERATE / IMPROVE | — | — | Missing or propose | Yes | |
| evaluationItems[] | structured | GENERATE / IMPROVE | — | — | Missing or propose | — | |
| faqs[] | structured | GENERATE / IMPROVE | Optional | — | Missing or propose | Yes | |
| related*Slugs / Hrefs | relations | SUGGEST | Internal DB | IDs must exist | Suggest only | Human accept | Server verify |
| CTA fields | commercial | GENERATE / IMPROVE | — | — | Yes with accept | — | |
| seoTitle / seoDescription / og* | SEO | GENERATE / IMPROVE | Internal cannibalization check | — | Propose | Yes | |
| noIndex / canonicalOverride | SEO | HUMAN_ONLY | — | — | — | — | |
| status / publishedAt | publish | HUMAN_ONLY | — | — | No | — | |
| createdById / updatedById / timestamps | audit | SYSTEM_ONLY | — | — | No | — | |

---

## SOLUTION (`Solution`)

| FIELD | TYPE | AI ACTION | RESEARCH | PROOF | OVERWRITE? | REVIEW | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id / timestamps / audit | system | SYSTEM_ONLY | — | — | No | — | |
| slug | identity | SUGGEST | — | — | Never if published | Human | |
| name / title | identity | SUGGEST / IMPROVE | — | — | Careful | Human | Problem-led naming |
| shortDescription | hero | GENERATE / IMPROVE | Optional | — | Missing or propose | Yes | Problem/outcome, not Service pitch |
| category / icon / featured / displayOrder | taxonomy/ops | SUGGEST / HUMAN_ONLY | — | — | Careful | Human | |
| eyebrow / heroStatement / heroSupporting | hero | GENERATE / IMPROVE | Optional | — | Missing or propose | Yes | |
| problemSymptoms[] / possibleCauses[] / whatWeReview[] | diagnosis | GENERATE / IMPROVE | Optional | — | Missing or propose | Yes | Core Solution DNA |
| process[] / measurementPoints[] | approach | GENERATE / IMPROVE | Optional | No fake metrics | Missing or propose | Yes | |
| relatedServiceHrefs | relations | SUGGEST | Internal | Required non-empty | Suggest | Human | |
| relatedPlatform/Industry/Project/Article | relations | SUGGEST | Internal | Verify IDs | Suggest | Human | |
| relatedServiceReasons / relatedSolutions | relations | GENERATE / SUGGEST | Internal | — | Propose | — | |
| faqs[] | structured | GENERATE / IMPROVE | Optional | — | Missing or propose | Yes | |
| pageKind / pageContent | page body | GENERATE / IMPROVE | Optional | Must stay problem→outcome | Propose carefully | Yes | High complexity |
| CTA / SEO | commercial/SEO | GENERATE / IMPROVE | Cannibalization | — | Propose | Yes | |
| status / publishedAt | publish | HUMAN_ONLY | — | — | No | — | |

---

## PLATFORM (`Platform`)

| FIELD | TYPE | AI ACTION | RESEARCH | PROOF | OVERWRITE? | REVIEW | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id / audit / timestamps | system | SYSTEM_ONLY | — | — | No | — | |
| slug / href | identity | SUGGEST / SYSTEM | — | — | Never if published | Human | |
| name / title | identity | SUGGEST | Official naming | — | Careful | Human | |
| summary / description / tagline | content | GENERATE / IMPROVE / RESEARCH | **Strongly recommended** | No invented features | Propose | Yes | Volatile |
| icon / group / prominence / featured / nav / order | display | HUMAN_ONLY / SUGGEST | — | — | Careful | Human | |
| verifiedExperience | proof flag | HUMAN_ONLY / PROTECTED | — | Work-backed | No AI set true | Human | |
| platformMatch | internal | HUMAN_ONLY / PROTECTED | — | — | No | — | Matching key |
| audiences / whenItFits / capabilities / challenges | content | GENERATE / IMPROVE / RESEARCH | **Required for claims** | Official preferred | Propose | Yes | |
| seoSection | content | GENERATE / IMPROVE / RESEARCH | Recommended | — | Propose | Yes | |
| relatedServiceHrefs / relatedSeoHrefs | relations | SUGGEST | Internal | Verify | Suggest | Human | |
| conversionNote / migrationNote | content | GENERATE / IMPROVE / RESEARCH | Recommended | No guarantees | Propose | Yes | |
| CTA / SEO | commercial/SEO | GENERATE / IMPROVE | — | — | Propose | Yes | |
| lastReviewedAt | freshness | SYSTEM / HUMAN | After research | — | Set on research accept | — | |
| status / publishedAt | publish | HUMAN_ONLY | — | — | No | — | |

---

## INDUSTRY (`Industry`)

| FIELD | TYPE | AI ACTION | RESEARCH | PROOF | OVERWRITE? | REVIEW | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id / audit | system | SYSTEM_ONLY | — | — | No | — | |
| slug / name | identity | SUGGEST | — | — | Careful | Human | |
| description | content | GENERATE / IMPROVE | Industry research optional | Experience claims gated | Missing or propose | Yes | No fake portfolio |
| group (proven/supported) | proof | HUMAN_ONLY / PROTECTED | — | Portfolio rule | No | Human | |
| hasVerifiedProjectExperience | proof | HUMAN_ONLY / PROTECTED | — | Requires Work links | No AI invent | Human | Publish gate |
| featured / displayOrder / icon | display | HUMAN_ONLY | — | — | — | — | |
| relatedServiceLinks / relatedSolutionSlugs | relations | SUGGEST | Internal | Verify | Suggest | Human | |
| IndustryWork links | relations | SUGGEST from Work | Internal | Published Work only if verified | Suggest | Human | |
| SEO fields | SEO | GENERATE | — | — | Propose | Yes | Often missing from Admin form |
| status / publishedAt | publish | HUMAN_ONLY | — | — | No | — | |

---

## WORK / CASE STUDY (`WorkProject`)

| FIELD | TYPE | AI ACTION | RESEARCH | PROOF | OVERWRITE? | REVIEW | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id / audit | system | SYSTEM_ONLY | — | — | No | — | |
| slug / name | identity | SUGGEST from notes | — | Client naming approved | Careful | Human | |
| clientName / projectType / year / urls | facts | HUMAN_ONLY / from verified notes | — | Verified only | No invent | Human | |
| industryLabel / servicesLabels | taxonomy | SUGGEST | Internal | — | Propose | Human | |
| shortDescription / overview | content | GENERATE from notes | Usually no web | Notes required | Propose | Yes | |
| challenge / solution | content | GENERATE / IMPROVE from notes | No | Notes required | Propose | Yes | Core |
| resultSummary / results[] / measurableResults | results | GENERATE qualitative from **verified** notes only | No | **Verified metrics only** | Never invent numbers | Strict | Admin banner exists |
| approach / design/dev/seo notes / goals / technologies | content | GENERATE / IMPROVE from notes | No | Notes | Propose | Yes | Many not in Admin form |
| hero/cover images / gallery / alts | media | HUMAN_ONLY / SUGGEST alts | — | — | Alts only | Human | Publish needs image |
| platformId / industries / related services/work | relations | SUGGEST | Internal | Verify | Suggest | Human | |
| narrative fields (heroStatement, approachSteps, etc.) | content | GENERATE from notes | No | Notes | Propose | Yes | |
| SEO | SEO | GENERATE | — | — | Propose | Yes | |
| status / publishedAt | publish | HUMAN_ONLY | — | — | No | — | |
| **Future: verified notes / approvedForAI** | intake | HUMAN_ONLY | — | Explicit | — | — | Recommended addition |

---

## TESTIMONIAL (`Testimonial`)

| FIELD | TYPE | AI ACTION | RESEARCH | PROOF | OVERWRITE? | REVIEW | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id / legacyId | system | SYSTEM_ONLY | — | — | No | — | |
| quote | proof | **PROTECTED** — format/excerpt only from supplied text | No | Client-supplied | Never fabricate | Strict | No generate button |
| name / company / role | attribution | HUMAN_ONLY | — | Verified | No invent | Human | |
| serviceLabel | taxonomy | SUGGEST | — | — | Careful | Human | |
| avatarPath | media | HUMAN_ONLY | — | — | — | — | |
| workProjectId | relations | SUGGEST | Internal | — | Suggest | Human | |
| verified | proof | HUMAN_ONLY / PROTECTED | — | Process | No | Human | Publish requires verified |
| featured / displayOrder | ops | HUMAN_ONLY | — | — | — | — | |
| internalSource / Url / VerificationNote | private | HUMAN_ONLY / PROTECTED | — | — | Never send to LLM by default | — | Never public |
| status / publishedAt | publish | HUMAN_ONLY | — | — | No | — | |
| **Future: displayExcerpt** | display | SUGGEST from quote | No | Substring of quote | Propose | Human | Optional |

---

## RESOURCE — GUIDE (`CmsResource` + Guide payload)

| FIELD / PAYLOAD | AI ACTION | RESEARCH | PROOF | NOTES |
| --- | --- | --- | --- | --- |
| title / description / deck / intro | GENERATE / IMPROVE | Topic-dependent | Claims ledger when factual | Closest to Insight |
| sections[].body / callouts | GENERATE / IMPROVE | As needed | Fact-check | Preserve section ids if stable |
| faqs / TOC | GENERATE / SUGGEST | Optional | — | |
| relations / SEO / topics | SUGGEST / GENERATE | Internal | Verify IDs | |
| status / ids / timestamps | HUMAN / SYSTEM | — | — | |

---

## RESOURCE — COMPARISON

| FIELD / PAYLOAD | AI ACTION | RESEARCH | PROOF | NOTES |
| --- | --- | --- | --- | --- |
| optionA/B, summary, criteria, matrix, tradeoffs | GENERATE / IMPROVE / RESEARCH | **Strongly recommended** | Official sources | **No winner / ratings** |
| bestFor / avoid / decisionQuestions / guidance | GENERATE / IMPROVE | Recommended | Balanced | Neutrality required |
| sections / faqs / SEO | GENERATE / IMPROVE | Optional | — | |
| criterion/matrix ids | PROTECTED | — | — | Keep stable where used |

---

## RESOURCE — CHECKLIST

| FIELD / PAYLOAD | AI ACTION | RESEARCH | PROOF | NOTES |
| --- | --- | --- | --- | --- |
| intro / section titles / item text | GENERATE / IMPROVE | Optional | — | Wording only |
| **item.id / section.id / subgroup.id** | **PROTECTED** | — | — | LocalStorage progress |
| priority / appliesWhen / relatedHref | SUGGEST | — | — | Careful |
| SEO / relations | GENERATE / SUGGEST | — | Verify | |

---

## RESOURCE — GLOSSARY

| FIELD / PAYLOAD | AI ACTION | RESEARCH | PROOF | NOTES |
| --- | --- | --- | --- | --- |
| term / acronym / aliases | SUGGEST | Official naming | — | |
| shortDefinition / fullExplanation | GENERATE / IMPROVE / RESEARCH | **For technical terms** | Accurate defs | No false definitions |
| whyItMatters / example / misconceptions | GENERATE / IMPROVE | Optional | — | |
| related terms / SEO | SUGGEST / GENERATE | Internal | Verify | |

---

## RESOURCE — TEMPLATE

| FIELD / PAYLOAD | AI ACTION | RESEARCH | PROOF | NOTES |
| --- | --- | --- | --- | --- |
| intro / section title/description | GENERATE / IMPROVE | — | — | Copy only |
| field label / help / placeholder / options text | GENERATE / IMPROVE | — | — | |
| **field.id / section.id / showWhenAny** | **PROTECTED** | — | — | Persistence contracts |
| core flag | HUMAN_ONLY / SUGGEST | — | — | Completeness logic |

---

## RESOURCE — TOOL

| FIELD / PAYLOAD | AI ACTION | RESEARCH | PROOF | NOTES |
| --- | --- | --- | --- | --- |
| ToolContent intro/title/description | GENERATE / IMPROVE | — | — | CMS payload copy |
| Question/option wording (if ever editable) | IMPROVE | — | — | |
| **question/option ids, weights, signals, showWhen** | **PROTECTED** | — | — | File engine `platform-selector` |
| Scoring logic | PROTECTED | — | — | Separate deliberate system |

---

## HOMEPAGE (`HomepageContent`)

| FIELD | AI ACTION | RESEARCH | PROOF | NOTES |
| --- | --- | --- | --- | --- |
| hero* / CTAs | GENERATE / IMPROVE | — | Brand Voice | Live save risk |
| sections JSON / visibility | IMPROVE / SUGGEST | — | No fake trust stats | Careful |
| curatedServiceItems / curatedTestimonialIds | SUGGEST | Internal | Verify IDs | |
| SEO | GENERATE | — | — | |
| id / updatedAt / updatedById | SYSTEM | — | — | Singleton `home` |

---

## Classification reminder

- **AI_CAN_GENERATE** — empty eligible fields / new drafts  
- **AI_CAN_IMPROVE** — propose rewrite of existing prose  
- **AI_CAN_SUGGEST** — titles, slugs, relations, taxonomy — human accepts  
- **PROTECTED / HUMAN_ONLY** — verification, publish, IDs, quotes, metrics, scoring  
- **SYSTEM_ONLY** — ids, timestamps, audit
