"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  budgetOptions,
  contactFormSchema,
  contactServiceOptions,
  normalizeWebsiteUrl,
  referralSourceOptions,
  timelineOptions,
  type ContactFormValues,
} from "@/lib/validations";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialValues: ContactFormValues = {
  name: "",
  email: "",
  company: "",
  website: "",
  service: "",
  projectDetails: "",
  budget: "",
  timeline: "",
  referralSource: "",
  _gotcha: "",
};

export function ContactForm({
  responseExpectation = siteConfig.responseExpectation,
}: {
  responseExpectation?: string;
}) {
  const [values, setValues] = useState<ContactFormValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormValues, string>>
  >({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const formStatusId = useId();

  function updateField<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) {
    if (!started) {
      setStarted(true);
      trackEvent("contact_form_started", { form: "contact" });
    }
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    const payload = {
      ...values,
      website: normalizeWebsiteUrl(values.website || ""),
    };

    const parsed = contactFormSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ContactFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus("error");
      setMessage("Please fix the highlighted fields.");
      return;
    }

    setErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as { ok: boolean; message: string };

      if (!response.ok || !data.ok) {
        trackEvent("contact_form_submit_error", { form: "contact" });
        setStatus("error");
        setMessage(
          data.message ||
            `We couldn’t save your enquiry right now. Please try again or email us directly at ${siteConfig.email}.`,
        );
        return;
      }

      trackEvent("contact_form_submitted", { form: "contact" });
      setStatus("success");
      setMessage(data.message);
      setValues(initialValues);
    } catch {
      trackEvent("contact_form_submit_error", { form: "contact" });
      setStatus("error");
      setMessage(
        `We couldn’t save your enquiry right now. Please try again or email us directly at ${siteConfig.email}.`,
      );
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-xl bg-surface-muted px-5 py-8 sm:px-7 sm:py-10"
        role="status"
        aria-live="polite"
      >
        <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
          Enquiry received
        </p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Thanks — your message has been received.
        </h3>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-[1.0625rem]">
          We&apos;ll review your details and follow up with the most useful next
          step.
        </p>
        {responseExpectation ? (
          <p className="mt-3 text-base text-muted">
            {responseExpectation}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/work">View Our Work</Link>
          </Button>
        </div>
        <button
          type="button"
          className="mt-6 text-sm font-medium text-muted hover:text-accent-text hover:underline"
          onClick={() => {
            setStatus("idle");
            setMessage("");
          }}
        >
          Send another enquiry
        </button>
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
        <Field
          label="Name"
          htmlFor="name"
          required
          error={errors.name}
        >
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={inputClass(errors.name)}
          />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => updateField("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={inputClass(errors.email)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Company"
          htmlFor="company"
          optional
          error={errors.company}
        >
          <input
            id="company"
            name="company"
            autoComplete="organization"
            value={values.company}
            onChange={(e) => updateField("company", e.target.value)}
            className={inputClass(errors.company)}
          />
        </Field>
        <Field
          label="Website"
          htmlFor="website"
          optional
          error={errors.website}
        >
          <input
            id="website"
            name="website"
            inputMode="url"
            autoComplete="url"
            placeholder="https://yourwebsite.com"
            value={values.website}
            onChange={(e) => updateField("website", e.target.value)}
            onBlur={() =>
              updateField("website", normalizeWebsiteUrl(values.website || ""))
            }
            aria-invalid={Boolean(errors.website)}
            aria-describedby={errors.website ? "website-error" : undefined}
            className={inputClass(errors.website)}
          />
        </Field>
      </div>

      <Field label="Service" htmlFor="service" required error={errors.service}>
        <select
          id="service"
          name="service"
          value={values.service}
          onChange={(e) => updateField("service", e.target.value)}
          aria-invalid={Boolean(errors.service)}
          aria-describedby={errors.service ? "service-error" : undefined}
          className={inputClass(errors.service)}
        >
          <option value="">Select a service</option>
          {contactServiceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Project details"
        htmlFor="projectDetails"
        required
        error={errors.projectDetails}
        hint="Tell us what you want to build, improve or fix."
      >
        <textarea
          id="projectDetails"
          name="projectDetails"
          rows={6}
          value={values.projectDetails}
          onChange={(e) => updateField("projectDetails", e.target.value)}
          aria-invalid={Boolean(errors.projectDetails)}
          aria-describedby={
            errors.projectDetails
              ? "projectDetails-error"
              : "projectDetails-hint"
          }
          className={cn(inputClass(errors.projectDetails), "min-h-[10rem] resize-y")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Budget" htmlFor="budget" optional error={errors.budget}>
          <select
            id="budget"
            name="budget"
            value={values.budget}
            onChange={(e) => updateField("budget", e.target.value)}
            className={inputClass(errors.budget)}
          >
            <option value="">Select a range</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Timeline"
          htmlFor="timeline"
          optional
          error={errors.timeline}
        >
          <select
            id="timeline"
            name="timeline"
            value={values.timeline}
            onChange={(e) => updateField("timeline", e.target.value)}
            className={inputClass(errors.timeline)}
          >
            <option value="">Select a timeline</option>
            {timelineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="How did you hear about us?"
        htmlFor="referralSource"
        optional
        error={errors.referralSource}
      >
        <select
          id="referralSource"
          name="referralSource"
          value={values.referralSource}
          onChange={(e) => updateField("referralSource", e.target.value)}
          className={inputClass(errors.referralSource)}
        >
          <option value="">Select an option</option>
          {referralSourceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <div
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden
      >
        <label htmlFor="_gotcha">Leave blank</label>
        <input
          id="_gotcha"
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          value={values._gotcha}
          onChange={(e) => updateField("_gotcha", e.target.value)}
        />
      </div>

      <div
        id={formStatusId}
        aria-live="polite"
        className={cn(status === "error" && message ? "block" : "sr-only")}
      >
        {status === "error" && message ? (
          <p
            className="rounded-md border border-error/20 bg-error-soft px-4 py-3 text-sm text-error"
            role="alert"
          >
            {message}
          </p>
        ) : null}
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          size="lg"
          disabled={status === "loading"}
          className="w-full sm:w-auto"
        >
          {status === "loading" ? "Sending…" : "Send Project Enquiry"}
        </Button>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Your details are used to respond to your enquiry.{" "}
          <Link
            href="/legal/privacy-statement"
            className="font-medium text-accent-text hover:underline"
          >
            Privacy
          </Link>
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  optional,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;

  return (
    <div className="relative">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
        {required ? <span className="text-error"> *</span> : null}
        {optional ? (
          <span className="font-normal text-subtle"> (optional)</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function inputClass(error?: string) {
  return cn(
    "w-full rounded-md border bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-subtle focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 sm:text-[0.9375rem]",
    error ? "border-error" : "border-border",
  );
}
