"use client";

import { useId, useState, type FormEvent } from "react";
import { subscribeFormSchema } from "@/lib/audience/schema";
import { AUDIENCE_CONSENT_TEXT } from "@/lib/audience/constants";
import type { SubscriberSourceValue } from "@/lib/audience/schema";
import { cn } from "@/lib/utils";

type SubscribeFormProps = {
  source: SubscriberSourceValue;
  sourceUrl?: string;
  variant?: "default" | "footer" | "compact";
  className?: string;
  disabled?: boolean;
};

export function SubscribeForm({
  source,
  sourceUrl,
  variant = "default",
  className,
  disabled = false,
}: SubscribeFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const statusId = useId();
  const isFooter = variant === "footer";
  const isCompact = variant === "compact" || isFooter;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading" || disabled) return;

    setStatus("loading");
    setMessage("");

    const payload = {
      name,
      email,
      source,
      sourceUrl: sourceUrl || "",
      _gotcha: "",
    };

    const parsed = subscribeFormSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(data.message || "Thanks — check your inbox to confirm your subscription.");
      setName("");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  const inputClass = cn(
    "w-full rounded-[0.5rem] border px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2",
    isFooter
      ? "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/40 focus-visible:ring-offset-surface-dark"
      : "border-border bg-white text-foreground placeholder:text-muted focus-visible:ring-accent/30 focus-visible:ring-offset-background",
  );

  const labelClass = cn(
    "block text-sm font-medium",
    isFooter ? "text-white/90" : "text-foreground",
  );

  return (
    <form
      className={cn("space-y-3", className)}
      onSubmit={onSubmit}
      noValidate
    >
      <div
        className={cn(
          isCompact ? "grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]" : "space-y-3",
        )}
      >
        <label className={labelClass}>
          <span className="sr-only">Name (optional)</span>
          {!isCompact ? <span className="mb-1 block">Name (optional)</span> : null}
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            disabled={disabled || status === "loading"}
            className={inputClass}
            maxLength={120}
          />
        </label>
        <label className={labelClass}>
          <span className="sr-only">Email address</span>
          {!isCompact ? <span className="mb-1 block">Email address</span> : null}
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            disabled={disabled || status === "loading"}
            className={inputClass}
            maxLength={254}
          />
        </label>
        <div className={cn(isCompact ? "sm:self-end" : undefined)}>
          <button
            type="submit"
            disabled={disabled || status === "loading"}
            className={cn(
              "inline-flex h-[42px] w-full items-center justify-center rounded-[0.5rem] px-5 text-sm font-semibold transition-colors disabled:opacity-60",
              isFooter
                ? "bg-cta text-cta-foreground hover:bg-cta-hover"
                : "bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          >
            {status === "loading" ? "Sending…" : "Get updates"}
          </button>
        </div>
      </div>

      <p
        className={cn(
          "text-xs leading-relaxed",
          isFooter ? "text-white/55" : "text-muted",
        )}
      >
        {AUDIENCE_CONSENT_TEXT}
      </p>

      <div
        id={statusId}
        role="status"
        aria-live="polite"
        className={cn(
          "text-sm",
          status === "error" ? "text-red-600" : isFooter ? "text-white/80" : "text-muted",
        )}
      >
        {message}
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
    </form>
  );
}
