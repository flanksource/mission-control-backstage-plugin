import { createApiRef } from '@backstage/core-plugin-api';

export type ConfigHealth = 'healthy' | 'unhealthy' | 'warning' | 'unknown';
export type CheckStatus = 'healthy' | 'unhealthy';

export interface Costs {
  cost_per_minute?: number;
  cost_total_1d?: number;
  cost_total_7d?: number;
  cost_total_30d?: number;
}

export interface ConfigItem extends Costs {
  id: string;
  name: string;
  type: string;
  status?: string;
  config_class?: string;
  health?: ConfigHealth;
  tags?: Record<string, any>;
  labels?: Record<string, string>;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  changes?: number;
  summary?: {
    relationships?: number;
    analysis?: number;
    changes?: number;
    playbook_runs?: number;
    checks?: number;
  };
  agent?: { id: string; name: string };
}

export interface ConfigChange {
  id: string;
  config_id: string;
  change_type: string;
  severity?: string;
  source: string;
  summary: string;
  created_at?: string;
  external_created_by: string;
  count?: number;
}

export interface HealthCheckSummary {
  id: string;
  name: string;
  icon?: string;
  type: string;
  status?: CheckStatus;
  severity?: string;
  next_runtime?: string;
  created_at?: string;
  last_runtime?: string;
  last_transition_time?: string;
}

export interface CatalogSummary {
  totalConfigs: number;
  healthy: number;
  unhealthy: number;
  warning: number;
  unknown: number;
  totalCost30d: number;
  totalChanges: number;
  checksHealthy: number;
  checksUnhealthy: number;
}

export interface MissionControlApi {
  getConfigById(id: string): Promise<ConfigItem>;
  getConfigsByIds(ids: string[]): Promise<ConfigItem[]>;
  searchConfigs(query: { type?: string; name?: string }): Promise<ConfigItem[]>;
  getRelatedConfigs(configId: string, depth: number): Promise<ConfigItem[]>;
  getHealthChecksForConfig(configId: string): Promise<HealthCheckSummary[]>;
  getCatalogSummary(configIds: string[]): Promise<CatalogSummary>;
  getChanges(configIds: string[]): Promise<ConfigChange[]>;
}

export const missionControlApiRef = createApiRef<MissionControlApi>({
  id: 'plugin.mission-control.api',
});
