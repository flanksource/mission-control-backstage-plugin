import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { createApiFactory, configApiRef } from '@backstage/core-plugin-api';
import { CatalogIndexPage, CatalogEntityPage } from '@backstage/plugin-catalog';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { ScmIntegrationsApi, scmIntegrationsApiRef } from '@backstage/integration-react';
import { entityPage } from './components/catalog/EntityPage';

const app = createApp({
  apis: [
    createApiFactory({
      api: scmIntegrationsApiRef,
      deps: { configApi: configApiRef },
      factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
    }),
  ],
});

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <FlatRoutes>
        <Route path="/" element={<Navigate to="/catalog" />} />
        <Route path="/catalog" element={<CatalogIndexPage />} />
        <Route
          path="/catalog/:namespace/:kind/:name"
          element={<CatalogEntityPage />}
        >
          {entityPage}
        </Route>
        <Route path="/settings" element={<UserSettingsPage />} />
      </FlatRoutes>
    </AppRouter>
  </>,
);
