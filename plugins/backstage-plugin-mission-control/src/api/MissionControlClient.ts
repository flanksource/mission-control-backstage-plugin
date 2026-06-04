import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import {
  MissionControlApi,
  AuthConfig,
  MissionControlAuthError,
  ConfigItem,
  ConfigDetail,
  ConfigChange,
  RelatedConfig,
  HealthCheckSummary,
  CatalogSummary,
  PlaybookRun,
  PlaybookParam,
  RunnablePlaybook,
  PlaybookRunResponse,
  ConfigAccessSummary,
} from './types';

export class MissionControlClient implements MissionControlApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;
  private authConfigCache?: AuthConfig;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async backendBaseUrl(): Promise<string> {
    return this.discoveryApi.getBaseUrl('mission-control');
  }

  async getAuthConfig(): Promise<AuthConfig> {
    if (this.authConfigCache) return this.authConfigCache;
    const base = await this.backendBaseUrl();
    const response = await this.fetchApi.fetch(`${base}/auth/config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch auth config: ${response.status}`);
    }
    this.authConfigCache = (await response.json()) as AuthConfig;
    return this.authConfigCache;
  }

  private async fetchFromMC<T>(path: string, init?: RequestInit): Promise<T> {
    const authConfig = await this.getAuthConfig();

    let response: Response;
    if (authConfig.authMethod === 'pass-through') {
      try {
        response = await fetch(`${authConfig.baseUrl}${path}`, {
          ...init,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...init?.headers },
        });
      } catch {
        throw new MissionControlAuthError('Failed to fetch from Mission Control (CORS or network error)', 0);
      }
    } else {
      const base = await this.backendBaseUrl();
      response = await this.fetchApi.fetch(`${base}${path}`, init);
    }

    if (response.status === 401 || response.status === 403) {
      throw new MissionControlAuthError(
        `Authentication required: ${response.status} ${response.statusText}`,
        response.status,
      );
    }
    if (!response.ok) {
      throw new Error(`Mission Control API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  private async get<T>(path: string): Promise<T> {
    return this.fetchFromMC<T>(path);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.fetchFromMC<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async getConfigById(id: string): Promise<ConfigItem> {
    const items = await this.get<ConfigItem[]>(`/api/db/configs?id=eq.${id}`);
    if (!items.length) throw new Error(`Config not found: ${id}`);
    return items[0];
  }

  async getConfigsByIds(ids: string[]): Promise<ConfigItem[]> {
    return this.get<ConfigItem[]>(`/api/db/configs?id=in.(${ids.join(',')})`);
  }

  async getConfigDetail(id: string): Promise<ConfigDetail> {
    const items = await this.get<ConfigDetail[]>(`/api/db/config_detail?id=eq.${id}`);
    if (!items.length) throw new Error(`Config not found: ${id}`);
    return items[0];
  }

  async searchConfigs(query: { type?: string; name?: string }): Promise<ConfigItem[]> {
    return this.post<ConfigItem[]>('/api/resources/search', query);
  }

  async getRelatedConfigs(configId: string, depth: number): Promise<RelatedConfig[]> {
    return this.get<RelatedConfig[]>(
      `/api/db/rpc/related_configs_recursive?config_id=${configId}&max_depth=${depth}`,
    );
  }

  async getHealthChecksForConfig(configId: string): Promise<HealthCheckSummary[]> {
    return this.get<HealthCheckSummary[]>(
      `/api/db/check_summary_for_config?config_id=eq.${configId}`,
    );
  }

  async getChangesForConfig(configId: string): Promise<ConfigChange[]> {
    return this.get<ConfigChange[]>(
      `/api/db/config_changes?config_id=eq.${configId}&order=created_at.desc&limit=50`,
    );
  }

  async getPlaybookRunsForConfig(configId: string): Promise<PlaybookRun[]> {
    return this.get<PlaybookRun[]>(
      `/api/db/playbook_runs?config_id=eq.${configId}&order=created_at.desc&limit=50`,
    );
  }

  async getAccessSummaryForConfig(configId: string): Promise<ConfigAccessSummary[]> {
    return this.get<ConfigAccessSummary[]>(
      `/api/db/config_access_summary?config_id=eq.${configId}&limit=50`,
    );
  }

  async getCatalogSummary(configIds: string[]): Promise<CatalogSummary> {
    return this.post<CatalogSummary>('/api/catalog/summary', { configIds });
  }

  async getChanges(configIds: string[]): Promise<ConfigChange[]> {
    return this.post<ConfigChange[]>('/api/catalog/changes', { configIds });
  }

  async getPlaybooksForConfig(configId: string): Promise<RunnablePlaybook[]> {
    return this.get<RunnablePlaybook[]>(`/api/playbook/list?config_id=${configId}`);
  }

  async getPlaybookParams(playbookId: string, configId?: string): Promise<PlaybookParam[]> {
    const body: Record<string, string> = { id: playbookId };
    if (configId) body.config_id = configId;
    const result = await this.post<{ params: PlaybookParam[] }>(`/api/playbook/${playbookId}/params`, body);
    return result.params ?? [];
  }

  async submitPlaybookRun(playbookId: string, configId?: string, params?: Record<string, any>): Promise<PlaybookRunResponse> {
    const body: Record<string, any> = { id: playbookId };
    if (configId) body.config_id = configId;
    if (params) body.params = params;
    return this.post<PlaybookRunResponse>('/api/playbook/run', body);
  }
}
