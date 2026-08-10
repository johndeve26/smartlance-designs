# Prospect Workspace

Routes under `/workspace` (authenticated, noindex):

- Home, Reviews, Briefs, Requests, Account
- Login: `/workspace/login`
- Magic link: `/workspace/auth/[token]`

## Home order

1. Continue review/brief
2. Active request / proposal ready
3. Recent lists (no KPI dashboard)

## Client promotion

When project grants exist: "Open Client Portal" → `/portal` (same session cookie).
