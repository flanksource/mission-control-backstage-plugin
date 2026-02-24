import React from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import { Chip } from '@material-ui/core';
import { HealthCheckSummary } from '../../api/types';

const columns: TableColumn<HealthCheckSummary>[] = [
  { title: 'Name', field: 'name' },
  { title: 'Type', field: 'type' },
  {
    title: 'Status',
    render: row => {
      const isHealthy = row.status === 'healthy';
      return (
        <Chip
          size="small"
          label={isHealthy ? 'Passing' : 'Failing'}
          style={{
            backgroundColor: isHealthy ? '#4caf50' : '#f44336',
            color: '#fff',
          }}
        />
      );
    },
    sorting: false,
  },
  { title: 'Severity', field: 'severity' },
  {
    title: 'Last Run',
    field: 'last_runtime',
    render: row => row.last_runtime ? new Date(row.last_runtime).toLocaleString() : '-',
  },
];

export function EntityMissionControlChecksTable({
  checks,
  loading,
}: {
  checks: HealthCheckSummary[];
  loading: boolean;
}) {
  return (
    <Table
      title="Health Checks"
      columns={columns}
      data={checks}
      isLoading={loading}
      options={{
        padding: 'dense',
        pageSize: 10,
        search: checks.length > 5,
        paging: checks.length > 10,
      }}
    />
  );
}
