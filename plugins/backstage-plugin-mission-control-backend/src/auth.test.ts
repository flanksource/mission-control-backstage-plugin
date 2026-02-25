import { ConfigReader } from '@backstage/config';
import { MissionControlAuth } from './auth';

jest.mock('node-fetch', () => jest.fn());
const mockedFetch = require('node-fetch') as jest.Mock;

describe('MissionControlAuth', () => {
  afterEach(() => {
    mockedFetch.mockReset();
  });

  describe('static-token method', () => {
    it('returns Basic auth header with token', async () => {
      const config = new ConfigReader({
        missionControl: {
          baseUrl: 'https://mc.example.com',
          auth: { method: 'static-token', apiToken: 'my-token' },
        },
      });
      const auth = new MissionControlAuth(config);
      const header = await auth.getAuthHeader();
      expect(header).toBe(`Basic ${Buffer.from('token:my-token').toString('base64')}`);
    });

    it('throws when apiToken is missing', async () => {
      const config = new ConfigReader({
        missionControl: {
          baseUrl: 'https://mc.example.com',
          auth: { method: 'static-token' },
        },
      });
      const auth = new MissionControlAuth(config);
      await expect(auth.getAuthHeader()).rejects.toThrow('apiToken is required');
    });
  });

  describe('token-exchange method', () => {
    it('exchanges token and caches result', async () => {
      const config = new ConfigReader({
        missionControl: {
          baseUrl: 'https://mc.example.com',
          auth: { method: 'token-exchange', serviceAccountToken: 'sa-token' },
        },
      });

      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'exchanged-token', expiresAt: new Date(Date.now() + 3600_000).toISOString() }),
      });

      const auth = new MissionControlAuth(config);

      const header1 = await auth.getAuthHeader('user:default/john');
      expect(header1).toBe('Bearer exchanged-token');
      expect(mockedFetch).toHaveBeenCalledTimes(1);

      const header2 = await auth.getAuthHeader('user:default/john');
      expect(header2).toBe('Bearer exchanged-token');
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('throws on failed exchange', async () => {
      const config = new ConfigReader({
        missionControl: {
          baseUrl: 'https://mc.example.com',
          auth: { method: 'token-exchange', serviceAccountToken: 'sa-token' },
        },
      });

      mockedFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const auth = new MissionControlAuth(config);
      await expect(auth.getAuthHeader('user:default/john')).rejects.toThrow('Token exchange failed: 401 Unauthorized');
    });

    it('throws when serviceAccountToken is missing', async () => {
      const config = new ConfigReader({
        missionControl: {
          baseUrl: 'https://mc.example.com',
          auth: { method: 'token-exchange' },
        },
      });

      const auth = new MissionControlAuth(config);
      await expect(auth.getAuthHeader()).rejects.toThrow('serviceAccountToken is required');
    });
  });

  it('defaults to static-token method', async () => {
    const config = new ConfigReader({
      missionControl: {
        baseUrl: 'https://mc.example.com',
        auth: { apiToken: 'default-token' },
      },
    });
    const auth = new MissionControlAuth(config);
    const header = await auth.getAuthHeader();
    expect(header).toBe(`Basic ${Buffer.from('token:default-token').toString('base64')}`);
  });
});
