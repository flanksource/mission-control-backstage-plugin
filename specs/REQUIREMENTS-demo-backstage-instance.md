# Feature: Demo Backstage Instance with Mission Control Plugin

## Overview

A demo Backstage application that showcases the `@flanksource/backstage-plugin-mission-control` frontend and backend plugins in a working Backstage environment. It serves triple duty: customer demos/sales, developer onboarding for plugin installation, and internal integration testing before releases.

The demo connects to the live `demo.flanksource.com` Mission Control instance using a static API token, with 5-8 pre-configured catalog entities using real config IDs from that instance.

## Architecture

```
mission-control-backstage-plugin/
├── plugins/                          # Existing plugin packages
│   ├── backstage-plugin-mission-control/
│   └── backstage-plugin-mission-control-backend/
├── demo/                             # New: demo Backstage app
│   ├── app-config.yaml              # Backstage config (MC + K8s plugin)
│   ├── app-config.local.yaml.example # Template with env var placeholders
│   ├── packages/
│   │   ├── app/                     # Frontend app (EntityPage with MC plugin)
│   │   └── backend/                 # Backend app (MC backend plugin registered)
│   ├── catalog/                     # Static entity YAML files
│   │   ├── k8s-workloads.yaml      # K8s Deployments/Services
│   │   ├── cloud-resources.yaml    # AWS/GCP entities
│   │   └── unannotated.yaml        # Entities without MC annotations
│   ├── package.json                 # Workspace root for demo
│   └── README.md                    # Full installation + usage guide
├── specs/
└── package.json                     # Root monorepo
```

## Functional Requirements

### FR-1: Backstage App Scaffolding (Latest Stable)
**Description**: Create a standard Backstage app using `@backstage/create-app` targeting the latest stable release (1.35+), with the new backend system.
**Acceptance Criteria**:
- [ ] Demo app created via `@backstage/create-app` or equivalent scaffolding
- [ ] Uses Backstage latest stable (1.35+) with new backend system
- [ ] `yarn install && yarn dev` starts the app successfully
- [ ] App is in `demo/` directory, references plugins via relative paths (not published packages)

### FR-2: Mission Control Plugin Integration
**Description**: Wire the MC frontend and backend plugins into the demo Backstage app so they function end-to-end.
**Acceptance Criteria**:
- [ ] Backend plugin registered in `demo/packages/backend/src/index.ts`
- [ ] Frontend plugin imported in `demo/packages/app/src/components/catalog/EntityPage.tsx`
- [ ] `EntityMissionControlCard` rendered on entity overview tab (guarded by `isMissionControlAvailable`)
- [ ] `EntityMissionControlContent` rendered as a "Mission Control" entity tab (guarded by `isMissionControlAvailable`)
- [ ] Plugin resolves API via `discoveryApi` pointing to backend plugin

### FR-3: Mission Control Backend Configuration
**Description**: Configure the backend plugin to connect to `demo.flanksource.com` using static token auth.
**Acceptance Criteria**:
- [ ] `app-config.yaml` contains `missionControl.baseUrl: https://demo.flanksource.com`
- [ ] `app-config.yaml` uses `missionControl.auth.method: static-token`
- [ ] API token read from `MC_API_TOKEN` environment variable (not hardcoded)
- [ ] `app-config.local.yaml.example` provided as template showing required env vars
- [ ] Backend health endpoint `/api/mission-control/health` returns OK when configured

### FR-4: Static Catalog with Real Entity Data
**Description**: Pre-configure 5-8 catalog entities that map to real config IDs in `demo.flanksource.com`, demonstrating different annotation patterns.
**Acceptance Criteria**:
- [ ] 2-3 Kubernetes workload entities with `flanksource.com/config-type` annotations (e.g., `Kubernetes::Deployment`)
- [ ] 2-3 cloud resource entities with `flanksource.com/config-id` annotations (real UUIDs from demo instance)
- [ ] 1-2 unannotated entities to demonstrate `isMissionControlAvailable` filtering (no MC tab/card shown)
- [ ] At least one entity uses `flanksource.com/config-ids` (multiple configs) annotation
- [ ] At least one entity uses `flanksource.com/aggregation-depth` annotation
- [ ] All annotated entities render data from `demo.flanksource.com` when token is configured
- [ ] Entities organized in separate YAML files by type under `demo/catalog/`

### FR-5: Kubernetes Plugin Co-installation
**Description**: Include the standard Backstage Kubernetes plugin alongside MC to demonstrate complementary views.
**Acceptance Criteria**:
- [ ] `@backstage/plugin-kubernetes` and `@backstage/plugin-kubernetes-backend` installed
- [ ] K8s plugin visible on entity pages for Kubernetes-type entities
- [ ] MC plugin tab and K8s plugin tab coexist on the same entity without conflicts
- [ ] K8s plugin can be non-functional (no cluster configured) without breaking the demo

