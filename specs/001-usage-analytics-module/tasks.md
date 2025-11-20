---
description: "Task list for Directus Usage Analytics Bundle Extension"
---

# Tasks: Directus Usage Analytics Bundle Extension

**Input**: Design documents from `/specs/001-usage-analytics-module/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/, research.md, quickstart.md

**Extension Type**: Bundle (Module + Endpoint)
**Tests**: Tests are included as specified in Constitution Check III (≥80% coverage target)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Bundle Extension**: `src/module/`, `src/endpoint/`, `src/shared/` at repository root
- Frontend (Module): Compiled to `dist/app.js`
- Backend (Endpoint): Compiled to `dist/api.js`
- Paths shown below follow Bundle Extension structure

---

## Phase 1: Setup (Bundle Extension Initialization)

**Purpose**: Initialize Directus Bundle Extension with proper configuration for publishing

- [X] T001 Initialize bundle extension using npx create-directus-extension@latest (type: bundle, name: directus-extension-usage-analytics)
- [X] T002 Configure package.json with bundle configuration, keywords, and host versions
- [X] T003 Add module extension to bundle using npm run add (type: module, name: usage-analytics)
- [X] T004 Add endpoint extension to bundle using npm run add (type: endpoint, name: usage-analytics-api)
- [X] T005 [P] Configure tsconfig.json with strict mode and proper module resolution
- [X] T006 [P] Install dependencies: chart.js, vue-chart-3, @directus/sdk
- [X] T007 [P] Configure ESLint with TypeScript, Vue, and Prettier rules
- [X] T008 [P] Set up Vitest configuration for testing
- [X] T009 [P] Create .gitignore file with dist/, node_modules/, .DS_Store
- [X] T010 [P] Create LICENSE file (MIT license for community adoption)
- [X] T011 [P] Initialize CHANGELOG.md with v1.0.0 entry

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T012 Create shared TypeScript interfaces in src/shared/types.ts (DirectusActivity, DirectusCollection, CollectionUsage, ActivityStatistics)
- [X] T013 [P] Create shared constants in src/shared/constants.ts (cache TTL, pagination defaults, API routes)
- [X] T014 [P] Create shared validators in src/shared/validators.ts (input validation functions)
- [X] T015 [P] Create database helpers in src/endpoint/utils/database-helpers.ts (cross-database COUNT compatibility, Knex query builders)
- [X] T016 [P] Create chart helpers in src/module/utils/chart-helpers.ts (Chart.js configuration generators)
- [X] T017 [P] Create data formatters in src/module/utils/data-formatters.ts (number formatting, date formatting)
- [X] T018 Implement cache service in src/endpoint/services/cache-service.ts (optional Redis caching with 5-minute TTL)
- [X] T019 [P] Set up Endpoint entry point in src/endpoint/index.ts (defineEndpoint with router setup)
- [X] T020 [P] Set up Module entry point in src/module/index.ts (defineModule with routes configuration)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Collection Storage Analysis (Priority: P1) 🎯 MVP

**Goal**: Display row counts for all collections (including system tables) with visual chart and Top 10 filter

**Independent Test**: Admin opens module → sees all collections with row counts → bar chart displays → Top 10 filter works

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T021 [P] [US1] Contract test for GET /usage-analytics-api/collections endpoint in tests/contract/collections-api.test.ts
- [X] T022 [P] [US1] Integration test for collection service aggregation in tests/integration/collection-service.test.ts
- [X] T023 [P] [US1] Unit test for CollectionChart component in tests/unit/components/CollectionChart.test.ts
- [X] T024 [P] [US1] Unit test for chart helpers in tests/unit/utils/chart-helpers.test.ts

### Backend Implementation for User Story 1

- [X] T025 [P] [US1] Implement CollectionService in src/endpoint/services/collection-service.ts (query all collections, get row counts via Knex)
- [X] T026 [P] [US1] Create query builders in src/endpoint/utils/query-builders.ts (COUNT query builder with cross-database compatibility)
- [X] T027 [US1] Implement GET /collections route in src/endpoint/routes/collections.ts (fetch collections, aggregate counts, sort by row_count)
- [X] T028 [US1] Register collections route in src/endpoint/index.ts router

### Frontend Implementation for User Story 1

- [ ] T029 [P] [US1] Create useCollectionAnalytics composable in src/module/composables/use-collection-analytics.ts (API calls, state management)
- [ ] T030 [P] [US1] Create CollectionChart component in src/module/components/CollectionChart.vue (Bar chart with Chart.js)
- [ ] T031 [P] [US1] Create TopTenToggle component in src/module/components/TopTenToggle.vue (Filter toggle for Top N)
- [ ] T032 [P] [US1] Create CollectionView component in src/module/views/CollectionView.vue (Main collection storage view with chart and table)
- [ ] T033 [US1] Create AnalyticsDashboard component in src/module/views/AnalyticsDashboard.vue (Main dashboard with tabs)
- [ ] T034 [US1] Configure routes in src/module/routes.ts (default route to collection view)
- [ ] T035 [US1] Update module entry point in src/module/index.ts with routes

### Polish for User Story 1

- [ ] T036 [US1] Add error handling for collection queries (handle permissions errors, empty collections)
- [ ] T037 [US1] Add loading states and error messages to UI components
- [ ] T038 [US1] Add JSDoc comments to all exported functions in collection service and composable

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - API Request Activity Analysis (Priority: P2)

**Goal**: Analyze directus_activity table to show API request patterns by collection with Top 10 filter

**Independent Test**: Admin switches to Activity tab → sees request counts by collection → Top 10 filter works

### Tests for User Story 2

- [ ] T039 [P] [US2] Contract test for GET /usage-analytics-api/activity endpoint in tests/contract/activity-api.test.ts
- [ ] T040 [P] [US2] Integration test for activity service aggregation in tests/integration/activity-service.test.ts
- [ ] T041 [P] [US2] Unit test for ActivityChart component in tests/unit/components/ActivityChart.test.ts

### Backend Implementation for User Story 2

- [ ] T042 [P] [US2] Implement ActivityService in src/endpoint/services/activity-service.ts (query directus_activity, aggregate by collection)
- [ ] T043 [US2] Implement GET /activity route in src/endpoint/routes/activity.ts (aggregate requests, filter by collection, Top 10)
- [ ] T044 [US2] Register activity route in src/endpoint/index.ts router

### Frontend Implementation for User Story 2

- [ ] T045 [P] [US2] Create useActivityAnalytics composable in src/module/composables/use-activity-analytics.ts (API calls for activity data)
- [ ] T046 [P] [US2] Create ActivityChart component in src/module/components/ActivityChart.vue (Bar/Pie chart for activity)
- [ ] T047 [P] [US2] Create FilterPanel component in src/module/components/FilterPanel.vue (Collection filter, date range, Top N)
- [ ] T048 [US2] Create ActivityView component in src/module/views/ActivityView.vue (Activity tab with filters and chart)
- [ ] T049 [US2] Add activity route to src/module/routes.ts
- [ ] T050 [US2] Update AnalyticsDashboard to include Activity tab

### Polish for User Story 2

- [ ] T051 [US2] Add date range filtering (last 7 days, last 30 days, custom)
- [ ] T052 [US2] Add action breakdown chart (create, read, update, delete counts)
- [ ] T053 [US2] Add JSDoc comments to activity service and composable

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - IP-Based Traffic Analysis (Priority: P3)

**Goal**: Filter activity by IP address to identify specific client/integration patterns

**Independent Test**: Admin filters by IP → sees requests from that IP → collection breakdown shown

### Tests for User Story 3

- [ ] T054 [P] [US3] Contract test for GET /usage-analytics-api/activity/ips/:ip endpoint in tests/contract/ip-activity-api.test.ts
- [ ] T055 [P] [US3] Integration test for IP filtering in activity service in tests/integration/activity-service.test.ts
- [ ] T056 [P] [US3] Unit test for IP filter component in tests/unit/components/FilterPanel.test.ts

### Backend Implementation for User Story 3

- [ ] T057 [US3] Extend ActivityService with IP filtering methods in src/endpoint/services/activity-service.ts
- [ ] T058 [US3] Implement GET /activity/ips/:ip route in src/endpoint/routes/activity.ts (IP-specific statistics)
- [ ] T059 [US3] Implement GET /activity/timeseries route in src/endpoint/routes/timeseries.ts (time-series data for charts)
- [ ] T060 [US3] Register new routes in src/endpoint/index.ts router

### Frontend Implementation for User Story 3

- [ ] T061 [US3] Extend useActivityAnalytics composable with IP filtering in src/module/composables/use-activity-analytics.ts
- [ ] T062 [US3] Add IP filter dropdown to FilterPanel component in src/module/components/FilterPanel.vue
- [ ] T063 [US3] Add IP comparison view to ActivityView in src/module/views/ActivityView.vue

### Polish for User Story 3

- [ ] T064 [US3] Add IP address validation and formatting
- [ ] T065 [US3] Add time-series chart for IP activity trends
- [ ] T066 [US3] Add JSDoc comments for IP filtering functions

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final publishing preparation

- [ ] T067 [P] Add comprehensive README.md with installation instructions, usage guide, and screenshots
- [ ] T068 [P] Create example screenshots for marketplace listing
- [ ] T069 [P] Add performance optimization: implement database indexes in documentation (idx_activity_timestamp_collection)
- [ ] T070 [P] Add caching layer activation in CollectionService and ActivityService (5-minute TTL)
- [ ] T071 [P] Add export functionality (CSV/JSON) for collection and activity data
- [ ] T072 [P] Add responsive design improvements for mobile/tablet views
- [ ] T073 [P] Add dark mode support (use Directus theme variables)
- [ ] T074 Code cleanup and refactoring (ensure functions <50 lines, files <300 lines)
- [ ] T075 Add comprehensive error handling and user-friendly error messages
- [ ] T076 Run bundle build and validate: npm run build && npx create-directus-extension@latest validate -v
- [ ] T077 Test in local Directus instance (10.x and 11.x) with npm run link
- [ ] T078 Update CHANGELOG.md with all features and version 1.0.0
- [ ] T079 Final code quality check: ESLint, Prettier, TypeScript typecheck
- [ ] T080 Publish to npm: npm publish

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 (different tables/endpoints)
- **User Story 3 (P3)**: Depends on User Story 2 (extends activity analysis with IP filtering)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Backend routes before frontend components (API contract first)
- Shared services before route handlers
- Frontend composables before Vue components
- Core components before view integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup Phase**: T005-T011 can run in parallel (configuration files)
- **Foundational Phase**: T013-T017, T019-T020 can run in parallel (different files)
- **User Story 1 Tests**: T021-T024 can run in parallel
- **User Story 1 Backend**: T025-T026 can run in parallel
- **User Story 1 Frontend**: T029-T032 can run in parallel
- **User Story 2 Tests**: T039-T041 can run in parallel
- **User Story 2 Backend/Frontend**: Similar parallel patterns
- **User Story 3**: Similar parallel patterns
- **Polish Phase**: Most tasks (T067-T073, T078-T079) can run in parallel
- **Different user stories can be worked on in parallel by different team members after Foundational phase**

---

## Parallel Example: User Story 1 Backend

```bash
# Launch backend services in parallel:
Task: "Implement CollectionService in src/endpoint/services/collection-service.ts"
Task: "Create query builders in src/endpoint/utils/query-builders.ts"

