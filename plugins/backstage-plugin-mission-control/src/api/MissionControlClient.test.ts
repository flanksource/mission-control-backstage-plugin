import { MissionControlClient } from './MissionControlClient';

const defaultAuthConfigResponse = {
  ok: true,
  json: () => ({ authMethod: 'static-token' }),
};

function createMockFetchApi(responses: Record<string, { ok: boolean; json: () => any; status?: number; statusText?: string }>) {
  return {
    fetch: jest.fn(async (url: string, _init?: RequestInit) => {
      if (url.includes('/auth/config')) return defaultAuthConfigResponse;
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

  it('getPlaybooksForConfig calls /api/playbook/list with config_id', async () => {
    const playbooks = [{ id: 'pb1', name: 'restart', title: 'Restart Pod' }];
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi: createMockFetchApi({
        '/api/playbook/list?config_id=cfg1': { ok: true, json: () => playbooks },
      }),
    });

    const result = await client.getPlaybooksForConfig('cfg1');
    expect(result).toEqual(playbooks);
  });

  it('getPlaybookParams POSTs to /api/playbook/:id/params', async () => {
    const params = [{ name: 'reason', label: 'Reason', type: 'text' }];
    const fetchApi = createMockFetchApi({
      '/api/playbook/pb1/params': { ok: true, json: () => ({ params }) },
    });
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi,
    });

    const result = await client.getPlaybookParams('pb1', 'cfg1');
    expect(result).toEqual(params);
    expect(fetchApi.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/playbook/pb1/params'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('submitPlaybookRun POSTs to /api/playbook/run', async () => {
    const response = { run_id: 'run1', starts_at: '2026-01-01T00:00:00Z' };
    const fetchApi = createMockFetchApi({
      '/api/playbook/run': { ok: true, json: () => response },
    });
    const client = new MissionControlClient({
      discoveryApi: createMockDiscoveryApi(),
      fetchApi,
    });

    const result = await client.submitPlaybookRun('pb1', 'cfg1', { reason: 'test' });
    expect(result).toEqual(response);
    expect(fetchApi.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/playbook/run'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
