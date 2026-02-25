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

export interface ConfigDetail extends ConfigItem {
  config?: Record<string, any>;
  parent_id?: string;
  path?: string;
  external_id?: string[];
  source?: string;
  properties?: Record<string, any> | null;
}

export interface ConfigChange {
  id: string;
  config_id: string;
  change_type: string;
  severity?: string;
  source: string;
  summary: string;
  patches?: any;
  details?: string;
  external_created_by?: string;
  created_by?: string;
  created_at?: string;
  first_observed?: string;
  count?: number;
}

export interface RelatedConfig extends ConfigItem {
  relation_type?: string;
  direction?: string;
  depth?: number;
}

export interface PlaybookRun {
  id: string;
  playbook_id?: string;
  status: string;
  error?: string;
  start_time: string;
  end_time?: string;
  config_id?: string;
  created_at?: string;
  created_by?: { id: string; name: string };
  playbooks?: { id: string; name: string; spec?: any };
}

export interface ConfigAccessSummary {
  config_id: string;
  config_name?: string;
  config_type?: string;
  user?: string;
  email?: string;
  role?: string | null;
  user_type?: string | null;
  last_signed_in_at?: string | null;
  last_reviewed_at?: string | null;
  created_at: string;
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
  getConfigDetail(id: string): Promise<ConfigDetail>;
  searchConfigs(query: { type?: string; name?: string }): Promise<ConfigItem[]>;
  getRelatedConfigs(configId: string, depth: number): Promise<RelatedConfig[]>;
  getHealthChecksForConfig(configId: string): Promise<HealthCheckSummary[]>;
  getChangesForConfig(configId: string): Promise<ConfigChange[]>;
  getPlaybookRunsForConfig(configId: string): Promise<PlaybookRun[]>;
  getAccessSummaryForConfig(configId: string): Promise<ConfigAccessSummary[]>;
  getCatalogSummary(configIds: string[]): Promise<CatalogSummary>;
  getChanges(configIds: string[]): Promise<ConfigChange[]>;
}

export const missionControlApiRef = createApiRef<MissionControlApi>({
  id: 'plugin.mission-control.api',
});
