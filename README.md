<p align="center">
  <img src="public/orchestrarr_logo.png" alt="Orchestrarr logo" width="96" height="96">
</p>

<h1 align="center">Orchestrarr</h1>

<p align="center">
  A local-first control center for self-hosted Plex and <em>*arr</em> media stacks.
</p>

<p align="center">
  <a href="https://github.com/xSpylon/orchestrarr/actions/workflows/project_ci.yml"><img src="https://github.com/xSpylon/orchestrarr/actions/workflows/project_ci.yml/badge.svg" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/xSpylon/orchestrarr" alt="AGPL-3.0 license"></a>
  <a href="https://orchestrarr.com"><img src="https://img.shields.io/badge/website-orchestrarr.com-6d4aff" alt="Project website"></a>
  <a href="https://opencollective.com/orchestrarr"><img src="https://img.shields.io/badge/support-Open%20Collective-7f56d9" alt="Support Orchestrarr on Open Collective"></a>
</p>

Orchestrarr brings Plex, Sonarr, Radarr, Jellyseerr and related services into one dashboard. See what needs attention, inspect the details and take action without jumping between service interfaces.

https://github.com/user-attachments/assets/80bdb961-2260-4fbe-b349-b6e36f45a2e5

> **Early beta** · self-hosted · [AGPL-3.0 licensed](LICENSE)

