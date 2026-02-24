import { Entity } from '@backstage/catalog-model';
import {
  MISSION_CONTROL_CONFIG_ID_ANNOTATION,
  MISSION_CONTROL_CONFIG_IDS_ANNOTATION,
  MISSION_CONTROL_CONFIG_TYPE_ANNOTATION,
  getAnnotation,
} from './annotations';

export const isMissionControlAvailable = (entity: Entity): boolean =>
  !!(
    getAnnotation(entity, MISSION_CONTROL_CONFIG_ID_ANNOTATION) ||
    getAnnotation(entity, MISSION_CONTROL_CONFIG_IDS_ANNOTATION) ||
    getAnnotation(entity, MISSION_CONTROL_CONFIG_TYPE_ANNOTATION)
  );
