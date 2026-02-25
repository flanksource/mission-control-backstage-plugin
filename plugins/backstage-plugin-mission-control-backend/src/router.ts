import { Router, Request, Response, NextFunction } from 'express';
import { MissionControlClient } from './client';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

function queryString(query: Record<string, any>): string {
  return new URLSearchParams(query as Record<string, string>).toString();
}

function proxyGet(client: MissionControlClient, path: string, opts?: { headers?: Record<string, string> }) {
  return asyncHandler(async (req, res) => {
    const qs = queryString(req.query);
    const response = await client.fetch(`${path}${qs ? `?${qs}` : ''}`, { init: { headers: opts?.headers } });
    const data = await response.json();
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) res.set('Content-Range', contentRange);
    res.json(data);
  });
}

function proxyPost(client: MissionControlClient, path: string) {
  return asyncHandler(async (req, res) => {
    const response = await client.fetch(path, {
      init: { method: 'POST', body: JSON.stringify(req.body) },
    });
    res.json(await response.json());
  });
}

export function createRouter(client: MissionControlClient): Router {
  const router = Router();

  router.get('/api/db/configs', proxyGet(client, '/api/db/configs'));
  router.get('/api/db/config_detail', proxyGet(client, '/api/db/config_detail'));
  router.get('/api/db/config_changes', proxyGet(client, '/api/db/config_changes'));
  router.get('/api/db/rpc/related_configs_recursive', proxyGet(client, '/api/db/rpc/related_configs_recursive'));
  router.get('/api/db/check_summary_for_config', proxyGet(client, '/api/db/check_summary_for_config', { headers: { Prefer: 'count=exact' } }));
  router.get('/api/db/playbook_runs', proxyGet(client, '/api/db/playbook_runs'));
  router.get('/api/db/config_access_summary', proxyGet(client, '/api/db/config_access_summary'));

  router.post('/api/catalog/summary', proxyPost(client, '/api/catalog/summary'));
  router.post('/api/catalog/changes', proxyPost(client, '/api/catalog/changes'));
  router.post('/api/resources/search', proxyPost(client, '/api/resources/search'));

  router.get('/health', (_req, res) => { res.json({ status: 'ok' }); });

  router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message });
  });

  return router;
}
