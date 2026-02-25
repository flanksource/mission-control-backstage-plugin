import { ConfigProperty } from '../api/types';

export type GroupedProperty = {
  type: 'GROUPED';
  label: string;
  properties: { rowKey: string; rows: { label: string; value: string }[] }[];
};

export type SingleProperty = {
  type: 'SINGLE';
  label: string;
  rows: { label: string; value: string }[];
};

export type PropertyItem = GroupedProperty | SingleProperty;

const ROW_KEY_MAP = new Map([
  ['region', 'region/zone'],
  ['zone', 'region/zone'],
  ['vpc', 'vpc/subnet'],
  ['subnet', 'vpc/subnet'],
  ['os', 'os/arch'],
  ['arch', 'os/arch'],
  ['version', 'version/part-of'],
  ['part-of', 'version/part-of'],
]);

const FILTERED_LABEL_PREFIXES = ['flanksource.com/', 'config-db/'];
const FILTERED_LABEL_KEYS = new Set(['name', 'Name']);

function formatPropertyValue(prop: ConfigProperty): string {
  if (prop.type === 'currency' && prop.value != null) {
    return `$${Number(prop.value).toFixed(2)}`;
  }
  if (prop.type === 'age' && prop.value) {
    return String(prop.value);
  }
  if (prop.url) return prop.url;
  if (prop.text) return prop.text;
  if (prop.value != null) return String(prop.value);
  if (prop.links?.length) return prop.links.map(l => l.label).join(', ');
  return '';
}

export function formatConfigProperties(
  properties?: ConfigProperty[] | null,
): PropertyItem[] {
  if (!properties?.length) return [];

  const items = new Map<string, PropertyItem>();

  for (const prop of properties) {
    if (!prop.name || prop.headline || prop.type === 'hidden') continue;

    const value = formatPropertyValue(prop);
    if (!value) continue;

    const parts = prop.name.split(/[:/]/);

    if (parts.length === 1) {
      const label = prop.namespace
        ? `${prop.namespace}/${prop.name}`
        : prop.name;
      const rowKey = ROW_KEY_MAP.get(prop.name) ?? prop.name;
      const existing = items.get(rowKey) as SingleProperty | undefined;

      items.set(rowKey, {
        type: 'SINGLE',
        label: rowKey,
        rows: [...(existing?.rows ?? []), { label, value }].sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
      });
    } else {
      const groupName = parts[0];
      const name = parts.slice(1).join('/');
      const label = prop.namespace ? `${prop.namespace}/${name}` : name;
      const rowKey = ROW_KEY_MAP.get(name) ?? name;

      const existing = (items.get(groupName) as GroupedProperty) ?? {
        type: 'GROUPED',
        label: groupName,
        properties: [],
      };

      const existingRows =
        existing.properties.find(p => p.rowKey === rowKey)?.rows ?? [];

      items.set(groupName, {
        ...existing,
        properties: [
          ...existing.properties.filter(p => p.rowKey !== rowKey),
          { rowKey, rows: [...existingRows, { label, value }] },
        ],
      });
    }
  }

  return Array.from(items.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export function formatConfigLabels(
  labels?: Record<string, string>,
): PropertyItem[] {
  if (!labels || Object.keys(labels).length === 0) return [];

  const filtered = Object.entries(labels).filter(
    ([k]) =>
      !FILTERED_LABEL_KEYS.has(k) &&
      !FILTERED_LABEL_PREFIXES.some(p => k.startsWith(p)),
  );
  if (filtered.length === 0) return [];

  const items = new Map<string, PropertyItem>();

  for (const [key, value] of filtered) {
    const parts = key.split(/[:/]/);

    if (parts.length === 1) {
      const rowKey = ROW_KEY_MAP.get(key) ?? key;
      const existing = items.get(rowKey) as SingleProperty | undefined;

      items.set(rowKey, {
        type: 'SINGLE',
        label: rowKey,
        rows: [...(existing?.rows ?? []), { label: key, value }].sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
      });
    } else {
      const groupName = parts[0];
      const name = parts.slice(1).join('/');
      const rowKey = ROW_KEY_MAP.get(name) ?? name;

      const existing = (items.get(groupName) as GroupedProperty) ?? {
        type: 'GROUPED',
        label: groupName,
        properties: [],
      };

      const existingRows =
        existing.properties.find(p => p.rowKey === rowKey)?.rows ?? [];

      items.set(groupName, {
        ...existing,
        properties: [
          ...existing.properties.filter(p => p.rowKey !== rowKey),
          { rowKey, rows: [...existingRows, { label: name, value }] },
        ],
      });
    }
  }

  return Array.from(items.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
