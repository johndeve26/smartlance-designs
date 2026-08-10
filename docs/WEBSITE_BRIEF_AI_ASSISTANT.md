# Website Brief AI Assistant

User-triggered only via `POST /api/prospect/briefs/ai/improve-field`.

## Actions

- Help me write this
- Suggest from Review (saved findings only)
- Explain section
- Missing fields / open questions
- Project summary

## Rules

- Suggestions never auto-persist
- No invented budget, timeline, audience, integrations
- Rate limited per IP and account

Prompt version: `prospect-brief-v2`

## Behaviour (v2)

- Sparse input → structured draft with `[placeholder]` hints, not a one-line rephrase
- Uses field help, placeholder, section title, and other brief answers for context
- Returns `openQuestions` so users know what to fill in next
