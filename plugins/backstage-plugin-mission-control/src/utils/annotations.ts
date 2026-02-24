import { Entity } from '@backstage/catalog-model';

export const MISSION_CONTROL_CONFIG_ID_ANNOTATION = 'flanksource.com/config-id';
export const MISSION_CONTROL_CONFIG_IDS_ANNOTATION = 'flanksource.com/config-ids';
export const MISSION_CONTROL_CONFIG_TYPE_ANNOTATION = 'flanksource.com/config-type';
export const MISSION_CONTROL_CONFIG_NAME_ANNOTATION = 'flanksource.com/config-name';
export const MISSION_CONTROL_CHECK_ID_ANNOTATION = 'flanksource.com/check-id';
export const MISSION_CONTROL_AGGREGATION_DEPTH_ANNOTATION = 'flanksource.com/aggregation-depth';

export function getAnnotation(entity: Entity, key: string): string | undefined {
  return entity.metadata.annotations?.[key];
}

export function getConfigIds(entity: Entity): string[] {
  const single = getAnnotation(entity, MISSION_CONTROL_CONFIG_ID_ANNOTATION);
  if (single) return [single];

  const multiple = getAnnotation(entity, MISSION_CONTROL_CONFIG_IDS_ANNOTATION);
  if (multiple) return multiple.split(',').map(id => id.trim());

  return [];
}

export function getAggregationDepth(entity: Entity, defaultDepth = 1): number {
  const annotation = getAnnotation(entity, MISSION_CONTROL_AGGREGATION_DEPTH_ANNOTATION);
  if (!annotation) return defaultDepth;
  const parsed = parseInt(annotation, 10);
  return isNaN(parsed) ? defaultDepth : parsed;
}
