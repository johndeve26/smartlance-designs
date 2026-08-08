/**
 * Read-only production smoke checks.
 * Does not mutate data. Pass BASE_URL (default http://127.0.0.1:3000).
 *
 *   BASE_URL=https://smartlancedesigns.com npm run smoke:public
 */
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

const CRITICAL_GET = [
  "/",
  "/services",
  "/solutions",
  "/platforms",
  "/industries",
  "/work",
  "/blog",
  "/resources",
  "/pricing",
  "/project-planner",
  "/free-website-review",
  "/contact",
  "/about",
  "/admin/login",
  "/sitemap.xml",
  "/robots.txt",
];

async function check(path: string, expect: number | number[] = 200) {
  const url = `${BASE}${path}`;
  const allowed = Array.isArray(expect) ? expect : [expect];
  try {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { Accept: "text/html,application/xml,text/plain,*/*" },
    });
    const ok = allowed.includes(res.status);
    return {
      path,
      status: res.status,
      ok,
      location: res.headers.get("location"),
    };
  } catch (err) {
    return {
      path,
      status: 0,
      ok: false,
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

async function main() {
  console.log(`Smoke against ${BASE}`);
  const results = [];
  for (const path of CRITICAL_GET) {
    results.push(await check(path, [200, 301, 302, 308]));
  }

  results.push(await check("/this-route-should-404-xyz", [404]));
  results.push(await check("/admin", [301, 302, 307, 308]));

  const sitemap = await fetch(`${BASE}/sitemap.xml`);
  const sitemapText = sitemap.ok ? await sitemap.text() : "";
  const sitemapOk =
    sitemap.ok &&
    !sitemapText.includes("/admin") &&
    !/localhost/i.test(sitemapText);

  const robots = await fetch(`${BASE}/robots.txt`);
  const robotsText = robots.ok ? await robots.text() : "";

  let failed = results.filter((r) => !r.ok).length;
  if (!sitemapOk) {
    failed += 1;
    console.error("FAIL sitemap: missing, contains /admin, or localhost URLs");
  } else {
    console.log("OK sitemap (no /admin, no localhost)");
  }
  if (!robots.ok) {
    failed += 1;
    console.error("FAIL robots.txt");
  } else {
    console.log("OK robots.txt", robotsText.slice(0, 80).replace(/\n/g, " "));
  }

  for (const r of results) {
    console.log(`${r.ok ? "OK" : "FAIL"} ${r.status} ${r.path}${r.location ? ` → ${r.location}` : ""}`);
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll read-only smoke checks passed");
}

main();
