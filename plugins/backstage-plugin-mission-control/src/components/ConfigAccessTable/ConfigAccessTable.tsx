import React from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import { ConfigAccessSummary } from '../../api/types';

const columns: TableColumn<ConfigAccessSummary>[] = [
  { title: 'User', field: 'user', render: row => row.user || row.email || '-' },
  { title: 'Email', field: 'email', render: row => row.email || '-' },
  { title: 'Role', field: 'role', render: row => row.role || '-' },
  { title: 'Type', field: 'user_type', render: row => row.user_type || '-' },
  {
    title: 'Last Signed In',
    field: 'last_signed_in_at',
    render: row => row.last_signed_in_at ? new Date(row.last_signed_in_at).toLocaleString() : '-',
  },
  {
    title: 'Granted',
    field: 'created_at',
    render: row => row.created_at ? new Date(row.created_at).toLocaleDateString() : '-',
  },
];

export function ConfigAccessTable({ access, loading }: { access: ConfigAccessSummary[]; loading: boolean }) {
  return (
    <Table
      title="Access"
      columns={columns}
      data={access}
      isLoading={loading}
      options={{ padding: 'dense', pageSize: 20, search: access.length > 10, paging: access.length > 20 }}
      emptyContent="No access data for this config."
    />
  );
}
