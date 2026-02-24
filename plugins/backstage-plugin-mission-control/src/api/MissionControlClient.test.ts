import { MissionControlClient } from './MissionControlClient';

function createMockFetchApi(responses: Record<string, { ok: boolean; json: () => any; status?: number; statusText?: string }>) {
  return {
    fetch: jest.fn(async (url: string, _init?: RequestInit) => {
      for (const [pattern, response] of Object.entries(responses)) {
        if (url.includes(pattern)) return response;
      }
      return { ok: false, status: 404, statusText: 'Not Found' };
    }),
  };
}

function createMockDiscoveryApi(baseUrl = 'http://localhost:7007/api/mission-control') {
  return { getBaseUrl: jest.fn(async () => baseUrl) };
}

describe('MissionControlClient', () => {
  it('getConfigById returns first config from array', async () => {
    const config = { id: 'abc', name: 'my-config', type: 'Kubernetes::Deployment' };
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi: createMockFetchApi({
        '/api/db/configs?id=eq.abc': { ok: true, json: () => [config] },
      }),
    });

    const result = await client.getConfigById('abc');
    expect(result).toEqual(config);
  });

  it('getConfigById throws when config not found', async () => {
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi: createMockFetchApi({
        '/api/db/configs?id=eq.missing': { ok: true, json: () => [] },
      }),
    });

    await expect(client.getConfigById('missing')).rejects.toThrow('Config not found: missing');
  });

  it('getConfigsByIds fetches multiple configs', async () => {
    const configs = [
      { id: 'a', name: 'config-a', type: 'K8s' },
      { id: 'b', name: 'config-b', type: 'K8s' },
    ];
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi: createMockFetchApi({
        '/api/db/configs?id=in.(a,b)': { ok: true, json: () => configs },
      }),
    });

    const result = await client.getConfigsByIds(['a', 'b']);
    expect(result).toEqual(configs);
  });

  it('throws on non-ok response', async () => {
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi: createMockFetchApi({
        '/api/db/configs': { ok: false, status: 500, statusText: 'Internal Server Error', json: () => ({}) },
      }),
    });

    await expect(client.getConfigById('any')).rejects.toThrow('Mission Control API error: 500 Internal Server Error');
  });

  it('searchConfigs posts to /api/resources/search', async () => {
    const configs = [{ id: 'x', name: 'my-svc', type: 'Kubernetes::Deployment' }];
    const fetchApi = createMockFetchApi({
      '/api/resources/search': { ok: true, json: () => configs },
    });
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi,
    });

    const result = await client.searchConfigs({ type: 'Kubernetes::Deployment', name: 'my-svc' });
    expect(result).toEqual(configs);
    expect(fetchApi.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/resources/search'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('getHealthChecksForConfig calls correct endpoint', async () => {
    const checks = [{ id: 'chk1', name: 'http-check', type: 'http', status: 'healthy' }];
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi: createMockFetchApi({
        '/api/db/check_summary_for_config?config_id=eq.cfg1': { ok: true, json: () => checks },
      }),
    });

    const result = await client.getHealthChecksForConfig('cfg1');
    expect(result).toEqual(checks);
  });
});
