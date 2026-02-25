# Mission Control Backstage Plugin

Backstage plugins for [Flanksource Mission Control](https://flanksource.com) - view config health, changes, costs, and health checks directly in Backstage entity pages.

## Packages

| Package | Description |
|---------|-------------|
| [`@flanksource/backstage-plugin-mission-control`](./plugins/backstage-plugin-mission-control) | Frontend plugin - entity cards, tabs, and tables |
| [`@flanksource/backstage-plugin-mission-control-backend`](./plugins/backstage-plugin-mission-control-backend) | Backend plugin - MC API proxy with auth |

## Quick Start (Demo)

The `demo/` directory contains a complete Backstage app with the plugin pre-installed, pointing at `demo.flanksource.com`.

### Prerequisites

- Node.js 20+
- Yarn 1.x (`npm install -g yarn`)

### Run

```bash
cd demo
export MC_API_TOKEN="your-mission-control-api-token"
yarn install
yarn dev
```

Open http://localhost:3000 and navigate to the catalog. Annotated entities will show a Mission Control card on the overview tab and a dedicated Mission Control tab.

## Installing in Your Backstage App

### 1. Install packages

```bash
# Frontend
yarn --cwd packages/app add @flanksource/backstage-plugin-mission-control

# Backend
yarn --cwd packages/backend add @flanksource/backstage-plugin-mission-control-backend
```

### 2. Register the backend plugin

```typescript
// packages/backend/src/index.ts
const backend = createBackend();
// ... other plugins
backend.add(import('@flanksource/backstage-plugin-mission-control-backend'));
backend.start();
```

### 3. Add to your EntityPage

```tsx
// packages/app/src/components/catalog/EntityPage.tsx
import {
  EntityMissionControlContent,
  EntityMissionControlCard,
  isMissionControlAvailable,
} from '@flanksource/backstage-plugin-mission-control';

// Add the card to your overview tab:
<EntitySwitch>
  <EntitySwitch.Case if={isMissionControlAvailable}>
    <Grid item md={12}>
      <EntityMissionControlCard />
    </Grid>
  </EntitySwitch.Case>
</EntitySwitch>

// Add a dedicated tab:
<EntityLayout.Route
  path="/mission-control"
  title="Mission Control"
  if={isMissionControlAvailable}
>
  <EntityMissionControlContent />
</EntityLayout.Route>
```

### 4. Configure `app-config.yaml`

```yaml
missionControl:
  baseUrl: https://your-mission-control-instance.example.com
  auth:
    method: static-token
    apiToken: ${MC_API_TOKEN}
```

### 5. Annotate your catalog entities

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    flanksource.com/config-id: "your-config-uuid"
spec:
  type: service
  lifecycle: production
  owner: my-team
```

## Annotation Reference

| Annotation | Description | Example |
|------------|-------------|---------|
| `flanksource.com/config-id` | Single config item UUID | `"8555f73a-2d9c-46d3-b881-ac8b57347bee"` |
| `flanksource.com/config-ids` | Multiple config UUIDs (comma-separated) | `"uuid1,uuid2,uuid3"` |
| `flanksource.com/config-type` | Config type for name-based matching | `"Kubernetes::Deployment"` |
| `flanksource.com/config-name` | Config name (used with config-type) | `"argocd-server"` |
| `flanksource.com/check-id` | Direct health check UUID | `"uuid"` |
| `flanksource.com/aggregation-depth` | Related config depth (0=self, 1=direct, 2+=recursive) | `"1"` |

**Resolution order:** `config-id` > `config-ids` > `config-type` + `config-name` > entity name fallback.

## Auth Methods

### Static Token (recommended for most setups)

```yaml
missionControl:
  baseUrl: https://mc.example.com
  auth:
    method: static-token
    apiToken: ${MC_API_TOKEN}
```

The token is sent as HTTP Basic Auth (`token:<apiToken>`).

### Token Exchange (for multi-tenant setups)

```yaml
missionControl:
  baseUrl: https://mc.example.com
  auth:
    method: token-exchange
    serviceAccountToken: ${MC_SERVICE_ACCOUNT_TOKEN}
```

Exchanges Backstage user identity for a Mission Control session token, cached per-user.

## What You Get

### Overview Card (`EntityMissionControlCard`)
- Overall health indicator (worst status across configs)
- Healthy / unhealthy / warning counts
- 30-day cost total
- Recent change count
- Health check pass/fail ratio

### Entity Tab (`EntityMissionControlContent`)
- **Config Items table**: Name, Type, Health, Changes, Cost (30d), Updated
- **Health Checks table**: Name, Type, Status, Severity, Last Run

### Availability Filter (`isMissionControlAvailable`)
Entities without `flanksource.com/*` annotations automatically hide the MC card and tab.

## Troubleshooting

### "Authorization Error" or 401 responses
- Verify `MC_API_TOKEN` is set: `echo $MC_API_TOKEN`
- Test the token directly: `curl -u "token:$MC_API_TOKEN" https://your-mc-instance/api/db/configs?limit=1`

### No Mission Control card or tab on entity
- The entity must have at least one of: `flanksource.com/config-id`, `flanksource.com/config-ids`, or `flanksource.com/config-type`
- Check entity YAML annotations in the Backstage catalog

### "Config not found" errors
- Verify the config UUID exists in Mission Control
- Query configs: `curl -u "token:$MC_API_TOKEN" https://your-mc-instance/api/db/configs?select=id,name,type&limit=20`

### Backend plugin not loading
- Ensure `backend.add(import('@flanksource/backstage-plugin-mission-control-backend'))` is in your backend's `index.ts`
- Check backend logs for `Mission Control backend plugin initialized`

### CORS errors
- The backend plugin proxies all requests - the browser should never call MC directly
- Verify `backend.csp.connect-src` includes `'self'` in `app-config.yaml`

## Development

```bash
# Install all dependencies
yarn install

# Build plugins
yarn build

# Run tests
yarn test
```

## License

Apache-2.0
