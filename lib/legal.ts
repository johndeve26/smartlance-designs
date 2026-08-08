import fs from "node:fs";
import path from "node:path";

const legalDirectory = path.join(process.cwd(), "content/legal");

export type LegalPage = {
  slug: string;
  title: string;
  content: string;
};

const titles: Record<string, string> = {
  "terms-and-condition": "Terms and Conditions",
  "privacy-statement": "Privacy Statement",
  "accessibility-statement": "Accessibility Statement",
};

export function getLegalSlugs() {
  if (!fs.existsSync(legalDirectory)) return [];
  return fs
    .readdirSync(legalDirectory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getLegalPage(slug: string): LegalPage | null {
  const filePath = path.join(legalDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split("\n");
  let title = titles[slug] ?? slug;
  let start = 0;
  if (lines[0]?.startsWith("# ")) {
    title = lines[0].replace(/^#\s+/, "").trim();
    start = 1;
  }
  const content = lines.slice(start).join("\n").trim();
  return { slug, title, content };
}

export function getAllLegalPages() {
  return getLegalSlugs()
    .map((slug) => getLegalPage(slug))
    .filter((page): page is LegalPage => Boolean(page));
}
