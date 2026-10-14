# Changelog

All notable changes to Orchestrarr are documented here. The project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html); before 1.0, minor versions may contain breaking changes. From 0.2.0 on, [release-please](https://github.com/googleapis/release-please) writes each new section from the `feat` and `fix` commits of that release (see [CONTRIBUTING.md](CONTRIBUTING.md#releases)).

## [0.3.0](https://github.com/xSpylon/orchestrarr/compare/v0.2.0...v0.3.0) (2026-10-14)


### Added

* Add an Unraid template ([891d57e](https://github.com/xSpylon/orchestrarr/commit/891d57ee903001fe7fd8f6f86c941ce115dca59f))

## [0.2.0] - 2026-10-15

### Added

- Switching demo mode on or off shows a notice while the dashboard reloads, then confirms where it landed.
- Actions work in demo mode: approve, decline, request, import, blocklist, pause, resume, search and dismiss change your own copy of the demo data, kept in memory per browser.
- Demo mode now includes titles that are not in the library or requested yet (Northern Signal, Daybreak Motel), so Discover shows a Request button.
- A "Try the demo" checklist in demo mode walks through requesting, approving, declining, importing, pausing, blocklisting, inviting and removing access, and ticks off each task as you do it.
- Live updates are capped at 5 connections per visitor and 500 in total, so one visitor cannot tie up the server. `TRUST_PROXY=true` takes the visitor's address from Cloudflare or a reverse proxy, for this cap and the login rate limit.
- `PUBLIC_DEMO=true` runs a shared public demo: demo data only, settings locked, and no requests that change settings or reach other hosts.

### Fixed

- All nine interface languages are now complete. Action messages and confirmations (approve, import, blocklist, pause, invite and more) were English-only, and German, French, Spanish, Italian, Portuguese, Japanese and Chinese covered only about a fifth of the interface.
- Texts no longer lowercase a word that can start a sentence, so Dutch reads "Film aanvragen" instead of "film aanvragen".
- The Pipeline Updated column shows a readable time instead of a raw timestamp.

## [0.1.0] - 2026-10-14

First public beta.

### Added

- One dashboard for playback, requests, queues, calendar items, activity and service health across a Plex media stack.
- Live integrations with Plex, Tautulli, Jellyseerr, Sonarr, Radarr, qBittorrent and other media-stack services, configured from **Services**.
- Focused actions: import completed downloads, blocklist releases, pause and resume torrents.
- API-key and basic authentication, with service credentials kept on the server.
- Notifications and webhooks.
- Demo mode, responsive layouts, keyboard navigation and multiple interface languages.
- Multi-arch Docker images (`linux/amd64`, `linux/arm64`) on `ghcr.io/xspylon/orchestrarr`, published on every version tag.
- Two-command install: `curl -fsSLO https://get.orchestrarr.com/docker-compose.yml` and `docker compose up -d`. In API-key mode without a configured key, Orchestrarr generates one on first start, prints it once and keeps it in the state volume.

[0.2.0]: https://github.com/xSpylon/orchestrarr/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/xSpylon/orchestrarr/releases/tag/v0.1.0
