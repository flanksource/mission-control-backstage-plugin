import { formatConfigProperties, formatConfigLabels } from './formatProperties';
import { ConfigProperty } from '../api/types';

describe('formatConfigProperties', () => {
  it('returns empty array for null/undefined/empty', () => {
    expect(formatConfigProperties(null)).toEqual([]);
    expect(formatConfigProperties(undefined)).toEqual([]);
    expect(formatConfigProperties([])).toEqual([]);
  });

  it('skips headline and hidden properties', () => {
    const props: ConfigProperty[] = [
      { name: 'cpu', value: '4', headline: true },
      { name: 'secret', value: 'hidden', type: 'hidden' },
      { name: 'memory', value: '16GB' },
    ];
    const result = formatConfigProperties(props);
    expect(result).toEqual([
      { type: 'SINGLE', label: 'memory', rows: [{ label: 'memory', value: '16GB' }] },
    ]);
  });

  it('groups region/zone into a single row key', () => {
    const props: ConfigProperty[] = [
      { name: 'region', value: 'us-east-1' },
      { name: 'zone', value: 'us-east-1a' },
    ];
    const result = formatConfigProperties(props);
    expect(result).toEqual([
      {
        type: 'SINGLE',
        label: 'region/zone',
        rows: [
          { label: 'region', value: 'us-east-1' },
          { label: 'zone', value: 'us-east-1a' },
        ],
      },
    ]);
  });

  it('creates GROUPED properties for names with : or / separator', () => {
    const props: ConfigProperty[] = [
      { name: 'kubernetes:version', value: '1.28' },
      { name: 'kubernetes:runtime', value: 'containerd' },
    ];
    const result = formatConfigProperties(props);
    expect(result).toEqual([
      {
        type: 'GROUPED',
        label: 'kubernetes',
        properties: [
          { rowKey: 'version/part-of', rows: [{ label: 'version', value: '1.28' }] },
          { rowKey: 'runtime', rows: [{ label: 'runtime', value: 'containerd' }] },
        ],
      },
    ]);
  });

  it('formats currency values', () => {
    const props: ConfigProperty[] = [
      { name: 'cost', type: 'currency', value: 12.5 },
    ];
    const result = formatConfigProperties(props);
    expect(result).toEqual([
      { type: 'SINGLE', label: 'cost', rows: [{ label: 'cost', value: '$12.50' }] },
    ]);
  });

  it('uses url as value fallback', () => {
    const props: ConfigProperty[] = [
      { name: 'docs', url: 'https://example.com' },
    ];
    const result = formatConfigProperties(props);
    expect(result).toEqual([
      { type: 'SINGLE', label: 'docs', rows: [{ label: 'docs', value: 'https://example.com' }] },
    ]);
  });

  it('prepends namespace to label for simple properties', () => {
    const props: ConfigProperty[] = [
      { name: 'version', namespace: 'app', value: '2.0' },
    ];
    const result = formatConfigProperties(props);
    expect(result).toEqual([
      {
        type: 'SINGLE',
        label: 'version/part-of',
        rows: [{ label: 'app/version', value: '2.0' }],
      },
    ]);
  });

  it('skips properties with no displayable value', () => {
    const props: ConfigProperty[] = [
      { name: 'empty' },
      { name: 'visible', value: 'yes' },
    ];
    const result = formatConfigProperties(props);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ label: 'visible' });
  });

  it('sorts output alphabetically by label', () => {
    const props: ConfigProperty[] = [
      { name: 'zebra', value: 'z' },
      { name: 'alpha', value: 'a' },
      { name: 'middle', value: 'm' },
    ];
    const result = formatConfigProperties(props);
    expect(result.map(r => r.label)).toEqual(['alpha', 'middle', 'zebra']);
  });
});

describe('formatConfigLabels', () => {
  it('returns empty array for null/undefined/empty', () => {
    expect(formatConfigLabels(undefined)).toEqual([]);
    expect(formatConfigLabels({})).toEqual([]);
  });

  it('filters out name/Name and flanksource.com/* and config-db/* keys', () => {
    const labels = {
      name: 'test',
      Name: 'Test',
      'flanksource.com/type': 'x',
      'config-db/source': 'y',
      env: 'production',
    };
    const result = formatConfigLabels(labels);
    expect(result).toEqual([
      { type: 'SINGLE', label: 'env', rows: [{ label: 'env', value: 'production' }] },
    ]);
  });

  it('groups namespaced labels by first segment', () => {
    const labels = {
      'app.kubernetes.io/name': 'myapp',
      'app.kubernetes.io/version': '1.0',
    };
    const result = formatConfigLabels(labels);
    expect(result).toEqual([
      {
        type: 'GROUPED',
        label: 'app.kubernetes.io',
        properties: [
          { rowKey: 'name', rows: [{ label: 'name', value: 'myapp' }] },
          { rowKey: 'version/part-of', rows: [{ label: 'version', value: '1.0' }] },
        ],
      },
    ]);
  });

  it('merges region/zone labels into single row key', () => {
    const labels = { region: 'us-east-1', zone: 'us-east-1a' };
    const result = formatConfigLabels(labels);
    expect(result).toEqual([
      {
        type: 'SINGLE',
        label: 'region/zone',
        rows: [
          { label: 'region', value: 'us-east-1' },
          { label: 'zone', value: 'us-east-1a' },
        ],
      },
    ]);
  });

  it('sorts output alphabetically', () => {
    const labels = { zebra: 'z', alpha: 'a', middle: 'm' };
    const result = formatConfigLabels(labels);
    expect(result.map(r => r.label)).toEqual(['alpha', 'middle', 'zebra']);
  });
});
