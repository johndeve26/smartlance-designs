"use client";

import { trackEvent } from "@/lib/analytics";

type TrackedMailtoProps = {
  email: string;
  className?: string;
};

export function TrackedMailto({ email, className }: TrackedMailtoProps) {
  return (
    <a
      href={`mailto:${email}`}
      className={className}
      onClick={() => trackEvent("email_clicked")}
    >
      {email}
    </a>
  );
}

type TrackedTelProps = {
  phone: string;
  className?: string;
};

export function TrackedTel({ phone, className }: TrackedTelProps) {
  return (
    <a
      href={`tel:${phone}`}
      className={className}
      onClick={() => trackEvent("phone_clicked")}
    >
      {phone}
    </a>
  );
}

type TrackedWhatsAppProps = {
  number: string;
  className?: string;
  children: React.ReactNode;
};

export function TrackedWhatsApp({
  number,
  className,
  children,
}: TrackedWhatsAppProps) {
  return (
    <a
      href={`https://wa.me/${number.replace(/\D/g, "")}`}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("whatsapp_clicked")}
    >
      {children}
    </a>
  );
}
