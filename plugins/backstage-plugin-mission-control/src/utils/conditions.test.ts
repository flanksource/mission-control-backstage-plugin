import { Entity } from '@backstage/catalog-model';
import { isMissionControlAvailable } from './conditions';

function makeEntity(annotations: Record<string, string> = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name: 'test-service', annotations },
  };
}

describe('isMissionControlAvailable', () => {
  it('returns true when config-id annotation is present', () => {
    expect(isMissionControlAvailable(makeEntity({ 'flanksource.com/config-id': 'uuid' }))).toBe(true);
  });

  it('returns true when config-ids annotation is present', () => {
    expect(isMissionControlAvailable(makeEntity({ 'flanksource.com/config-ids': 'a,b' }))).toBe(true);
  });

  it('returns true when config-type annotation is present', () => {
    expect(isMissionControlAvailable(makeEntity({ 'flanksource.com/config-type': 'Kubernetes::Deployment' }))).toBe(true);
  });

  it('returns false when no relevant annotations present', () => {
    expect(isMissionControlAvailable(makeEntity())).toBe(false);
  });

  it('returns false for unrelated annotations', () => {
    expect(isMissionControlAvailable(makeEntity({ 'other/annotation': 'value' }))).toBe(false);
  });
});
