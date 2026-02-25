import React from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import { Chip } from '@material-ui/core';
import { PlaybookRun } from '../../api/types';

const statusColor: Record<string, string> = {
  completed: '#4caf50',
  running: '#2196f3',
  failed: '#f44336',
  cancelled: '#9e9e9e',
  pending: '#ff9800',
};

function duration(start: string, end?: string): string {
  if (!end) return 'running...';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

const columns: TableColumn<PlaybookRun>[] = [
  {
    title: 'Playbook',
    render: row => row.playbooks?.name ?? row.playbook_id ?? '-',
  },
  {
    title: 'Status',
    field: 'status',
    render: row => (
      <Chip
        size="small"
        label={row.status}
        style={{ backgroundColor: statusColor[row.status] ?? '#9e9e9e', color: '#fff' }}
      />
    ),
  },
  {
    title: 'Duration',
    render: row => duration(row.start_time, row.end_time),
  },
  {
    title: 'Started',
    field: 'start_time',
    render: row => new Date(row.start_time).toLocaleString(),
    defaultSort: 'desc',
  },
  {
    title: 'Created By',
    render: row => row.created_by?.name ?? '-',
  },
];

export function PlaybookRunsTable({ runs, loading }: { runs: PlaybookRun[]; loading: boolean }) {
  return (
    <Table
      title="Playbook Runs"
      columns={columns}
      data={runs}
      isLoading={loading}
      options={{ padding: 'dense', pageSize: 20, search: runs.length > 10, paging: runs.length > 20 }}
      emptyContent="No playbook runs for this config."
    />
  );
}
