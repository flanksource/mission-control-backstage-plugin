import { createBackendPlugin, coreServices } from '@backstage/backend-plugin-api';
import { MissionControlAuth } from './auth';
import { MissionControlClient } from './client';
import { createRouter } from './router';

export const missionControlBackendPlugin = createBackendPlugin({
  pluginId: 'mission-control',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
      },
      async init({ config, logger, httpRouter }) {
        const baseUrl = config.getString('missionControl.baseUrl');
        const auth = new MissionControlAuth(config);
        const client = new MissionControlClient(baseUrl, auth);

        logger.info(`Mission Control backend plugin initialized (baseUrl: ${baseUrl}, auth: ${auth.method})`);

        httpRouter.use(createRouter(client, { method: auth.method, baseUrl }));
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/auth/config',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
