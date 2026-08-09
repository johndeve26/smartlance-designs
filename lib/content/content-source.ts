/**
 * Shared CMS content authority — same rules as Work (Phase 2/3 marker probe).
 * Use for Homepage editorial sections and any DB-first public loader.
 */
export {
  resolveWorkContentRuntime as resolveCmsContentRuntime,
  WorkDatabaseUnavailableError as CmsDatabaseUnavailableError,
  type WorkContentRuntime as CmsContentRuntime,
} from "@/lib/content/work-source";
