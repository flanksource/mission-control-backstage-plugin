import { Router } from 'express';
import { MissionControlClient } from './client';

export function createRouter(client: MissionControlClient): Router {
  const router = Router();

  router.get('/api/db/configs', async (req, res) => {
    const response = await client.fetch(`/api/db/configs?${new URLSearchParams(req.query as Record<string, string>).toString()}`);
    const data = await response.json();
    res.set('Content-Range', response.headers.get('Content-Range') ?? '');
    res.json(data);
  });

  router.post('/api/catalog/summary', async (req, res) => {
    const response = await client.fetch('/api/catalog/summary', {
      init: { method: 'POST', body: JSON.stringify(req.body) },
    });
    res.json(await response.json());
  });

  router.post('/api/catalog/changes', async (req, res) => {
    const response = await client.fetch('/api/catalog/changes', {
      init: { method: 'POST', body: JSON.stringify(req.body) },
    });
    res.json(await response.json());
  });

  router.get('/api/db/rpc/related_configs_recursive', async (req, res) => {
    const response = await client.fetch(
      `/api/db/rpc/related_configs_recursive?${new URLSearchParams(req.query as Record<string, string>).toString()}`,
    );
    res.json(await response.json());
  });

  router.get('/api/db/check_summary_for_config', async (req, res) => {
    const response = await client.fetch(
      `/api/db/check_summary_for_config?${new URLSearchParams(req.query as Record<string, string>).toString()}`,
      { init: { headers: { Prefer: 'count=exact' } } },
    );
    const data = await response.json();
    res.set('Content-Range', response.headers.get('Content-Range') ?? '');
    res.json(data);
  });

  router.post('/api/resources/search', async (req, res) => {
    const response = await client.fetch('/api/resources/search', {
      init: { method: 'POST', body: JSON.stringify(req.body) },
    });
    res.json(await response.json());
  });

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}
