import React from 'react';
import { Chip } from '@material-ui/core';
import { ConfigHealth } from '../../api/types';

const healthColors: Record<ConfigHealth, string> = {
  healthy: '#4caf50',
  unhealthy: '#f44336',
  warning: '#ff9800',
  unknown: '#9e9e9e',
};

const healthLabels: Record<ConfigHealth, string> = {
  healthy: 'Healthy',
  unhealthy: 'Unhealthy',
  warning: 'Warning',
  unknown: 'Unknown',
};

export function StatusBadge({ health }: { health?: ConfigHealth }) {
  const status = health ?? 'unknown';
  return (
    <Chip
      size="small"
      label={healthLabels[status]}
      style={{ backgroundColor: healthColors[status], color: '#fff' }}
    />
  );
}
