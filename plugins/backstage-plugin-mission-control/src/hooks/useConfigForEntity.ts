import { useEffect, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { missionControlApiRef, ConfigItem } from '../api/types';
import {
  getConfigIds,
  getAnnotation,
  MISSION_CONTROL_CONFIG_TYPE_ANNOTATION,
  MISSION_CONTROL_CONFIG_NAME_ANNOTATION,
} from '../utils/annotations';

interface UseConfigResult {
  configs: ConfigItem[];
  loading: boolean;
  error?: Error;
}

export function useConfigForEntity(): UseConfigResult {
  const { entity } = useEntity();
  const api = useApi(missionControlApiRef);
  const [state, setState] = useState<UseConfigResult>({ configs: [], loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const configIds = getConfigIds(entity);

        let configs: ConfigItem[];
        if (configIds.length > 0) {
          configs = configIds.length === 1
            ? [await api.getConfigById(configIds[0])]
            : await api.getConfigsByIds(configIds);
        } else {
          const configType = getAnnotation(entity, MISSION_CONTROL_CONFIG_TYPE_ANNOTATION);
          const configName = getAnnotation(entity, MISSION_CONTROL_CONFIG_NAME_ANNOTATION) ?? entity.metadata.name;
          configs = await api.searchConfigs({ type: configType, name: configName });
        }

        if (!cancelled) {
          setState({ configs, loading: false });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ configs: [], loading: false, error: error as Error });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [entity, api]);

  return state;
}
