import React from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import { Chip } from '@material-ui/core';
import { ConfigChange } from '../../api/types';

const severityColor: Record<string, string> = {
  critical: '#d32f2f',
  high: '#f44336',
  medium: '#ff9800',
  low: '#2196f3',
};

const columns: TableColumn<ConfigChange>[] = [
  {
    title: 'Type',
    field: 'change_type',
    render: row => (
      <Chip size="small" label={row.change_type} variant="outlined" />
    ),
  },
  { title: 'Summary', field: 'summary' },
  {
    title: 'Severity',
    field: 'severity',
    render: row => row.severity ? (
      <Chip
        size="small"
        label={row.severity}
        style={{ backgroundColor: severityColor[row.severity] ?? '#9e9e9e', color: '#fff' }}
      />
    ) : '-',
  },
  { title: 'Source', field: 'source' },
  { title: 'Created By', field: 'external_created_by', render: row => row.external_created_by || '-' },
  {
    title: 'Date',
    field: 'created_at',
    render: row => row.created_at ? new Date(row.created_at).toLocaleString() : '-',
    defaultSort: 'desc',
  },
];

export function ConfigChangesTable({ changes, loading }: { changes: ConfigChange[]; loading: boolean }) {
  return (
    <Table
      title="Changes"
      columns={columns}
      data={changes}
      isLoading={loading}
      options={{ padding: 'dense', pageSize: 20, search: changes.length > 10, paging: changes.length > 20 }}
    />
  );
}
