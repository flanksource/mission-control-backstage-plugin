import { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { missionControlApiRef, HealthCheckSummary } from '../api/types';

interface UseHealthChecksResult {
  checks: HealthCheckSummary[];
  loading: boolean;
  error?: Error;
}

export function useHealthChecksForEntity(configIds: string[]): UseHealthChecksResult {
  const api = useApi(missionControlApiRef);
  const [state, setState] = useState<UseHealthChecksResult>({ checks: [], loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (configIds.length === 0) {
        setState({ checks: [], loading: false });
        return;
      }

      try {
        const results = await Promise.all(
          configIds.map(id => api.getHealthChecksForConfig(id)),
        );
        const checks = results.flat();

        if (!cancelled) {
          setState({ checks, loading: false });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ checks: [], loading: false, error: error as Error });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [configIds.join(','), api]);

  return state;
}
