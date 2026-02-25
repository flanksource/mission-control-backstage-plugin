import fetch from 'node-fetch';
import { Config } from '@backstage/config';

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class MissionControlAuth {
  private tokenCache = new Map<string, CachedToken>();
  private baseUrl: string;
  private authMethod: string;
  private serviceAccountToken?: string;
  private apiToken?: string;

  constructor(config: Config) {
    this.baseUrl = config.getString('missionControl.baseUrl');
    this.authMethod = config.getOptionalString('missionControl.auth.method') ?? 'static-token';
    this.serviceAccountToken = config.getOptionalString('missionControl.auth.serviceAccountToken');
    this.apiToken = config.getOptionalString('missionControl.auth.apiToken');
  }

  async getAuthHeader(userRef?: string): Promise<string> {
    if (this.authMethod === 'static-token') {
      if (!this.apiToken) {
        throw new Error('missionControl.auth.apiToken is required for static-token auth');
      }
      return `Basic ${Buffer.from(`token:${this.apiToken}`).toString('base64')}`;
    }

    const cacheKey = userRef ?? '__service__';
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return `Bearer ${cached.token}`;
    }

    const token = await this.exchangeToken(cacheKey);
    return `Bearer ${token}`;
  }

  private async exchangeToken(cacheKey: string): Promise<string> {
    if (!this.serviceAccountToken) {
      throw new Error('missionControl.auth.serviceAccountToken is required for token-exchange auth');
    }

    const response = await fetch(`${this.baseUrl}/api/auth/token-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.serviceAccountToken}`,
      },
      body: JSON.stringify({ userRef: cacheKey }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { token: string; expiresAt?: string };
    const expiresAt = data.expiresAt
      ? new Date(data.expiresAt).getTime() - 30_000
      : Date.now() + 3600_000;

    this.tokenCache.set(cacheKey, { token: data.token, expiresAt });
    return data.token;
  }
}
