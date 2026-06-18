/**
 * Provider factory — env-gated with safe mock fallback.
 *
 * If credentials are present the real providers are used; otherwise no-op mocks
 * are returned and the pipeline behaves exactly as in steps 1–2 (local executor
 * write + simulated branch/preview). This means NOTHING outward-facing happens
 * unless the operator explicitly configures tokens.
 *
 * Env:
 *   GITHUB_TOKEN, GITHUB_REPO ("owner/name"), GITHUB_DEFAULT_BRANCH (opt, "main")
 *   NETLIFY_SITE_NAME (optional): the Netlify subdomain. Now falls back to
 *     Netlify's built-in SITE_NAME / URL vars, which are injected automatically
 *     in every build and function context — so it usually needs no manual setup.
 */
import { GitHubProvider } from "./github";
import { NetlifyProvider } from "./netlify";
import type { DeployProvider, GitProvider, PullRequestInfo } from "./types";

class MockGitProvider implements GitProvider {
  readonly enabled = false;
  readonly name = "mock-git";
  async createBranchWithCommit(): Promise<void> {}
  async openPullRequest(branch: string): Promise<PullRequestInfo> {
    return { number: 0, url: "", branch };
  }
  async mergePullRequest(): Promise<void> {}
  async closePullRequest(): Promise<void> {}
}

class MockDeployProvider implements DeployProvider {
  readonly enabled = false;
  readonly name = "mock-deploy";
  previewUrlForBranch(): string {
    return "";
  }
}

export function getGitProvider(): GitProvider {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (token && repo) {
    return new GitHubProvider(token, repo, process.env.GITHUB_DEFAULT_BRANCH || "main");
  }
  return new MockGitProvider();
}

export function getDeployProvider(): DeployProvider {
  // Resolve the Netlify subdomain from, in order: an explicit override, then
  // Netlify's built-in vars (SITE_NAME / URL). Each value is normalised down to
  // the bare subdomain, so a full URL pasted into NETLIFY_SITE_NAME still works.
  const site =
    normalizeSiteName(process.env.NETLIFY_SITE_NAME) ||
    normalizeSiteName(process.env.SITE_NAME) ||
    siteNameFromUrl(process.env.URL);
  if (site) return new NetlifyProvider(site);
  return new MockDeployProvider();
}

// Reduce any value to a bare Netlify subdomain. "voicecms" stays "voicecms";
// "https://voicecms.netlify.app/" and "voicecms.netlify.app" become "voicecms".
function normalizeSiteName(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;
  if (!/[/.:]/.test(v)) return v; // already a bare subdomain
  return siteNameFromUrl(v.includes("://") ? v : `https://${v}`);
}

// Pull the Netlify subdomain out of a full site URL, e.g.
// "https://voicecms.netlify.app" -> "voicecms". Also handles the deploy-preview
// form ("...--voicecms.netlify.app"). Returns undefined for a custom domain
// (no ".netlify.app"), so the caller falls through.
function siteNameFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    if (!host.endsWith(".netlify.app")) return undefined;
    const sub = host.slice(0, -".netlify.app".length);
    return sub.includes("--") ? sub.split("--").pop() : sub;
  } catch {
    return undefined;
  }
}
