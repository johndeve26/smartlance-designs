"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  reviewConcernOptions,
  websiteReviewSchema,
  type WebsiteReviewValues,
} from "@/lib/validations";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialValues: WebsiteReviewValues = {
  name: "",
  email: "",
  website: "",
  mainConcern: "Not Sure",
  _gotcha: "",
  subscribeToUpdates: false,
};

export function WebsiteReviewForm({
  responseExpectation = siteConfig.responseExpectation,
}: {
  responseExpectation?: string;
}) {
  const [values, setValues] = useState<WebsiteReviewValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof WebsiteReviewValues, string>>
  >({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);

  function updateField<K extends keyof WebsiteReviewValues>(
    key: K,
    value: WebsiteReviewValues[K],
  ) {
    if (!started) {
      setStarted(true);
      trackEvent("contact_form_started", { form: "website-review" });
    }
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const parsed = websiteReviewSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof WebsiteReviewValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof WebsiteReviewValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus("error");
      setMessage("Please fix the highlighted fields.");
      return;
    }

    setErrors({});

    try {
      const response = await fetch("/api/website-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as { ok: boolean; message: string };

      if (!response.ok || !data.ok) {
        trackEvent("free_review_submit_error", { form: "website-review" });
        setStatus("error");
        setMessage(
          data.message ||
            `We could not save your request right now. Please email us at ${siteConfig.email} or try again shortly.`,
        );
        return;
      }

      trackEvent("free_review_submitted", { form: "website-review" });
      setStatus("success");
      setMessage(data.message);
      setValues(initialValues);
    } catch {
      trackEvent("free_review_submit_error", { form: "website-review" });
      setStatus("error");
      setMessage(
        `We could not save your request right now. Please email us at ${siteConfig.email} or try again shortly.`,
      );
    }
  }

  if (status === "success") {
    return (
      <div
        className="border border-success/20 bg-success-soft p-6"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">
          Request received
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
          Thanks — your website review request has been received.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We will review your site against the areas that matter most for your
          concern and follow up with practical notes. This is a focused review —
          not a full consulting engagement.
        </p>
        {responseExpectation ? (
          <p className="mt-3 text-sm text-muted">{responseExpectation}</p>
        ) : null}
        <ul className="mt-5 space-y-2 text-sm text-foreground">
          <li>— Watch your inbox for our reply</li>
          <li>— No obligation to book further work</li>
          <li>
            — Prefer to talk now?{" "}
            <a href="/contact" className="font-semibold text-accent-text underline">
              Get a quote
            </a>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative space-y-5"
      data-clarity-mask="true"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium">
            Name <span className="text-error">*</span>
          </label>
          <input
            id="review-name"
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputClass(errors.name)}
            autoComplete="name"
          />
          {errors.name ? <p className="mt-1.5 text-xs text-error">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="review-email" className="mb-1.5 block text-sm font-medium">
            Email <span className="text-error">*</span>
          </label>
          <input
            id="review-email"
            type="email"
            value={values.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={inputClass(errors.email)}
            autoComplete="email"
          />
          {errors.email ? <p className="mt-1.5 text-xs text-error">{errors.email}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="review-website" className="mb-1.5 block text-sm font-medium">
          Website URL <span className="text-error">*</span>
        </label>
        <input
          id="review-website"
          value={values.website}
          onChange={(e) => updateField("website", e.target.value)}
          className={inputClass(errors.website)}
          placeholder="https://yoursite.com"
          inputMode="url"
          autoComplete="url"
        />
        {errors.website ? (
          <p className="mt-1.5 text-xs text-error">{errors.website}</p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Main concern <span className="text-error">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {reviewConcernOptions.map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm",
                values.mainConcern === option
                  ? "border-accent-text bg-accent-soft"
                  : "border-border bg-surface",
              )}
            >
              <input
                type="radio"
                name="mainConcern"
                value={option}
                checked={values.mainConcern === option}
                onChange={() => updateField("mainConcern", option)}
                className="accent-[var(--color-accent)]"
              />
              {option}
            </label>
          ))}
        </div>
        {errors.mainConcern ? (
          <p className="mt-1.5 text-xs text-error">{errors.mainConcern}</p>
        ) : null}
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.subscribeToUpdates}
          onChange={(e) => updateField("subscribeToUpdates", e.target.checked)}
          className="mt-1"
        />
        <span>Send me occasional website, SEO and conversion insights.</span>
      </label>

      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="review-gotcha">Leave blank</label>
        <input
          id="review-gotcha"
          tabIndex={-1}
          autoComplete="off"
          value={values._gotcha}
          onChange={(e) => updateField("_gotcha", e.target.value)}
        />
      </div>

      {status === "error" && message ? (
        <p className="rounded-md border border-error/20 bg-error-soft px-4 py-3 text-sm text-error" role="alert">
          {message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={status === "loading"}>
        {status === "loading" ? "Submitting..." : "Request My Free Review"}
      </Button>
      <p className="text-sm leading-relaxed text-muted">
        We&apos;ll use the information you provide to respond to your review
        request.{" "}
        <Link
          href="/legal/privacy-statement"
          className="font-medium text-accent-text hover:underline"
        >
          Privacy
        </Link>
      </p>
    </form>
  );
}

function inputClass(error?: string) {
  return cn(
    "w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent",
    error ? "border-error" : "border-border",
  );
}
