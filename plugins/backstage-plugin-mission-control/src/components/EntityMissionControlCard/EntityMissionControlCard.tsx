import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { ConfigItem, ConfigHealth } from '../../api/types';
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

function summarizeConfigs(configs: ConfigItem[]) {
  let healthy = 0, unhealthy = 0, warning = 0;
  let totalCost30d = 0;
  let totalChanges = 0;

  for (const c of configs) {
    if (c.health === 'healthy') healthy++;
    else if (c.health === 'unhealthy') unhealthy++;
    else if (c.health === 'warning') warning++;
    totalCost30d += c.cost_total_30d ?? 0;
    totalChanges += c.summary?.changes ?? c.changes ?? 0;
  }

  const worstHealth: ConfigHealth =
    unhealthy > 0 ? 'unhealthy' : warning > 0 ? 'warning' : healthy > 0 ? 'healthy' : 'unknown';

  return { healthy, unhealthy, warning, totalCost30d, totalChanges, worstHealth };
}

export function EntityMissionControlCard() {
  const { configs, loading, error } = useConfigForEntity();

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;
  if (configs.length === 0) {
    return (
      <Card>
        <CardHeader title="Mission Control" />
        <CardContent>
          <Typography>No config items found for this entity.</Typography>
        </CardContent>
      </Card>
    );
  }

  const summary = summarizeConfigs(configs);

  return (
    <Card>
      <CardHeader
        title="Mission Control"
        action={<StatusBadge health={summary.worstHealth} />}
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
          <Grid item xs={4}><Metric value={configs.length} label="Configs" /></Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
