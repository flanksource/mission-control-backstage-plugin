import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, makeStyles } from '@material-ui/core';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { missionControlApiRef, ConfigDetail } from '../../api/types';

const useStyles = makeStyles(theme => ({
  pre: {
    background: theme.palette.type === 'dark' ? '#1e1e1e' : '#f5f5f5',
    padding: theme.spacing(2),
    borderRadius: 4,
    overflow: 'auto',
    maxHeight: 600,
    fontSize: '0.8rem',
    lineHeight: 1.5,
  },
}));

export function ConfigSpecView({ configId }: { configId: string }) {
  const classes = useStyles();
  const api = useApi(missionControlApiRef);
  const [detail, setDetail] = useState<ConfigDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    api.getConfigDetail(configId)
      .then(d => { setDetail(d); setLoading(false); })
      .catch(e => { setError(e); setLoading(false); });
  }, [configId, api]);

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;
  if (!detail?.config) {
    return (
      <Card>
        <CardHeader title="Config Spec" />
        <CardContent>No config spec available.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Config Spec" />
      <CardContent>
        <pre className={classes.pre}>
          {JSON.stringify(detail.config, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