# Then implement route (depends on service):
Task: "Implement GET /collections route in src/endpoint/routes/collections.ts"
```

## Parallel Example: User Story 1 Frontend

```bash
# Launch all frontend components in parallel:
Task: "Create useCollectionAnalytics composable in src/module/composables/use-collection-analytics.ts"
Task: "Create CollectionChart component in src/module/components/CollectionChart.vue"
Task: "Create TopTenToggle component in src/module/components/TopTenToggle.vue"
Task: "Create CollectionView component in src/module/views/CollectionView.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (initialize bundle extension)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (collection storage analysis)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Build and test: `npm run build && npm run link`
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add Polish → Final validation → Publish to npm

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (collection storage)
   - Developer B: User Story 2 (activity analysis)
   - Developer C: User Story 3 (IP filtering)
3. Stories complete and integrate independently
4. Team collaborates on Polish phase

---

## Publishing Workflow

### Pre-Publishing Checklist

Before T080 (npm publish), verify:

- [ ] All tests pass (≥80% coverage)
- [ ] Bundle builds successfully (`npm run build`)
- [ ] Validation passes (`npx create-directus-extension@latest validate -v`)
- [ ] README.md is comprehensive
- [ ] LICENSE file exists (MIT)
- [ ] Screenshots captured
- [ ] Tested in Directus 10.x and 11.x
- [ ] No secrets in code
- [ ] CHANGELOG.md updated
- [ ] package.json has correct keywords and host version
- [ ] npm account authenticated (`npm login`)

