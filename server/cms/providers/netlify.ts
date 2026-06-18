/**
 * Netlify deploy provider.
 *
 * Netlify automatically builds a Deploy Preview for every pull request and a
 * branch deploy for every pushed branch. Their URLs are deterministic, so we
 * construct them rather than poll the API:
 *   PR preview:     https://deploy-preview-<PR>--<site>.netlify.app
 *   branch deploy:  https://<branch-slug>--<site>.netlify.app
 *
 * Requires: NETLIFY_SITE_NAME (the site's Netlify subdomain, e.g. "the-garage").
 */
import type { DeployProvider } from "./types";

export class NetlifyProvider implements DeployProvider {
  readonly name = "netlify";
  readonly enabled = true;

  constructor(private readonly siteName: string) {}

  previewUrlForBranch(branch: string, prNumber?: number): string {
    if (prNumber && prNumber > 0) {
      return `https://deploy-preview-${prNumber}--${this.siteName}.netlify.app`;
    }
    const slug = branch.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase().slice(0, 37);
    return `https://${slug}--${this.siteName}.netlify.app`;
  }
}
