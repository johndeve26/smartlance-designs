export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateServerEnv } = await import("@/lib/env");
  // During local/CI builds, log only. Hard-fail only on real Vercel production runtime.
  const hardFail = process.env.VERCEL_ENV === "production";
  const result = validateServerEnv({ throwOnError: hardFail });
  for (const issue of result.issues) {
    const line = `[env] ${issue.severity.toUpperCase()} ${issue.key}: ${issue.message}`;
    if (issue.severity === "error") {
      console.error(line);
    } else {
      console.warn(line);
    }
  }
}
