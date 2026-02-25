import React from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import { RelatedConfig } from '../../api/types';
import { StatusBadge } from '../StatusBadge/StatusBadge';

const columns: TableColumn<RelatedConfig>[] = [
  { title: 'Name', field: 'name' },
  { title: 'Type', field: 'type' },
  {
    title: 'Health',
    render: row => <StatusBadge health={row.health} />,
    sorting: false,
  },
  { title: 'Status', field: 'status', render: row => row.status || '-' },
  {
    title: 'Relation',
    field: 'relation_type',
    render: row => row.relation_type || '-',
  },
  {
    title: 'Updated',
    field: 'updated_at',
    render: row => row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '-',
  },
];

export function ConfigRelationshipsTable({ configs, loading }: { configs: RelatedConfig[]; loading: boolean }) {
  return (
    <Table
      title="Relationships"
      columns={columns}
      data={configs}
      isLoading={loading}
      options={{ padding: 'dense', pageSize: 20, search: configs.length > 10, paging: configs.length > 20 }}
    />
  );
}
