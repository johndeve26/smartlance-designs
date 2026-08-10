"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REVIEW_GOAL_OPTIONS } from "@/lib/prospect/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function InteractiveWebsiteReviewForm() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [focusNote, setFocusNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGoal(value: string) {
    setGoals((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/prospect/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl, businessName, goals, focusNote }),
      });
      const data = (await res.json()) as { reviewId?: string; error?: string };
      if (!res.ok || !data.reviewId) {
        setError(data.error ?? "Could not start review.");
        return;
      }
      router.push(`/free-website-review/${data.reviewId}`);
    } catch {
      setError("Could not start review. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="websiteUrl"
        label="Website"
        required
        placeholder="example.com"
        value={websiteUrl}
        onChange={(e) => setWebsiteUrl(e.target.value)}
      />

      <fieldset>
        <legend className="text-label mb-2 block">
          What do you want to improve?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {REVIEW_GOAL_OPTIONS.map((opt) => {
            const selected = goals.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleGoal(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  selected
                    ? "border-accent bg-brand-soft text-foreground"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:bg-surface-muted",
                )}
                aria-pressed={selected}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Input
        id="businessName"
        label="Business name"
        optional
        placeholder="Optional"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
      />

      <Textarea
        id="focusNote"
        label="What should we focus on?"
        optional
        rows={3}
        placeholder="Any specific pages, concerns or context…"
        value={focusNote}
        onChange={(e) => setFocusNote(e.target.value)}
      />

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Starting review…" : "Review my website"}
      </Button>

      <p className="text-xs leading-relaxed text-subtle">
        We review publicly accessible website pages only. No login or website
        password required.
      </p>

      <p className="border-t border-border pt-4 text-xs text-muted">
        Prefer a human review from Smartlance?{" "}
        <Link href="/free-website-review#human-review" className="font-medium text-accent-text hover:underline">
          Send your website to our team
        </Link>
        .
      </p>
    </form>
  );
}
