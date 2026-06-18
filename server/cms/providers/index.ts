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
 *   NETLIFY_SITE_NAME (the Netlify subdomain)
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
  const site = process.env.NETLIFY_SITE_NAME;
  if (site) return new NetlifyProvider(site);
  return new MockDeployProvider();
}
