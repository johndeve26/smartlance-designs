/** JS mirror of CSS design tokens for programmatic use. */

export const brand = {
  orange: "#f47a48",
  dark: "#535353",
  white: "#ffffff",
  warmNeutral: "#faf9f7",
} as const;

export const nav = {
  sidebarWidth: "15rem",
  sidebarCollapsed: "4rem",
  topbarHeight: "3.5rem",
  mobileBottom: "4rem",
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.625rem",
  lg: "0.875rem",
  xl: "1.125rem",
} as const;

export const statusTones = [
  "neutral",
  "info",
  "success",
  "warning",
  "danger",
  "active",
] as const;

export type StatusTone = (typeof statusTones)[number];

export const statusToneClasses: Record<
  StatusTone,
  { bg: string; text: string; border?: string }
> = {
  neutral: {
    bg: "bg-surface-muted",
    text: "text-foreground",
  },
  info: {
    bg: "bg-info-soft",
    text: "text-info",
  },
  success: {
    bg: "bg-success-soft",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning-soft",
    text: "text-warning",
  },
  danger: {
    bg: "bg-error-soft",
    text: "text-error",
  },
  active: {
    bg: "bg-brand-soft",
    text: "text-accent-text",
  },
};
