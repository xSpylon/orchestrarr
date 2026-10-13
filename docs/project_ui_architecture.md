# UI architecture

## Product model

Orchestrarr serves a home media operator who keeps a Plex stack available and helps household members get titles to playback. Its central entity is a **title**. A title can be discovered, requested, acquired through the download/import pipeline, added to a Plex library, and watched. Requests carry requester and approval state; pipeline items carry source, progress, and recovery actions; library and discovery records resolve to canonical title details. Playback sessions and activity refer to titles and services. Services provide the integrations and health data that support this lifecycle; infrastructure reports host and storage capacity. Access is managed through Wizarr, while Orchestrarr preferences and platform security live in settings.

## Current architecture

```text
App shell
├── Overview
├── Library: Library · Discover · Calendar
├── Workflow: Requests · Pipeline · Activity
└── System: Playback · Services · Access · Infrastructure · Settings

Title detail: /title/:movie|tv/:id[/sN|/sNeN] (season or episode focus)
Infrastructure: /servers
```

## Navigation model and page archetypes

- **Global shell:** brand/home, grouped primary navigation, live connection state, current page context, search, refresh, theme, and attention entry point. On small screens, grouped navigation stays behind the existing menu control.
- **Overview:** cross-stack triage, current playback, capacity, lifecycle route, and short operational previews.
- **Collection:** Requests, Pipeline, Library, Activity, and Calendar. Keep each collection's existing search/filter/sort/pagination or calendar controls close to its result set; preserve useful query state in the URL.
- **Title detail:** canonical, linkable title identity and availability/actions, with episode focus encoded in the path.
- **Service detail/editor:** inspect a connection in a drawer; configure or test an integration in the same contextual drawer. Keep credentials server-side.
- **Focused monitor/manage pages:** Playback, Infrastructure, Access, and Settings retain their distinct data and actions.

## Page responsibilities and states

| Page | Main object and purpose | Primary action | Important states already represented |
| --- | --- | --- | --- |
| Overview | Stack-wide status and items needing intervention | Inspect an issue, request a title, or open its lifecycle stage | Loading/error at app level; connected, degraded, unknown, and empty playback/queue/library states |
| Requests | Household title requests and approval state | Approve, decline, inspect, or open in Jellyseerr | Empty/unavailable, filtered-no-results, populated, and paginated |
| Pipeline | Acquisitions across download and automation services | Search, pause/resume, blocklist, or open in Sonarr/Radarr | Empty/unavailable, filtered-no-results, populated, and paginated |
| Library | Plex titles, separated into movies and shows | Search, sort, paginate, and open title details | Library unavailable, no matches, populated, and paginated |
| Discover | TMDb candidates before a request or add action | Search or open a title | Loading, error/retry, no results, populated, and load-more |
| Calendar | Sonarr/Radarr release entries | Change month, open title, or export iCal | Loading, error, no scheduled releases, and populated agenda/calendar |
| Activity | Historical events and unresolved alerts | Filter, inspect, or dismiss an alert | Empty, filtered-no-results, populated, and progressively loaded |
| Playback | Current sessions and recent history | Inspect live session or technical details | Plex unavailable, no sessions, active sessions, and history unavailable |
| Services | Integration connectivity and configuration | Inspect, test, configure, or open source | Not configured, connected, degraded/error, test/save progress, and last check |
| Infrastructure | Host runtime, Plex/Docker status, and storage | Inspect metrics or optional container controls | Unavailable metrics, populated metrics, and per-service health |
| Access | Wizarr users and invitations | Manage supported users/invitations | Managed by the existing Wizarr component and its API responses |
| Settings | App preferences and platform-level options | Change preferences or save platform configuration | Preferences, save success/error, and secret-preserving fields |
| Login | Configured Orchestrarr authentication | Sign in | Authentication mode, unauthenticated, authenticated, and login error |

The shell keeps its existing narrow-screen menu; the new groups use native buttons and links, show active routes, and retain their attention counts while collapsed. The main landmark has a skip target, and collection/detail URLs remain linkable. The product has a login screen for configured authentication and no evidence of per-role client page variants; Access and server-side authorization remain the authority for user and API permissions.

## Component architecture

Pages are thin compositions. Every reusable piece is a shared component (SectionHeading, EmptyState, SummaryStrip, ListRow, PropertyList/Property, Pagination, ResultsCount, Toolbar, SettingsRow, Toggle, Button, SearchField, ViewTabs, MediaGrid, ServiceCard, …) and every coherent block of a page is a page component prefixed by its page (OverviewNowWatching, LibraryControls, TitleProperties, …). Data loading, URL/filter state and behaviour live in hooks (`useTitle…`, `useLibraryFilters`, `useAppLocation`, `useItemActions`, …); pure derivations live in `src/helpers` with tests. A new pattern that appears twice becomes a shared component rather than repeated markup. The shell's navigation metadata is the shared source for group labels, route labels, active-page context, and navigation rendering. Keep `Button`, `PageHeading`, `ViewTabs`, `SearchField`, `MediaGrid`, `ServiceCard`, `SeasonAvailability` (with `EpisodeDetails`), the existing table and request list, status badge, command palette, detail drawer, and integration editor as the reusable structural/composite pieces. Extract further controls only when the same interaction is genuinely repeated; do not add another general-purpose page framework.

## Core workflows

| Workflow | Navigation path |
| --- | --- |
| Find and request a title | Discover → title detail → supported add/request action |
| Approve a household request | Overview or Requests → inspect → approve/decline → refresh |
| Recover a stuck acquisition | Overview or Pipeline → inspect → supported recovery action |
| Find something already available | Overview or Library → search/sort/page → title detail |
| Diagnose an interruption | Overview or Activity → inspect the signal → open the relevant service |
| Manage access or preferences | System → Access or Settings |

The current routes, API contracts, integrations, authentication modes, responsive navigation, and existing settings are product surfaces. Extend them deliberately and keep new behavior close to the page, entity, or service it affects.