### FR-6: Full README with Installation Guide
**Description**: Comprehensive README covering how to run the demo AND how to install the MC plugin into an existing Backstage app.
**Acceptance Criteria**:
- [ ] **Demo Quick Start**: Prerequisites (Node 20+, yarn), clone, env vars, `yarn install && yarn dev`
- [ ] **Plugin Installation Guide**: Step-by-step for adding MC plugin to existing Backstage app
  - [ ] Package installation commands (`yarn add @flanksource/backstage-plugin-mission-control`)
  - [ ] `app-config.yaml` snippet for `missionControl` configuration
  - [ ] `EntityPage.tsx` code snippet showing card + tab integration with `isMissionControlAvailable`
  - [ ] Backend registration snippet for `packages/backend/src/index.ts`
- [ ] **Annotation Reference**: Table of all `flanksource.com/*` annotations with descriptions and examples
- [ ] **Troubleshooting**: Common issues (token not set, MC unreachable, no entities showing)

## User Interactions

### For Customer Demos
1. Clone repo, set `MC_API_TOKEN` env var
2. `yarn install && yarn dev`
3. Open Backstage at `localhost:3000`
4. Navigate to catalog, click a K8s workload entity
5. See "Mission Control" overview card with health/cost/changes summary
6. Click "Mission Control" tab to see config items table and health checks table
7. Click an unannotated entity - no MC card/tab shown (clean filtering)

### For Developer Onboarding
1. Follow README's "Plugin Installation Guide" section
2. Copy `app-config.yaml` snippet into their Backstage instance
3. Copy `EntityPage.tsx` snippet into their entity page
4. Register backend plugin
5. Add `flanksource.com/*` annotations to their catalog entities
6. Verify plugin renders their MC data

### For Internal Testing
1. `yarn install && yarn dev`
2. Verify all annotated entities show MC data from `demo.flanksource.com`
3. Verify unannotated entities correctly hide MC components
4. Verify different annotation patterns (single ID, multiple IDs, type+name) all resolve

## Technical Considerations

- **Plugin References**: `demo/` uses relative path dependencies to plugin packages (`"@flanksource/backstage-plugin-mission-control": "link:../../plugins/backstage-plugin-mission-control"`)
- **Backstage Version**: Latest stable (1.35+), new backend system (`backend.add(import(...)`)
- **Auth**: Static token only for demo simplicity; token-exchange documented but not configured
- **No Database**: Use SQLite (Backstage default) for catalog, no external DB required
- **K8s Plugin**: Installed but non-functional (no cluster config) - demonstrates coexistence only

## Success Criteria

- [ ] `yarn install && yarn dev` in `demo/` starts Backstage with MC plugin in under 2 minutes
- [ ] With valid `MC_API_TOKEN`, annotated entities show real config health, costs, changes, and checks from `demo.flanksource.com`
- [ ] Unannotated entities show no MC card or tab
- [ ] A developer can follow the README to add the MC plugin to a fresh Backstage app without additional help
- [ ] Demo works on macOS and Linux with Node 20+

## Testing Requirements

- **Smoke test**: `yarn dev` starts without errors, catalog loads, entities render
- **Integration test**: Annotated entity fetches and displays MC data (requires valid token)
- **Filtering test**: Unannotated entities do not show MC components
- **Multi-annotation test**: Entity with `config-ids` (multiple) renders multiple config rows
- **Coexistence test**: K8s plugin tab and MC plugin tab render on same entity

## Implementation Checklist

### Phase 1: Scaffold Demo App
- [ ] Create `demo/` directory with Backstage app (latest stable)
- [ ] Configure yarn workspaces to include `demo/packages/*`
- [ ] Link plugin packages via relative paths
- [ ] Verify `yarn install` resolves all dependencies

### Phase 2: Wire Plugins
- [ ] Register MC backend plugin in `demo/packages/backend/src/index.ts`
- [ ] Import MC frontend components in `EntityPage.tsx`
- [ ] Add `isMissionControlAvailable` guards on card and tab
- [ ] Configure `app-config.yaml` with `missionControl` section
- [ ] Install and configure K8s plugin (frontend only, no backend cluster config)

### Phase 3: Catalog Entities
- [ ] Query `demo.flanksource.com` for real config IDs to use in entities
- [ ] Create `demo/catalog/k8s-workloads.yaml` (2-3 entities with `config-type`)
- [ ] Create `demo/catalog/cloud-resources.yaml` (2-3 entities with `config-id`/`config-ids`)
- [ ] Create `demo/catalog/unannotated.yaml` (1-2 entities without MC annotations)
- [ ] Register catalog locations in `app-config.yaml`

### Phase 4: Documentation
- [ ] Write demo Quick Start section in README
- [ ] Write Plugin Installation Guide section
- [ ] Write Annotation Reference table
- [ ] Write Troubleshooting section
- [ ] Create `app-config.local.yaml.example`

### Phase 5: Verification
- [ ] Test `yarn dev` cold start
- [ ] Test with valid `MC_API_TOKEN` against `demo.flanksource.com`
- [ ] Test unannotated entity filtering
- [ ] Test all annotation patterns render correctly
- [ ] Test K8s plugin coexistence
