# Topic Intelligence Evaluation

How to calibrate editorial decisions without confusing signal volume with judgement.

## Purpose

Topic Intelligence should answer:

- What should Smartlance **write** next?
- What should Smartlance **update**?
- What should Smartlance **not** write?

Gold labels are for **evaluation and deliberate prompt tuning**, not automatic retraining.

## Prompt versions

Tracked separately in `PROMPT_VERSIONS` / `TOPIC_INTELLIGENCE_PROMPT_VERSIONS`:

- `topic-discovery:v1`
- `opportunity-analysis:v1`
- `signal-clustering:v1`

When changing analysis or clustering logic, bump the relevant version and re-run the gold set.

## Gold set

Location: `lib/ai/topic-intelligence/calibration/fixtures.ts`

- ~30–50 training fixtures
- ~20–30% holdout in `TOPIC_CALIBRATION_HOLDOUT`
- Categories include design, development, SEO, conversion, performance, ecommerce, platforms, local, hospitality, real estate, professional services, industry news, format boundaries, duplicates, and deliberately bad ideas

Each fixture may include:

- `expectedDecisions` (one or more acceptable labels)
- `expectedFormat`
- `contentFamily` / `businessRelationship`
- human `reason`
- `mockSignals` (offline only)

## How to run

### Automated (CI / local)

```bash
npx vitest run tests/ai/topic-intelligence-calibration.test.ts
```

Suite runner:

```ts
import { runTopicCalibrationSuite } from "@/lib/ai/topic-intelligence/calibration/evaluate";
const result = runTopicCalibrationSuite({ includeHoldout: false });
```

### Admin

`/admin/ai-writer/evaluations` → **Topic Intelligence calibration**

- Live diagnostic table (no paid APIs)
- **Save calibration snapshot**
- **Save with holdout** only after tuning

## Decision labels

| Label | Meaning |
| --- | --- |
| WRITE_NEW | New editorial URL (usually Insight) |
| UPDATE_EXISTING | Refresh existing Insight |
| EXPAND_EXISTING_RESOURCE | Guide / Comparison / Checklist / Glossary |
| SUPPORT_COMMERCIAL_PAGE | New/support content tied to Service/Solution/Platform |
| UPDATE_*_PAGE | Fix the commercial page itself |
| MONITOR | Too early / weak evidence |
| IGNORE | Do not pursue |
| MULTIPLE_ACCEPTABLE | Human accepts any of the listed decisions |

## Evaluation dimensions (no master score)

Report separately:

1. Recommendation quality  
2. Cannibalization detection  
3. Format selection  
4. Audience relevance  
5. Business relevance  
6. Unique value  
7. Source quality  
8. Timeliness  
9. Commercial relationship  
10. Content balance  
11. Reasoning quality  

## Confusion matrix

Buckets are diagnostic, not mathematical truth. Example:

`Expected WRITE_OR_SUPPORT → actual UPDATE_OR_EXPAND`

Treat **WRITE NEW when human expected UPDATE/IGNORE** as serious false positives (content bloat).

Treat strong opportunities incorrectly **IGNORE**/`MONITOR` as false negatives — do not over-tune toward conservatism.

## Holdout process

1. Tune against training fixtures only  
2. Change prompt/version  
3. Re-run training suite  
4. Run holdout once  
5. Document deltas in the pilot report  

Do not overfit to exact fixture wording.

## Comparing model / prompt changes

1. Record previous snapshot notes (`matches=… fpWrite=…`)  
2. Apply change + version bump  
3. Re-run suite  
4. Diff mismatches list in snapshot `dimensions.mismatches`  
5. Prefer fewer false WRITE positives and stable format matches over raw match rate alone  

## Provider / model changes

If the discovery AI model changes, re-run calibration. A stronger writing model is not automatically better at topic decisions. Heuristic analysis (`opportunity-analysis:v1`) is the default offline path for this suite.

## What not to do

- Do not auto-mutate CMS relationships from discovery suggestions  
- Do not invent search volume or “trending %” without providers  
- Do not enable cron based only on fixture pass rate  
- Do not treat more opportunities as success  
