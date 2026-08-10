# Proposal Versioning

- Each proposal has sequential versions: V1, V2, … (`@@unique([proposalId, versionNumber])`).
- **Draft** versions (`publishedAt = null`) are editable.
- **Sent** versions (`publishedAt` set on send) are **immutable**.
- Client changes → admin creates a **new version** copied from the prior sent version.
- Only the **latest published version** can receive accept / decline / change requests.
- Older sent versions may be viewed as historical (**superseded**).

Services: `lib/proposals/versions.ts`, `lib/proposals/status.ts`.
