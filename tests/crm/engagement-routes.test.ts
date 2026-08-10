import { describe, expect, it } from "vitest";
import { GET as clickGet } from "@/app/t/c/[token]/route";
import { GET as openGet } from "@/app/t/o/[token]/route";

describe("engagement public routes", () => {
  it("click route rejects invalid token without redirect", async () => {
    const res = await clickGet(
      new Request("http://localhost/t/c/not-a-real-token"),
      { params: Promise.resolve({ token: "not-a-real-token" }) },
    );
    expect(res.status).toBe(404);
    expect(res.headers.get("location")).toBeNull();
  });

  it("click route ignores arbitrary url query param", async () => {
    const res = await clickGet(
      new Request("http://localhost/t/c/bad?url=https://evil.example"),
      { params: Promise.resolve({ token: "bad" }) },
    );
    expect(res.status).toBe(404);
    const location = res.headers.get("location");
    expect(location == null || !location.includes("evil.example")).toBe(true);
  });

  it("open pixel returns harmless gif even for unknown token", async () => {
    const res = await openGet(
      new Request("http://localhost/t/o/bad"),
      { params: Promise.resolve({ token: "bad" }) },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/gif");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});