### Post-Publishing

- [ ] Verify package on npm: https://www.npmjs.com/package/directus-extension-usage-analytics
- [ ] Wait for marketplace listing: https://directus.io/extensions (within a few hours)
- [ ] Monitor GitHub issues and npm downloads
- [ ] Prepare for community feedback and patches

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Each user story should be independently completable and testable**
- **Tests MUST FAIL before implementation** (TDD approach)
- **Build regularly**: Run `npm run dev` for hot reload during development
- **Validate early**: Run validation before completing each user story
- **Commit after each task or logical group**
- **Stop at any checkpoint to validate story independently**
- **Bundle structure**: `src/module/` (frontend), `src/endpoint/` (backend), `src/shared/` (types)
- **Build output**: `dist/app.js` (frontend), `dist/api.js` (backend)
- **Avoid**: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Counts

**Total Tasks**: 80

**By Phase**:
- Phase 1 (Setup): 11 tasks
- Phase 2 (Foundational): 9 tasks (BLOCKING)
- Phase 3 (User Story 1 - P1): 18 tasks
- Phase 4 (User Story 2 - P2): 15 tasks
- Phase 5 (User Story 3 - P3): 13 tasks
- Phase 6 (Polish): 14 tasks

**By User Story**:
- User Story 1 (Collection Storage): 18 tasks
- User Story 2 (API Activity): 15 tasks
- User Story 3 (IP Analysis): 13 tasks
- Infrastructure: 34 tasks (Setup + Foundational + Polish)

**Parallel Opportunities**: ~40 tasks (50%) can run in parallel with proper coordination

**Estimated Time**:
- MVP (Setup + Foundational + US1): 2-3 days
- Full Implementation (all user stories): 3-4 days
- Polish + Publishing: 0.5-1 day
- **Total**: 3.5-5 days for publishable extension
