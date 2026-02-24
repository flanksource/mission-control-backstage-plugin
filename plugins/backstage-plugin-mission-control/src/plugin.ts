import {
  createPlugin,
  createApiFactory,
  createComponentExtension,
  createRouteRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { missionControlApiRef } from './api/types';
import { MissionControlClient } from './api/MissionControlClient';

export const rootRouteRef = createRouteRef({ id: 'mission-control' });

export const missionControlPlugin = createPlugin({
  id: 'mission-control',
  apis: [
    createApiFactory({
      api: missionControlApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new MissionControlClient({ discoveryApi, fetchApi }),
    }),
  ],
  routes: { root: rootRouteRef },
});

export const EntityMissionControlContent = missionControlPlugin.provide(
  createComponentExtension({
    name: 'EntityMissionControlContent',
    component: {
      lazy: () =>
        import('./components/EntityMissionControlContent/EntityMissionControlContent').then(
          m => m.EntityMissionControlContent,
        ),
    },
  }),
);

export const EntityMissionControlCard = missionControlPlugin.provide(
  createComponentExtension({
    name: 'EntityMissionControlCard',
    component: {
      lazy: () =>
        import('./components/EntityMissionControlCard/EntityMissionControlCard').then(
          m => m.EntityMissionControlCard,
        ),
    },
  }),
);
