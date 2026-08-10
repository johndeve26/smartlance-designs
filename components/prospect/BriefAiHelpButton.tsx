"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type BriefContextRow = {
  fieldId: string;
  label: string;
  value: string;
};

type Props = {
  fieldId: string;
  fieldLabel: string;
  currentValue: string;
  fieldHelp?: string;
  fieldPlaceholder?: string;
  sectionTitle?: string;
  briefContext?: BriefContextRow[];
  onApply: (value: string) => void;
};

type SuggestionResult = {
  suggestion: string;
  rationale?: string;
  openQuestions?: string[];
};

export function BriefAiHelpButton({
  fieldId,
  fieldLabel,
  currentValue,
  fieldHelp,
  fieldPlaceholder,
  sectionTitle,
  briefContext,
  onApply,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasStartingText = useMemo(
    () => Boolean(currentValue.trim() || notes.trim()),
    [currentValue, notes],
  );

  async function generate() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/prospect/briefs/ai/improve-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId,
          fieldLabel,
          currentValue,
          roughNotes: notes || undefined,
          fieldHelp,
          fieldPlaceholder,
          sectionTitle,
          briefContext,
        }),
      });
      const data = (await res.json()) as SuggestionResult & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Could not generate a suggestion.");
        return;
      }
      if (data.suggestion) {
        setResult({
          suggestion: data.suggestion,
          rationale: data.rationale,
          openQuestions: data.openQuestions,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-medium text-accent-text hover:underline"
      >
        Help me write this
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-dashed border-border bg-surface-muted p-3">
      <p className="text-xs font-medium text-muted">Improve this answer</p>
      <p className="mt-1 text-xs leading-relaxed text-subtle">
        {hasStartingText
          ? "Add rough notes or use what you typed above. We'll expand it into a clearer draft you can edit."
          : "Describe what you're thinking in rough notes, or leave blank for a structured starting draft."}
      </p>
      <Textarea
        rows={2}
        placeholder="Rough notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mt-2"
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : "Get suggestion"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="mt-3 rounded-md border border-border bg-surface p-3">
          <p className="text-xs font-medium text-subtle">Suggested wording</p>
          {result.rationale ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">{result.rationale}</p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{result.suggestion}</p>
          {result.openQuestions && result.openQuestions.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs font-medium text-subtle">Fill in next</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted">
                {result.openQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onApply(result.suggestion);
                setResult(null);
                setOpen(false);
              }}
            >
              Use suggestion
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setResult(null)}>
              Keep mine
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
