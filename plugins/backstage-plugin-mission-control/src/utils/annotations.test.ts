import { Entity } from '@backstage/catalog-model';
import {
  getAnnotation,
  getConfigIds,
  getAggregationDepth,
  MISSION_CONTROL_CONFIG_ID_ANNOTATION,
  MISSION_CONTROL_CONFIG_IDS_ANNOTATION,
  MISSION_CONTROL_AGGREGATION_DEPTH_ANNOTATION,
} from './annotations';

function makeEntity(annotations: Record<string, string> = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name: 'test-service', annotations },
  };
}

describe('getAnnotation', () => {
  it('returns the annotation value when present', () => {
    const entity = makeEntity({ 'flanksource.com/config-id': 'abc-123' });
    expect(getAnnotation(entity, MISSION_CONTROL_CONFIG_ID_ANNOTATION)).toBe('abc-123');
  });

  it('returns undefined when annotation is missing', () => {
    expect(getAnnotation(makeEntity(), 'flanksource.com/config-id')).toBeUndefined();
  });

  it('returns undefined when annotations object is undefined', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'test' },
    };
    expect(getAnnotation(entity, 'flanksource.com/config-id')).toBeUndefined();
  });
});

describe('getConfigIds', () => {
  it('returns single config-id as array', () => {
    const entity = makeEntity({ [MISSION_CONTROL_CONFIG_ID_ANNOTATION]: 'uuid-1' });
    expect(getConfigIds(entity)).toEqual(['uuid-1']);
  });

  it('returns comma-separated config-ids as array', () => {
    const entity = makeEntity({ [MISSION_CONTROL_CONFIG_IDS_ANNOTATION]: 'uuid-1, uuid-2, uuid-3' });
    expect(getConfigIds(entity)).toEqual(['uuid-1', 'uuid-2', 'uuid-3']);
  });

  it('prefers config-id over config-ids', () => {
    const entity = makeEntity({
      [MISSION_CONTROL_CONFIG_ID_ANNOTATION]: 'single',
      [MISSION_CONTROL_CONFIG_IDS_ANNOTATION]: 'a,b',
    });
    expect(getConfigIds(entity)).toEqual(['single']);
  });

  it('returns empty array when no annotations present', () => {
    expect(getConfigIds(makeEntity())).toEqual([]);
  });
});

describe('getAggregationDepth', () => {
  it('parses numeric annotation', () => {
    const entity = makeEntity({ [MISSION_CONTROL_AGGREGATION_DEPTH_ANNOTATION]: '2' });
    expect(getAggregationDepth(entity)).toBe(2);
  });

  it('returns default when annotation missing', () => {
    expect(getAggregationDepth(makeEntity())).toBe(1);
  });

  it('returns custom default when annotation missing', () => {
    expect(getAggregationDepth(makeEntity(), 3)).toBe(3);
  });

  it('returns default for non-numeric annotation', () => {
    const entity = makeEntity({ [MISSION_CONTROL_AGGREGATION_DEPTH_ANNOTATION]: 'abc' });
    expect(getAggregationDepth(entity)).toBe(1);
  });

  it('handles zero depth', () => {
    const entity = makeEntity({ [MISSION_CONTROL_AGGREGATION_DEPTH_ANNOTATION]: '0' });
    expect(getAggregationDepth(entity)).toBe(0);
  });
});