**[Try the demo](https://demo.orchestrarr.com)** without installing anything. It runs on fictional data, and the changes you make only show for you.

Orchestrarr is an independent community project and is not affiliated with Plex or the services it connects to. Maintenance is best-effort. The official project lives at [orchestrarr.com](https://orchestrarr.com) and [github.com/xSpylon/orchestrarr](https://github.com/xSpylon/orchestrarr).

## What it does

- Brings playback, requests, queues, calendar items, activity and service health into one workspace.
- Supports live connections to Plex, Tautulli, Jellyseerr, Sonarr, Radarr, qBittorrent and other media-stack services.
- Offers focused actions such as importing completed downloads, blocklisting releases and pausing or resuming torrents.
- Includes demo mode, responsive layouts, keyboard navigation and multiple interface languages.
- Keeps service credentials on the server and normalizes data before it reaches the browser.

## Run with Docker

Docker Compose is the recommended installation path. Images for `linux/amd64` and `linux/arm64` are published to `ghcr.io/xspylon/orchestrarr`, tagged `latest`, the exact version (`0.2.0`) and the minor line (`0.2`).

In an empty folder, download the Compose file of the latest release and start Orchestrarr:

```bash
curl -fsSLO https://get.orchestrarr.com/docker-compose.yml
docker compose up -d
```

On first start Orchestrarr generates an API key and prints it once. Read it from the logs:

```bash
docker logs orchestrarr
```

Open <http://127.0.0.1:4173> and sign in with that key. It is kept in the `orchestrarr_state` volume, so it survives restarts and updates; `docker exec orchestrarr cat /app/.data/api_key.json` shows it again. To choose your own key, set `ORCHESTRARR_API_KEY` in a `.env` file next to the Compose file. [`.env.example`](.env.example) lists the optional settings. Configure integrations from **Services**. Compose starts with live mode enabled; unconfigured integrations remain inactive. Update with `docker compose pull && docker compose up -d`.

Configuration is stored at `/app/.data/config.json` and event history is stored in the persistent `orchestrarr_state` volume. Ordinary `docker compose down` preserves settings. `docker compose down -v` deletes the volume, including credentials and settings.

For a standalone container:

```bash
docker run -d --name orchestrarr --restart unless-stopped \
  -p 127.0.0.1:4173:4173 \
  -e DEMO_MODE=false \
  -v orchestrarr_data:/app/.data \
  ghcr.io/xspylon/orchestrarr:latest
```

To build from source instead, run `docker build -t orchestrarr:local .` in a checkout and use `orchestrarr:local` as the image.

For LAN or remote access, deliberately change the published host address, keep authentication enabled and use a VPN or HTTPS reverse proxy. The optional Docker control plane requires `DOCKER_ENABLED=true` and access to the host's Docker socket. A read-only socket mount does not make Docker operations read-only.

### On Unraid

The easiest way to install Orchestrarr on Unraid is through Community Applications. Open **Apps**, search for **Orchestrarr**, review the template and click **Install**. Use the default WebUI port unless 4173 is already in use, and keep the appdata path at `/mnt/user/appdata/orchestrarr` so your settings and credentials are included in your appdata backups.

After installation, open the WebUI and retrieve the generated API key with `docker logs orchestrarr`. Add your services under **Services**, using your server's LAN address and each service's host port, for example `http://192.168.68.10:8989` for Sonarr.

If Orchestrarr is not yet visible in Community Applications, use the template directly. It fills in the port, the appdata path and the settings for you. In the Unraid terminal, download it once:

```bash
curl -fsSL -o /boot/config/plugins/dockerMan/templates-user/my-orchestrarr.xml https://raw.githubusercontent.com/xSpylon/orchestrarr/main/unraid/orchestrarr.xml
```

Then go to **Docker → Add Container**, pick **orchestrarr** under Template, change the port if 4173 is taken and click **Apply**. The template stores settings in `/mnt/user/appdata/orchestrarr`, so your appdata backup covers them.

## Run locally

Use Node.js **22.18 or newer** and Yarn **4.18.0**.

```bash
corepack enable
yarn install --immutable
yarn dev
```

Open <http://127.0.0.1:5173>. The development command starts the Vite UI and local API together. With no local configuration, the app starts in demo mode and does not need service credentials.

For a production-like local run:

```bash
yarn build
yarn start
```

Open <http://127.0.0.1:4173>.

## Configure integrations

To configure a native installation, copy the example configuration and switch off demo mode:

```bash
cp config.example.json config.json
```

You can then configure integrations in **Services**, or provide credentials through environment variables. Environment variables are preferred for deployments.

<details>
<summary>Supported integrations and environment variables</summary>

| Integration | Environment variables |
| --- | --- |
| Plex | `PLEX_URL`, `PLEX_TOKEN` |
| Tautulli | `TAUTULLI_URL`, `TAUTULLI_API_KEY` |
| Jellyseerr | `JELLYSEERR_URL`, `JELLYSEERR_API_KEY` |
| Wizarr | `WIZARR_URL`, `WIZARR_API_KEY`, optional `WIZARR_PUBLIC_URL` |
| Cleanuparr | `CLEANUPARR_URL`, optional `CLEANUPARR_API_KEY` |
| Tdarr | `TDARR_URL`, optional `TDARR_API_KEY` |
| Prowlarr | `PROWLARR_URL`, `PROWLARR_API_KEY` |
| Bazarr | `BAZARR_URL`, `BAZARR_API_KEY` |
| Sonarr | `SONARR_URL`, `SONARR_API_KEY` |
| Radarr | `RADARR_URL`, `RADARR_API_KEY` |
| qBittorrent | `QBITTORRENT_URL`, `QBITTORRENT_USERNAME`, `QBITTORRENT_PASSWORD` |
| SABnzbd | `SABNZBD_URL`, `SABNZBD_API_KEY` |
| Unraid | `UNRAID_URL`, `UNRAID_API_KEY` |
| TMDb | `TMDB_API_KEY` |
| OMDb | `OMDB_API_KEY` |

The repository's [.env.example](.env.example) contains the authentication and webhook variables; add service variables as needed. Credentials remain server-side and are never returned by the API.

For detailed setup, deployment and integration behavior, see the [configuration guide](docs/guide_configuration.md) and [operations guide](docs/guide_operations.md).

</details>

### Authentication

Native installations allow unauthenticated loopback use by default. Docker defaults to API-key authentication. Set `AUTH_MODE=apikey` with `ORCHESTRARR_API_KEY`, or use `AUTH_MODE=basic` with `AUTH_USERNAME` and `AUTH_PASSWORD`. In API-key mode without a configured key, Orchestrarr generates one on first start, prints it once and stores it privately in `api_key.json` in its state folder.

Authentication can also be configured from **Settings → Access**. Environment variables take precedence over `config.json` and appear as locked settings. Browser writes use same-origin CSRF protection, and login attempts are rate-limited in memory.

### Demo mode

The app starts in demo mode when no saved configuration exists. Switch demo mode from Settings, set DEMO_MODE=false, or set demoMode to false in config.json. The active dashboard displays a persistent demo banner. Demo mode includes a populated fictional catalog, years of synthetic activity, service health history, requests and local placeholder artwork; it does not call external metadata services. Actions work on the demo data: approve or decline requests, request a title, import, blocklist, pause, resume and dismiss alerts. Those changes are kept in memory for your browser only and reset when the server restarts. A "Try the demo" checklist walks through eight of them, starting with finding Daybreak Motel in Discover and requesting it. Choose a usage profile in Settings: Light usage, Rich home server, or High activity. Docker Compose sets DEMO_MODE=false by default.

To host a demo anyone can open, set `PUBLIC_DEMO=true` and `AUTH_MODE=none`. A public demo always shows demo data, locks the demo switch and the usage profile, and refuses every request that would change settings, test a connection, send a notification, accept a webhook, reach Docker or fetch posters from TMDb. The banner tells visitors that their changes only show for them and links to orchestrarr.com. Behind Cloudflare or a reverse proxy, also set `TRUST_PROXY=true` so rate limits see each visitor's address instead of the proxy's.
### Notifications and webhooks

Set `NOTIFICATION_WEBHOOK_URL` to receive test events and newly observed alerts as JSON. Keep the webhook URL private.

The server accepts forward-only webhook events at:

- `POST /api/webhooks/plex`
- `POST /api/webhooks/radarr`
- `POST /api/webhooks/sonarr`

Set `ORCHESTRARR_WEBHOOK_SECRET` or `webhooks.secret` in `config.json` to protect webhook endpoints. Append `?secret=<your-secret>` or send the value as `X-Orchestrarr-Webhook-Secret`.

## Everyday use

`⌘K` or `/` opens search and commands. `G` followed by a letter jumps to a page, and `[` collapses the sidebar. `Esc` closes overlays.

Pipeline actions are deliberately narrow:

- **Import now** imports completed Radarr or Sonarr downloads and removes the torrent only after the import succeeds.
- **Blocklist** removes the download and its files, blocklists the release and asks Radarr or Sonarr to search again.
- **Pause / Resume** supports qBittorrent 4 and 5.

The dashboard supports English, Nederlands, Deutsch, Français, Español, Italiano, Português, 简体中文 and 日本語. English is used as the fallback for untranslated copy.

## Development

```bash
yarn check          # filename conventions, ESLint, TypeScript and syntax checks
yarn build          # build the frontend
yarn test           # Node integration tests and Vitest component tests
yarn lint           # filename conventions and ESLint
docker build -t orchestrarr:ci .
DOCKER_IMAGE=orchestrarr:ci yarn test:docker
```

Run `yarn build` before the production-style HTTP and Docker smoke tests. The test suite uses isolated temporary configuration and state directories; it does not connect to your media services.

For contribution guidelines, project structure and naming conventions, see [CONTRIBUTING.md](CONTRIBUTING.md). For interface architecture, see [docs/project_ui_architecture.md](docs/project_ui_architecture.md). Questions and setup help go to [Discussions](https://github.com/xSpylon/orchestrarr/discussions). Bug reports and documentation improvements are welcome. Open an issue before starting a large feature so we can agree on scope.

## Security

Native and development servers bind to `127.0.0.1` by default. Set `HOST=0.0.0.0` only when network access is intentional, and enable authentication first. All signed-in users have administrative access to configured integrations.

Keep `.env`, `config.json`, `.data`, backups and logs private. Use HTTPS through a trusted reverse proxy or a VPN for remote access. Do not expose the development server. Report vulnerabilities through the process in [SECURITY.md](SECURITY.md).

## Support the project

Orchestrarr is maintained as an open-source community project. You can report bugs, improve documentation, contribute code or support project infrastructure through [Open Collective](https://opencollective.com/orchestrarr). Funding does not unlock features or change the license.

## License and credits

Original Orchestrarr code is available under the [GNU Affero General Public License, version 3](LICENSE). You may use, modify, distribute and sell it when you follow the license obligations, including the source-availability requirement for network users of modified versions.

The Orchestrarr name, wordmark, logo and official project identity are governed separately by the [trademark policy](TRADEMARKS.md). React, React DOM, Scheduler, Inter and other bundled dependencies retain their own licenses; see [third-party notices](docs/reference_third_party_notices.md). Metadata, artwork and third-party trademarks are not covered by Orchestrarr's AGPL license.
