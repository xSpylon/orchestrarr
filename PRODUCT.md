# Orchestrarr

## Product truth

Orchestrarr is a local-first operational interface for a self-hosted media stack. It helps the server owner operate services around Plex without replacing Plex, Jellyseerr, Sonarr, Radarr, or download clients.

The central workflow is **Request → Search → Download → Import → Available → Watch**. The primary user needs to know whether the stack is healthy, what needs attention, where each title is in that workflow, who is watching, and what is available or arriving soon. Household requesters are secondary; the backend does not define a separate requester role or authorization model.

## Supported product surface

The application is built with React, TypeScript, Vite, SCSS, and a Node API. It supports demo and live data, optional authentication, SSE with polling fallback, persisted configuration, and server-side credentials. Current adapters cover Plex, Tautulli, Jellyseerr, Wizarr, Sonarr, Radarr, qBittorrent, SABnzbd, Unraid, optional Docker control, Tdarr, Cleanuparr, Prowlarr, and Bazarr. TMDb discovery is optional.

Existing supported workflows include media discovery and add-to-Sonarr/Radarr, canonical movie/series/episode detail routes, requests, acquisition queues, release calendar with iCal export, playback and history, integration setup/testing, Wizarr access management, service links, supported download/import recovery actions, and optional Docker lifecycle actions.

## Product promise

Make the state of a personal media stack understandable and actionable at a glance. The experience should feel calm, capable, precise, fast, and trustworthy. Operational data takes priority over decoration; media artwork supports recognition without obscuring status.

## Design constraints

- Optimize the operational home for a technically capable home-server owner.
- Keep connection health distinct from workload health. Missing, stale, partial, and failed data must never appear healthy or become zero by default.
- Use the data and actions exposed by the current API. Never invent capabilities, permission models, timestamps, ETAs, or recovery actions.
- Preserve demo/live modes, auth, persisted settings, source-service links, calendar export, history/deep links, browser navigation, and existing integrations.
- Keep the conventional accessible discovery experience complete on keyboard, touch, and without WebGL.
- Support dark and light themes, responsive layouts, keyboard use, visible focus, and reduced motion.
