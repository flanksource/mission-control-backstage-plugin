import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { missionControlApiRef, CatalogSummary, ConfigHealth } from '../../api/types';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { useConfigForEntity } from '../../hooks/useConfigForEntity';

const useStyles = makeStyles(theme => ({
  metric: {
    textAlign: 'center',
    padding: theme.spacing(1),
  },
  value: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  label: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
}));

function Metric({ value, label }: { value: string | number; label: string }) {
  const classes = useStyles();
  return (
    <div className={classes.metric}>
      <Typography className={classes.value}>{value}</Typography>
      <Typography className={classes.label}>{label}</Typography>
    </div>
  );
}

function worstHealth(summary: CatalogSummary): ConfigHealth {
  if (summary.unhealthy > 0) return 'unhealthy';
  if (summary.warning > 0) return 'warning';
  if (summary.healthy > 0) return 'healthy';
  return 'unknown';
}

export function EntityMissionControlCard() {
  const { configs, loading: configsLoading, error: configsError } = useConfigForEntity();
  const api = useApi(missionControlApiRef);
  const [summary, setSummary] = useState<CatalogSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<Error>();

  useEffect(() => {
    if (configsLoading || configs.length === 0) {
      setSummaryLoading(false);
      return;
    }

    const configIds = configs.map(c => c.id);
    api.getCatalogSummary(configIds)
      .then(data => {
        setSummary(data);
        setSummaryLoading(false);
      })
      .catch(err => {
        setSummaryError(err);
        setSummaryLoading(false);
      });
  }, [configs, configsLoading, api]);

  const loading = configsLoading || summaryLoading;
  const error = configsError || summaryError;

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;
  if (!summary) {
    return (
      <Card>
        <CardHeader title="Mission Control" />
        <CardContent>
          <Typography>No config items found for this entity.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Mission Control"
        action={<StatusBadge health={worstHealth(summary)} />}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={4}><Metric value={summary.healthy} label="Healthy" /></Grid>
          <Grid item xs={4}><Metric value={summary.unhealthy} label="Unhealthy" /></Grid>
          <Grid item xs={4}><Metric value={summary.warning} label="Warning" /></Grid>
          <Grid item xs={4}>
            <Metric value={`$${summary.totalCost30d.toFixed(2)}`} label="Cost (30d)" />
          </Grid>
          <Grid item xs={4}><Metric value={summary.totalChanges} label="Changes" /></Grid>
          <Grid item xs={4}>
            <Metric value={`${summary.checksHealthy}/${summary.checksHealthy + summary.checksUnhealthy}`} label="Checks Passing" />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
