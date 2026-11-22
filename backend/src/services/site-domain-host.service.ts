import { promises as dns } from 'dns';
import { Service } from 'typedi';
import { dnsState, DnsState } from '@/domain/site-domain';
import { logger } from '@/utils/logger';

/**
 * The two outside worlds of a parking's own domain: the DNS (does the name point to Plazo?) and the hosting (is the
 * name attached to the project, with its certificate?). With VERCEL_DOMAINS_TOKEN the name is attached by Plazo itself;
 * without it the platform attaches it by hand and marks it done.
 */
@Service()
export class SiteDomainHostService {
  public settings = {
    token: process.env.VERCEL_DOMAINS_TOKEN?.trim() || '',
    project: process.env.VERCEL_DOMAINS_PROJECT?.trim() || process.env.VERCEL_PROJECT_ID?.trim() || '',
    team: process.env.VERCEL_DOMAINS_TEAM?.trim() || process.env.VERCEL_TEAM_ID?.trim() || '',
  };

  public get automatic(): boolean {
    return !!this.settings.token && !!this.settings.project;
  }

  public async dns(domain: string): Promise<DnsState> {
    const [cname, a] = await Promise.all([dns.resolveCname(domain).catch(() => [] as string[]), dns.resolve4(domain).catch(() => [] as string[])]);
    return dnsState(domain, { cname, a });
  }

  private async call(method: string, path: string, body?: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
    const url = new URL(`https://api.vercel.com${path}`);
    if (this.settings.team) url.searchParams.set('teamId', this.settings.team);
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${this.settings.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, json };
  }

  /**
   * Attach the name to the project (idempotent) and say whether it serves: 'active', 'not_attached' (waiting for its
   * DNS at the hosting's end) or 'host_error' (refused: taken by another project, limit of the plan…).
   */
  public async attach(domain: string): Promise<'active' | 'not_attached' | 'host_error'> {
    if (!this.automatic) return 'not_attached';
    try {
      const project = encodeURIComponent(this.settings.project);
      const added = await this.call('POST', `/v10/projects/${project}/domains`, { name: domain });
      const code = (added.json.error as { code?: string } | undefined)?.code;
      // Already on this project: fine. Anything else refused is the hosting's no.
      if (added.status >= 400 && code !== 'domain_already_in_use' && code !== 'domain_already_exists') {
        logger.warn(`[SiteDomain] Hosting refused a domain: ${added.status} ${code ?? ''}`);
        return 'host_error';
      }
      const config = await this.call('GET', `/v6/domains/${encodeURIComponent(domain)}/config`);
      if (config.status >= 400) return 'not_attached';
      return config.json.misconfigured === false ? 'active' : 'not_attached';
    } catch (error) {
      logger.warn(`[SiteDomain] Hosting call failed: ${error instanceof Error ? error.name : 'error'}`);
      return 'host_error';
    }
  }

  public async detach(domain: string): Promise<void> {
    if (!this.automatic) return;
    try {
      await this.call('DELETE', `/v9/projects/${encodeURIComponent(this.settings.project)}/domains/${encodeURIComponent(domain)}`);
    } catch {
      // Left attached: harmless (the name no longer opens a site), the platform can remove it by hand.
    }
  }
}
