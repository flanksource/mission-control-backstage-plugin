import { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { missionControlApiRef, HealthCheckSummary, MissionControlAuthError } from '../api/types';
import { useMCAuth } from '../components/MissionControlAuthProvider/MissionControlAuthProvider';

interface UseHealthChecksResult {
  checks: HealthCheckSummary[];
  loading: boolean;
  error?: Error;
}

export function useHealthChecksForEntity(configIds: string[]): UseHealthChecksResult {
  const api = useApi(missionControlApiRef);
  const { retryCount, onAuthError } = useMCAuth();
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
          if (error instanceof MissionControlAuthError) {
            onAuthError();
            setState({ checks: [], loading: true });
          } else {
            setState({ checks: [], loading: false, error: error as Error });
          }
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [configIds.join(','), api, retryCount, onAuthError]);

  return state;
}
