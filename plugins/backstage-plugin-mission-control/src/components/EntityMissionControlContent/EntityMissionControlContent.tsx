import React from 'react';
import { Grid } from '@material-ui/core';
import { Content, ContentHeader, Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useConfigForEntity } from '../../hooks/useConfigForEntity';
import { useHealthChecksForEntity } from '../../hooks/useHealthChecksForEntity';
import { EntityMissionControlConfigTable } from '../EntityMissionControlConfigTable/EntityMissionControlConfigTable';
import { EntityMissionControlChecksTable } from '../EntityMissionControlChecksTable/EntityMissionControlChecksTable';

export function EntityMissionControlContent() {
  const { configs, loading: configsLoading, error: configsError } = useConfigForEntity();
  const configIds = configs.map(c => c.id);
  const { checks, loading: checksLoading, error: checksError } = useHealthChecksForEntity(configIds);

  const error = configsError || checksError;
  if (error) return <ResponseErrorPanel error={error} />;

  return (
    <Content>
      <ContentHeader title="Mission Control" />
      {configsLoading && <Progress />}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityMissionControlConfigTable configs={configs} loading={configsLoading} />
        </Grid>
        <Grid item xs={12}>
          <EntityMissionControlChecksTable checks={checks} loading={checksLoading} />
        </Grid>
      </Grid>
    </Content>
  );
}
