import React from 'react';
import { Grid } from '@material-ui/core';
import {
  EntityAboutCard,
  EntityLayout,
  EntitySwitch,
  isKind,
} from '@backstage/plugin-catalog';
import { EntityLinksCard } from '@backstage/plugin-catalog';
import {
  EntityKubernetesContent,
  isKubernetesAvailable,
} from '@backstage/plugin-kubernetes';
import {
  EntityMissionControlContent,
  EntityMissionControlCard,
  isMissionControlAvailable,
} from '@flanksource/backstage-plugin-mission-control';

const overviewContent = (
  <Grid container spacing={3} alignItems="stretch">
    <Grid item md={6}>
      <EntityAboutCard variant="gridItem" />
    </Grid>
    <Grid item md={6}>
      <EntityLinksCard />
    </Grid>
    <EntitySwitch>
      <EntitySwitch.Case if={isMissionControlAvailable}>
        <Grid item md={12}>
          <EntityMissionControlCard />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);

const componentEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>
    <EntityLayout.Route
      path="/mission-control"
      title="Mission Control"
      if={isMissionControlAvailable}
    >
      <EntityMissionControlContent />
    </EntityLayout.Route>
    <EntityLayout.Route
      path="/kubernetes"
      title="Kubernetes"
      if={isKubernetesAvailable}
    >
      <EntityKubernetesContent />
    </EntityLayout.Route>
  </EntityLayout>
);

const defaultEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>
  </EntityLayout>
);

export const entityPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('component')}>
      {componentEntityPage}
    </EntitySwitch.Case>
    <EntitySwitch.Case if={isKind('resource')}>
      {componentEntityPage}
    </EntitySwitch.Case>
    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);
