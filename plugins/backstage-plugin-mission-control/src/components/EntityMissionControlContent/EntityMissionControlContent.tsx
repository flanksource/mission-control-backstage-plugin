import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box } from '@material-ui/core';
import { Content, ContentHeader, Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  missionControlApiRef,
  MissionControlAuthError,
  ConfigChange,
  RelatedConfig,
  HealthCheckSummary,
  PlaybookRun,
  ConfigAccessSummary,
} from '../../api/types';
import { useConfigForEntity } from '../../hooks/useConfigForEntity';
import { useMCAuth } from '../MissionControlAuthProvider/MissionControlAuthProvider';
import { EntityMissionControlConfigTable } from '../EntityMissionControlConfigTable/EntityMissionControlConfigTable';
import { EntityMissionControlChecksTable } from '../EntityMissionControlChecksTable/EntityMissionControlChecksTable';
import { ConfigChangesTable } from '../ConfigChangesTable/ConfigChangesTable';
import { ConfigRelationshipsTable } from '../ConfigRelationshipsTable/ConfigRelationshipsTable';
import { ConfigSpecView } from '../ConfigSpecView/ConfigSpecView';
import { PlaybookRunsTable } from '../PlaybookRunsTable/PlaybookRunsTable';
import { PlaybookActionsMenu } from '../PlaybookActions/PlaybookActionsMenu';
import { ConfigAccessTable } from '../ConfigAccessTable/ConfigAccessTable';

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box pt={2}>{children}</Box>;
}

function useLazyFetch<T>(
  fetcher: () => Promise<T>,
  active: boolean,
  opts?: { retryCount?: number; onAuthError?: () => void },
): { data: T | null; loading: boolean; error?: Error } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [fetched, setFetched] = useState(false);
  const retryCount = opts?.retryCount ?? 0;

  useEffect(() => {
    setFetched(false);
  }, [retryCount]);

  useEffect(() => {
    if (!active || fetched) return;
    setLoading(true);
    setFetched(true);
    fetcher()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => {
        if (e instanceof MissionControlAuthError) {
          opts?.onAuthError?.();
          setFetched(false);
          setLoading(false);
        } else {
          setError(e);
          setLoading(false);
        }
      });
  }, [active, fetched, fetcher]);

  return { data, loading, error };
}

export function EntityMissionControlContent() {
  const { configs, loading: configsLoading, error: configsError } = useConfigForEntity();
  const api = useApi(missionControlApiRef);
  const { retryCount, onAuthError } = useMCAuth();
  const [tab, setTab] = useState(0);
  const [playbookRetry, setPlaybookRetry] = useState(0);

  const configIds = configs.map(c => c.id);
  const primaryConfigId = configIds[0];
  const authOpts = { retryCount, onAuthError };

  const changes = useLazyFetch<ConfigChange[]>(
    () => Promise.all(configIds.map(id => api.getChangesForConfig(id))).then(r => r.flat()),
    tab === 1 && configIds.length > 0,
    authOpts,
  );

  const relationships = useLazyFetch<RelatedConfig[]>(
    () => Promise.all(configIds.map(id => api.getRelatedConfigs(id, 1))).then(r => r.flat()),
    tab === 2 && configIds.length > 0,
    authOpts,
  );

  const checks = useLazyFetch<HealthCheckSummary[]>(
    () => Promise.all(configIds.map(id => api.getHealthChecksForConfig(id))).then(r => r.flat()),
    tab === 4 && configIds.length > 0,
    authOpts,
  );

  const playbooks = useLazyFetch<PlaybookRun[]>(
    () => Promise.all(configIds.map(id => api.getPlaybookRunsForConfig(id))).then(r => r.flat()),
    tab === 5 && configIds.length > 0,
    { retryCount: retryCount + playbookRetry, onAuthError },
  );

  const access = useLazyFetch<ConfigAccessSummary[]>(
    () => Promise.all(configIds.map(id => api.getAccessSummaryForConfig(id))).then(r => r.flat()),
    tab === 6 && configIds.length > 0,
    authOpts,
  );

  if (configsError) return <ResponseErrorPanel error={configsError} />;

  const summary = configs[0]?.summary;

  return (
    <Content>
      <ContentHeader title="Mission Control" />
      {configsLoading && <Progress />}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
      >
        <Tab label="Overview" />
        <Tab label={`Changes${summary?.changes ? ` (${summary.changes})` : ''}`} />
        <Tab label={`Relationships${summary?.relationships ? ` (${summary.relationships})` : ''}`} />
        <Tab label="Spec" />
        <Tab label={`Checks${summary?.checks ? ` (${summary.checks})` : ''}`} />
        <Tab label={`Playbooks${summary?.playbook_runs ? ` (${summary.playbook_runs})` : ''}`} />
        <Tab label="Access" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <EntityMissionControlConfigTable configs={configs} loading={configsLoading} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        {changes.error && <ResponseErrorPanel error={changes.error} />}
        <ConfigChangesTable changes={changes.data ?? []} loading={changes.loading} />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        {relationships.error && <ResponseErrorPanel error={relationships.error} />}
        <ConfigRelationshipsTable configs={relationships.data ?? []} loading={relationships.loading} />
      </TabPanel>

      <TabPanel value={tab} index={3}>
        {primaryConfigId ? <ConfigSpecView configId={primaryConfigId} /> : 'No config selected.'}
      </TabPanel>

      <TabPanel value={tab} index={4}>
        {checks.error && <ResponseErrorPanel error={checks.error} />}
        <EntityMissionControlChecksTable checks={checks.data ?? []} loading={checks.loading} />
      </TabPanel>

      <TabPanel value={tab} index={5}>
        {primaryConfigId && (
          <Box mb={1}>
            <PlaybookActionsMenu
              configId={primaryConfigId}
              onRunSubmitted={() => setPlaybookRetry(c => c + 1)}
            />
          </Box>
        )}
        {playbooks.error && <ResponseErrorPanel error={playbooks.error} />}
        <PlaybookRunsTable runs={playbooks.data ?? []} loading={playbooks.loading} />
      </TabPanel>

      <TabPanel value={tab} index={6}>
        {access.error && <ResponseErrorPanel error={access.error} />}
        <ConfigAccessTable access={access.data ?? []} loading={access.loading} />
      </TabPanel>
    </Content>
  );
}
