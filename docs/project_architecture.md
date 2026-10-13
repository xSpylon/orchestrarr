# Project architecture

This document explains where behavior belongs in the repository and how data crosses the client/server boundary. Product behavior and visual language are documented separately in [project_ui_architecture.md](project_ui_architecture.md) and [project_design_system.md](project_design_system.md).

## Runtime model

Orchestrarr has two runtime parts:

~~~text
Browser
  └── React + TypeScript + Vite
        └── normalized /api responses
              └── Node HTTP server
                    ├── service adapters
                    ├── authentication and CSRF checks
                    ├── config.json persistence
                    ├── .data event history
                    └── optional Docker control plane
~~~

During development, Vite serves the frontend on port <code>5173</code> and proxies <code>/api</code> requests to the Node server on port <code>4173</code>. The production server serves the built frontend and the API from port <code>4173</code>.

The browser never receives service credentials. The server owns authentication, integration calls, persistence, webhook handling and normalization of third-party responses.

## Repository map

~~~text
src/
├── components/     reusable interface pieces and page blocks
├── pages/          route-level compositions
├── hooks/          data loading, URL state and application behavior
├── helpers/        pure derivations and formatting logic
├── lib/            API client, navigation metadata and shared browser utilities
├── types/          shared TypeScript contracts
├── translations/   user-facing translations
└── styles/         tokens, design primitives, shell and page layout

server/
├── arr.js          Sonarr and Radarr adapter behavior
├── auth_config.js  authentication configuration and hashing
├── calendar.js     release calendar mapping
├── discovery.js    TMDb discovery and metadata
├── request_security.js
├── service_events.js
├── static_files.js
└── ...             focused service modules

tests/              Node integration tests, adapter tests and deployment checks
public/             static assets, bundled notices and reference marks
scripts/            development and Docker verification scripts
docs/               project, user and reference documentation
server.js           HTTP routing and production static hosting
~~~

Keep this map aligned with the repository. If a directory moves or a new server boundary becomes stable, update this section and the relevant contributor guidance.

## Data flow

1. A page or hook requests normalized data through <code>src/lib/api.ts</code>.
2. The Node server authenticates the request and validates the method and origin where required.
3. A focused server adapter calls the configured third-party service.
4. The adapter maps the response into the normalized contracts used by the dashboard.
5. The server returns only the data needed by the browser.
6. Hooks manage loading, error and refresh state; helpers derive display values; components render the result.

Service-specific payload names and credentials stay in the server boundary. Do not make the browser aware of service API keys or copy upstream response shapes into page components.

## Where new behavior belongs

- Add pure transformations, matching rules or status derivations to <code>src/helpers/</code>.
- Add data loading and URL/filter state to a hook in <code>src/hooks/</code>.
- Add reusable visual structure to <code>src/components/</code>.
- Keep route composition in <code>src/pages/</code>.
- Add shared navigation or API behavior to <code>src/lib/</code>.
- Add shared contracts to <code>src/types/</code>.
- Add service HTTP calls and payload mapping to a focused server adapter.
- Keep persistence and authentication decisions on the server.
- Add user-facing copy to the translation files rather than hardcoding it in components.

Pages should compose existing components and hooks. A pattern that appears twice should become a shared component when the interaction is genuinely the same.

## Adding an integration

1. Define the service's normalized types and configuration fields.
2. Implement the HTTP calls and response mapping in a server adapter.
3. Add configuration status and connection testing.
4. Expose only normalized data through an API route.
5. Add the service to the Services page and any page that consumes its data.
6. Handle not configured, loading, unavailable, degraded and error states separately.
7. Add adapter contract tests with a local mock server.
8. Add or update configuration and operations documentation.

Keep credentials server-side. Do not silently treat a failed adapter as an empty successful result.

## Adding a page

1. Add the route metadata to the shared navigation source.
2. Create the page folder under <code>src/pages/</code>.
3. Compose page blocks from <code>src/components/</code>.
4. Keep data loading and URL state in hooks.
5. Reuse the existing shell, headings, filters, empty states and status language.
6. Cover loading, empty, unavailable, error and populated states.
7. Add keyboard and narrow-screen behavior.
8. Add a component or integration test for the critical interaction.

The page should support direct links, browser back/forward navigation and the existing authentication boundary.

## Testing boundaries

- Pure helper behavior belongs in focused Node tests.
- Server routes, authentication, static-file protection and deployment behavior belong in HTTP integration tests.
- Service adapters use local mock servers so URLs, headers, payloads and failure states are verified.
- React components and hooks use Vitest and Testing Library for user-visible behavior.
- Docker runtime behavior is covered by the Docker smoke test.

Run the full local checks with:

~~~bash
yarn check
yarn build
yarn test
docker build -t orchestrarr:ci .
DOCKER_IMAGE=orchestrarr:ci yarn test:docker
~~~

## Naming and source-of-truth rules

- React component and page folders use PascalCase.
- Server modules, helpers, hooks, libraries, UI utilities and test filenames use snake_case.
- JavaScript and TypeScript identifiers use camelCase.
- Preserve snake_case names required by external APIs.
- Navigation metadata is the source of truth for page labels, routes and active context.
- Shared design tokens are the source of truth for colors, spacing, typography and control states.
- Normalized server contracts are the source of truth for data consumed by the React app.
