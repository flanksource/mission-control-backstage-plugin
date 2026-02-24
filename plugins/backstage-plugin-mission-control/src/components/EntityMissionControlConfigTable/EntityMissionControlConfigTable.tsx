import React from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import { ConfigItem } from '../../api/types';
import { StatusBadge } from '../StatusBadge/StatusBadge';

const columns: TableColumn<ConfigItem>[] = [
  { title: 'Name', field: 'name' },
  { title: 'Type', field: 'type' },
  {
    title: 'Health',
    render: row => <StatusBadge health={row.health} />,
    sorting: false,
  },
  { title: 'Changes', field: 'changes', type: 'numeric' },
  {
    title: 'Cost (30d)',
    render: row => row.cost_total_30d != null ? `$${row.cost_total_30d.toFixed(2)}` : '-',
    type: 'numeric',
  },
  {
    title: 'Updated',
    field: 'updated_at',
    render: row => row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '-',
  },
];

export function EntityMissionControlConfigTable({ configs, loading }: { configs: ConfigItem[]; loading: boolean }) {
  return (
    <Table
      title="Config Items"
      columns={columns}
      data={configs}
      isLoading={loading}
      options={{
        padding: 'dense',
        pageSize: 10,
        search: configs.length > 5,
        paging: configs.length > 10,
      }}
    />
  );
}
