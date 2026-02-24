import { ConfigReader } from '@backstage/config';
import { MissionControlAuth } from './auth';

jest.mock('node-fetch', () => jest.fn());
const mockedFetch = require('node-fetch') as jest.Mock;

describe('MissionControlAuth', () => {
  afterEach(() => {
    mockedFetch.mockReset();
  });

  describe('static-token method', () => {
    it('returns the configured apiToken', async () => {
      const config = new ConfigReader({
        missionControl: {
          baseUrl: 'https://mc.example.com',
          auth: { method: 'static-token', apiToken: 'my-token' },
        },
      });
      const auth = new MissionControlAuth(config);
      expect(await auth.getToken()).toBe('my-token');
    });

    it('throws when apiToken is missing', async () => {
      const config = new ConfigReader({
        missionControl: {
          baseUrl: 'https://mc.example.com',
          auth: { method: 'static-token' },
        },
      });
      const auth = new MissionControlAuth(config);
      await expect(auth.getToken()).rejects.toThrow('apiToken is required');
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

      const token1 = await auth.getToken('user:default/john');
      expect(token1).toBe('exchanged-token');
      expect(mockedFetch).toHaveBeenCalledTimes(1);

      const token2 = await auth.getToken('user:default/john');
      expect(token2).toBe('exchanged-token');
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
      await expect(auth.getToken('user:default/john')).rejects.toThrow('Token exchange failed: 401 Unauthorized');
    });

    it('throws when serviceAccountToken is missing', async () => {
      const config = new ConfigReader({
        missionControl: {
          baseUrl: 'https://mc.example.com',
          auth: { method: 'token-exchange' },
        },
      });

      const auth = new MissionControlAuth(config);
      await expect(auth.getToken()).rejects.toThrow('serviceAccountToken is required');
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
    expect(await auth.getToken()).toBe('default-token');
  });
});
