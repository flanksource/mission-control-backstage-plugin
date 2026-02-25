import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  Divider,
  Box,
  makeStyles,
} from '@material-ui/core';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  missionControlApiRef,
  ConfigItem,
  ConfigDetail,
  ConfigHealth,
} from '../../api/types';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { useConfigForEntity } from '../../hooks/useConfigForEntity';
import {
  formatConfigProperties,
  formatConfigLabels,
  PropertyItem,
  GroupedProperty,
  SingleProperty,
} from '../../utils/formatProperties';

const useStyles = makeStyles(theme => ({
  label: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  value: {
    fontWeight: 'bold',
    overflow: 'hidden',
    lineHeight: '24px',
    wordBreak: 'break-word',
  },
  chip: {
    margin: 2,
    height: 24,
  },
  gridItemCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 'calc(100% - 10px)',
    marginBottom: '10px',
  },
  cardContent: {
    flex: 1,
  },
  groupHeader: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
}));

function AboutField({
  label,
  value,
  children,
  gridSizes,
}: {
  label: string;
  value?: string | number;
  children?: React.ReactNode;
  gridSizes?: {
    xs?: 12 | 6 | 4 | 3;
    sm?: 12 | 6 | 4 | 3;
    lg?: 12 | 6 | 4 | 3;
  };
}) {
  const classes = useStyles();
  const sizes = gridSizes ?? { xs: 12, sm: 6, lg: 4 };
  return (
    <Grid item {...sizes}>
      <Typography variant="h2" className={classes.label}>
        {label}
      </Typography>
      {children ?? (
        <Typography variant="body2" className={classes.value}>
          {value ?? '-'}
        </Typography>
      )}
    </Grid>
  );
}

function PropertyRows({ items }: { items: PropertyItem[] }) {
  const classes = useStyles();
  if (!items.length) return null;

  return (
    <>
      {items.map(item => {
        if (item.type === 'SINGLE') {
          const single = item as SingleProperty;
          return single.rows.map(row => (
            <AboutField key={row.label} label={row.label} value={row.value} />
          ));
        }

        const grouped = item as GroupedProperty;
        return (
          <Grid item xs={12} key={grouped.label}>
            <Typography className={classes.groupHeader}>
              {grouped.label}
            </Typography>
            <Grid container spacing={2}>
              {grouped.properties.flatMap(prop =>
                prop.rows.map(row => (
                  <AboutField key={`${grouped.label}-${row.label}`} label={row.label} value={row.value} />
                )),
              )}
            </Grid>
          </Grid>
        );
      })}
    </>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatCost(config: ConfigDetail): string | null {
  if (config.cost_total_30d != null && config.cost_total_30d > 0)
    return `$${config.cost_total_30d.toFixed(2)}/mo`;
  if (config.cost_total_7d != null && config.cost_total_7d > 0)
    return `$${config.cost_total_7d.toFixed(2)}/7d`;
  if (config.cost_total_1d != null && config.cost_total_1d > 0)
    return `$${config.cost_total_1d.toFixed(2)}/day`;
  return null;
}

function summarizeConfigs(configs: ConfigItem[]) {
  let healthy = 0,
    unhealthy = 0,
    warning = 0,
    totalChanges = 0;
  for (const c of configs) {
    if (c.health === 'healthy') healthy++;
    else if (c.health === 'unhealthy') unhealthy++;
    else if (c.health === 'warning') warning++;
    totalChanges += c.summary?.changes ?? c.changes ?? 0;
  }
  const worstHealth: ConfigHealth =
    unhealthy > 0
      ? 'unhealthy'
      : warning > 0
        ? 'warning'
        : healthy > 0
          ? 'healthy'
          : 'unknown';
  return { healthy, unhealthy, warning, totalChanges, worstHealth };
}

export function EntityMissionControlCard({
  variant,
}: {
  variant?: 'gridItem' | 'fullHeight' | 'flex';
}) {
  const classes = useStyles();
  const { configs, loading, error } = useConfigForEntity();
  const api = useApi(missionControlApiRef);
  const [detail, setDetail] = useState<ConfigDetail | null>(null);

  const primaryConfig = configs[0];

  useEffect(() => {
    if (!primaryConfig) return;
    api
      .getConfigDetail(primaryConfig.id)
      .then(setDetail)
      .catch(() => {});
  }, [primaryConfig, api]);

  const configProperties = useMemo(
    () => formatConfigProperties(detail?.properties),
    [detail?.properties],
  );

  const groupedLabels = useMemo(
    () => formatConfigLabels((detail ?? primaryConfig)?.labels),
    [detail, primaryConfig],
  );

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;
  if (configs.length === 0) {
    return (
      <Card
        className={variant === 'gridItem' ? classes.gridItemCard : undefined}
      >
        <CardHeader title="Mission Control" />
        <CardContent>
          <Typography>No config items found for this entity.</Typography>
        </CardContent>
      </Card>
    );
  }

  const summary = summarizeConfigs(configs);
  const config = detail ?? primaryConfig;
  const tags = config.tags
    ? Object.values(config.tags).filter(Boolean)
    : [];
  const cost = detail ? formatCost(detail) : null;

  return (
    <Card
      className={variant === 'gridItem' ? classes.gridItemCard : undefined}
    >
      <CardHeader
        title="Mission Control"
        action={<StatusBadge health={summary.worstHealth} />}
      />
      <CardContent
        className={variant === 'gridItem' ? classes.cardContent : undefined}
      >
        <Grid container spacing={2}>
          <AboutField label="Name" value={config.name} />
          <AboutField label="Type" value={config.type} />
          <AboutField label="Status">
            <Box display="flex" alignItems="center" style={{ gap: 6 }}>
              <StatusBadge health={config.health} />
              {config.status && (
                <Typography variant="body2" color="textSecondary">
                  {config.status}
                </Typography>
              )}
            </Box>
          </AboutField>
          {config.created_at && (
            <AboutField label="Created" value={timeAgo(config.created_at)} />
          )}
          {config.updated_at && (
            <AboutField label="Updated" value={timeAgo(config.updated_at)} />
          )}
          {cost && <AboutField label="Cost" value={cost} />}
          <AboutField label="Changes" value={summary.totalChanges} />
          <AboutField label="Configs" value={configs.length} />
          {config.config_class &&
            !config.type?.endsWith(config.config_class) && (
              <AboutField label="Class" value={config.config_class} />
            )}
        </Grid>

        {tags.length > 0 && (
          <>
            <Box mt={2} mb={1}>
              <Divider />
            </Box>
            <AboutField label="Tags" gridSizes={{ xs: 12 }}>
              <Box display="flex" flexWrap="wrap" mt={0.5}>
                {tags.map((tag: any) => (
                  <Chip
                    key={String(tag)}
                    label={String(tag)}
                    size="small"
                    variant="outlined"
                    className={classes.chip}
                  />
                ))}
              </Box>
            </AboutField>
          </>
        )}

        {configProperties.length > 0 && (
          <>
            <Box mt={1} mb={1}>
              <Divider />
            </Box>
            <Grid container spacing={2}>
              <PropertyRows items={configProperties} />
            </Grid>
          </>
        )}

        {groupedLabels.length > 0 && (
          <>
            <Box mt={1} mb={1}>
              <Divider />
            </Box>
            <Grid container spacing={2}>
              <PropertyRows items={groupedLabels} />
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
}
