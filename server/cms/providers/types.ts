/**
 * Provider seams for the AI-CMS.
 *
 * The router talks to these interfaces, never to GitHub/Netlify directly. That
 * keeps the pipeline testable and lets a customer site swap implementations
 * (or run fully mocked) via environment variables. See ./index.ts for the
 * env-gated factory.
 */

export interface CommitFile {
  path: string;
  content: string;
}

export interface PullRequestInfo {
  number: number;
  url: string;
  branch: string;
}

export interface GitProvider {
  /** True when real credentials are configured; false ⇒ mock/no-op. */
  readonly enabled: boolean;
  readonly name: string;
  /** Create `branch` off the default branch and commit `files` onto it. */
  createBranchWithCommit(branch: string, files: CommitFile[], message: string): Promise<void>;
  /** Open a PR from `branch` into the default branch. */
  openPullRequest(branch: string, title: string, body?: string): Promise<PullRequestInfo>;
  /** Merge the PR (publishes to production via the host's auto-deploy). */
  mergePullRequest(prNumber: number): Promise<void>;
  /** Close the PR without merging (cancel). */
  closePullRequest(prNumber: number): Promise<void>;
}

export interface DeployProvider {
  readonly enabled: boolean;
  readonly name: string;
  /** Deterministic Deploy-Preview URL for a branch / PR. */
  previewUrlForBranch(branch: string, prNumber?: number): string;
}
