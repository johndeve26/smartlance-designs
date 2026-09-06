import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media/urls";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function textFromChildren(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join("");
  if (children && typeof children === "object" && "props" in children) {
    return textFromChildren(
      (children as { props?: { children?: ReactNode } }).props?.children,
    );
  }
  return "";
}

const CALLOUT_LABELS = [
  "Key takeaway",
  "Tip",
  "Important",
  "Example",
] as const;

function parseCallout(text: string): { label: string; body: string } | null {
  for (const label of CALLOUT_LABELS) {
    const re = new RegExp(`^${label}\\s*[:—-]\\s*(.+)$`, "i");
    const match = text.trim().match(re);
    if (match) {
      return { label, body: match[1].trim() };
    }
  }
  return null;
}

function shouldBreakoutImage(src: string) {
  let hash = 0;
  for (let i = 0; i < src.length; i += 1) {
    hash = (hash * 31 + src.charCodeAt(i)) >>> 0;
  }
  return hash % 4 === 1;
}

function isSafeContentHref(href: string) {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("#")) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:";
  } catch {
    return false;
  }
}

function isSafeContentImageSrc(src: string) {
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function BlogMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => {
          const text = textFromChildren(children);
          const id = slugify(text);
          return (
            <h2 id={id} className="scroll-mt-28">
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const text = textFromChildren(children);
          const id = slugify(text);
          return (
            <h3 id={id} className="scroll-mt-28">
              {children}
            </h3>
          );
        },
        a: ({ href, children }) => {
          if (!href || !isSafeContentHref(href)) return <span>{children}</span>;
          const external = /^https?:\/\//i.test(href) || href.startsWith("mailto:");
          if (external) {
            return (
              <a
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              >
                {children}
              </a>
            );
          }
          return <Link href={href}>{children}</Link>;
        },
        img: ({ src, alt }) => {
          if (!src || typeof src !== "string" || !isSafeContentImageSrc(src)) {
            return null;
          }
          const resolved = resolveMediaUrl(src);
          const breakout = shouldBreakoutImage(src);
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolved}
              alt={alt || ""}
              className={
                breakout
                  ? "article-image-breakout h-auto rounded-xl border border-border"
                  : "h-auto w-full rounded-xl border border-border"
              }
              loading="lazy"
            />
          );
        },
        blockquote: ({ children }) => {
          const text = textFromChildren(children);
          const callout = parseCallout(text);
          if (callout) {
            return (
              <aside className="article-callout" aria-label={callout.label}>
                <p className="article-callout__label">{callout.label}</p>
                <p className="article-callout__body">{callout.body}</p>
              </aside>
            );
          }
          return (
            <blockquote className="border-l-2 border-accent pl-5 text-xl font-medium leading-snug text-foreground not-italic sm:text-2xl">
              {children}
            </blockquote>
          );
        },
        table: ({ children }) => (
          <div className="my-8 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[28rem] border-collapse">
              {children}
            </table>
          </div>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
