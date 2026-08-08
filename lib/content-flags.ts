/**
 * Content publishing helpers.
 * Draft content stays in data files but is hidden unless explicitly published.
 */
export const showDraftContent =
  process.env.NEXT_PUBLIC_SHOW_DRAFT_CONTENT === "true";
