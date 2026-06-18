/**
 * Real GitHub provider using the REST API over fetch (Node 20+ global fetch).
 *
 * Commits happen entirely through the API (Git Refs + Contents endpoints), so
 * the server never touches a local working tree or switches branches — ideal
 * for a shared, multi-tenant backend where each customer maps to a repo.
 *
 * Requires: GITHUB_TOKEN (repo scope) + GITHUB_REPO ("owner/name").
 */
import type { CommitFile, GitProvider, PullRequestInfo } from "./types";

const API = "https://api.github.com";

export class GitHubProvider implements GitProvider {
  readonly name = "github";
  readonly enabled = true;
  private readonly owner: string;
  private readonly repo: string;

  constructor(
    private readonly token: string,
    repoFullName: string,
    private readonly base = "main"
  ) {
    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) {
      throw new Error(`GITHUB_REPO must be "owner/name", got "${repoFullName}".`);
    }
    this.owner = owner;
    this.repo = repo;
  }

  private async gh<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GitHub ${init?.method ?? "GET"} ${path} → ${res.status}: ${body}`);
    }
    return (await res.json().catch(() => ({}))) as T;
  }

  private repoPath(suffix: string): string {
    return `/repos/${this.owner}/${this.repo}${suffix}`;
  }

  private encodePath(p: string): string {
    return p.split("/").map(encodeURIComponent).join("/");
  }

  async createBranchWithCommit(branch: string, files: CommitFile[], message: string): Promise<void> {
    // 1. base branch tip
    const ref = await this.gh<{ object: { sha: string } }>(
      this.repoPath(`/git/ref/heads/${this.base}`)
    );
    // 2. create the new branch
    await this.gh(this.repoPath(`/git/refs`), {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }),
    });
    // 3. commit each file via the Contents API
    for (const file of files) {
      let sha: string | undefined;
      try {
        const existing = await this.gh<{ sha: string }>(
          this.repoPath(`/contents/${this.encodePath(file.path)}?ref=${branch}`)
        );
        sha = existing.sha;
      } catch {
        /* file does not exist yet on the branch */
      }
      // The Contents API expects base64. Binary files arrive already base64.
      const content =
        file.encoding === "base64"
          ? file.content
          : Buffer.from(file.content, "utf8").toString("base64");
      await this.gh(this.repoPath(`/contents/${this.encodePath(file.path)}`), {
        method: "PUT",
        body: JSON.stringify({
          message,
          content,
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
    }
  }

  async openPullRequest(branch: string, title: string, body = ""): Promise<PullRequestInfo> {
    const pr = await this.gh<{ number: number; html_url: string }>(
      this.repoPath(`/pulls`),
      {
        method: "POST",
        body: JSON.stringify({ title, head: branch, base: this.base, body }),
      }
    );
    return { number: pr.number, url: pr.html_url, branch };
  }

  async mergePullRequest(prNumber: number): Promise<void> {
    await this.gh(this.repoPath(`/pulls/${prNumber}/merge`), {
      method: "PUT",
      body: JSON.stringify({ merge_method: "squash" }),
    });
  }

  async closePullRequest(prNumber: number): Promise<void> {
    await this.gh(this.repoPath(`/pulls/${prNumber}`), {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" }),
    });
  }
}
