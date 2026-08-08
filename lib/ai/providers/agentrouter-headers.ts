/**
 * Agent Router (agentrouter.org) allowlists specific client fingerprints.
 * Bare Node/undici fetch is rejected with "unauthorized client detected".
 *
 * Headers match Agent Router’s documented Codex / Qwen Code style clients
 * (see agentrouter.org docs and community OpenAI-compatible integrations).
 */
export function agentRouterClientHeaders(): Record<string, string> {
  const runtimeVersion = process.version.replace(/^v/, "") || "20.0.0";
  return {
    // Codex CLI fingerprint (documented Agent Router client)
    Originator: "codex_cli_rs",
    Version: "0.101.0",
    "User-Agent": "codex_cli_rs/0.101.0 (Mac OS 26.0.1; arm64) Apple_Terminal/464",
    // OpenAI Node SDK stainless markers (also accepted on some edges)
    "x-stainless-lang": "js",
    "x-stainless-package-version": "4.104.0",
    "x-stainless-os": "MacOS",
    "x-stainless-arch": "arm64",
    "x-stainless-runtime": "node",
    "x-stainless-runtime-version": runtimeVersion,
  };
}
