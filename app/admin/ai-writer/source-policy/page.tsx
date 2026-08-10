import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { getOrCreateSettings } from "@/lib/ai/editorial-service";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function SourcePolicyPage() {
  await requireAdminUser("use_ai_writer");
  const settings = await getOrCreateSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Source policy"
        description={
          <>
            <Link href="/admin/ai-writer" className="text-accent-text hover:underline">
              ← AI Writer
            </Link>
            <span className="mt-2 block">
              Editorial guidance for research — not mathematical truth. Prefer primary sources; never
              invent URLs. Topic Discovery uses the same source rules.
            </span>
          </>
        }
      />

      <AIWriterSubnav current="/admin/ai-writer/source-policy" />

      <AdminPanel>
        <article className="prose prose-sm max-w-none">
          <h2>Source hierarchy</h2>
          <ol>
            <li>Official / primary documentation</li>
            <li>Government / standards organizations</li>
            <li>Original research</li>
            <li>Highly reputable industry publications</li>
            <li>Expert secondary sources</li>
            <li>Community discussion when experience/opinion is relevant</li>
          </ol>
          <h2>Competitor content</h2>
          <p>
            May inform topic coverage and gaps. Do not copy structure mechanically, rewrite
            paragraph-by-paragraph, or reproduce proprietary examples.
          </p>
          <h2>Copyright</h2>
          <p>
            Store metadata, short snippets where terms allow, and AI research notes — not complete
            copyrighted articles.
          </p>
          <h2>Claims</h2>
          <p>
            Unsupported factual claims (especially numbers) must be sourced, rewritten, removed, or
            marked as editorial opinion before CMS approval.
          </p>
          <h2>Admin notes</h2>
          <pre className="whitespace-pre-wrap text-xs">
            {settings.sourcePolicyNotes || "(Configure notes in AI Writer settings.)"}
          </pre>
          <p>
            Full policy: <code>AI_SOURCE_POLICY.md</code>
          </p>
        </article>
      </AdminPanel>
    </div>
  );
}
