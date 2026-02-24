import fetch, { RequestInit, Response } from 'node-fetch';
import { MissionControlAuth } from './auth';

export class MissionControlClient {
  constructor(
    private baseUrl: string,
    private auth: MissionControlAuth,
  ) {}

  async fetch(path: string, options: { userRef?: string; init?: RequestInit } = {}): Promise<Response> {
    const token = await this.auth.getToken(options.userRef);
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options.init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Mission Control API error: ${response.status} ${response.statusText} for ${path}`);
    }

    return response;
  }
}
