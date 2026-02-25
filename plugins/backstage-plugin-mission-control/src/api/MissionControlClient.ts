import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import {
  MissionControlApi,
  ConfigItem,
  ConfigDetail,
  ConfigChange,
  RelatedConfig,
  HealthCheckSummary,
  CatalogSummary,
  PlaybookRun,
  ConfigAccessSummary,
} from './types';

export class MissionControlClient implements MissionControlApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async baseUrl(): Promise<string> {
    return this.discoveryApi.getBaseUrl('mission-control');
  }

  private async get<T>(path: string): Promise<T> {
    const base = await this.baseUrl();
    const response = await this.fetchApi.fetch(`${base}${path}`);
    if (!response.ok) {
      throw new Error(`Mission Control API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const base = await this.baseUrl();
    const response = await this.fetchApi.fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Mission Control API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
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
}
