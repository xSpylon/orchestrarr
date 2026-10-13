# Configuration guide

This guide covers the settings that affect a self-hosted Orchestrarr deployment. Start with the Docker or local installation steps in the [README](../README.md), then use this guide when you connect services or expose the dashboard beyond localhost.

## Configuration sources

Orchestrarr can read settings from a JSON file and environment variables.

| Source | Default | Use |
| --- | --- | --- |
| <code>CONFIG_PATH</code> | <code>config.json</code> in the project root | Choose the JSON configuration file |
| <code>STATE_DIR</code> | <code>.data</code> in the project root | Choose the directory for local event history |
| <code>DEMO_MODE</code> | <code>true</code> when no saved setting exists | Set the deployment default for demo mode |
| <code>DEMO_PROFILE</code> | <code>medium</code> | Set the demo usage profile when no saved profile exists |
| Environment variables | — | Supply deployment secrets and override matching saved values |
| <code>config.json</code> | — | Store settings entered through the dashboard |

Native Node processes do not load <code>.env</code> automatically. Export variables in the shell or configure them through your service manager. Docker Compose loads <code>.env</code> and passes the values into the container.

For most service fields, environment variables take precedence over values in <code>config.json</code>. Environment-managed access settings appear as locked in **Settings → Access**.

The saved <code>demoMode</code> value takes precedence over <code>DEMO_MODE</code>. If neither is set, the app starts in demo mode.

## Authentication

Authentication is configured with **Settings → Access** or with environment variables.

| Mode | Required values | Client behavior |
| --- | --- | --- |
| <code>none</code> | None | Local API access without login |
| <code>apikey</code> | <code>ORCHESTRARR_API_KEY</code> | Browser login with the key; API clients send <code>X-Orchestrarr-Key</code> |
| <code>basic</code> | <code>AUTH_USERNAME</code>, <code>AUTH_PASSWORD</code> | API clients send an <code>Authorization: Basic ...</code> header |

Only <code>none</code>, <code>apikey</code> and <code>basic</code> are valid modes. Docker Compose uses <code>apikey</code> by default.

Browser clients use <code>POST /api/auth/login</code> with a JSON body containing the API key. A successful login creates an HttpOnly session cookie. <code>POST /api/auth/logout</code> invalidates that session. API-key login attempts are rate-limited in memory. Browser writes also require a same-origin request.

The dashboard does not store a Basic Auth password in plain text when it is saved through Settings; it stores a salted scrypt hash. Environment variables remain the deployment authority when they are present.

If a native installation locks you out, stop the server and update the <code>auth.mode</code> value in the configured JSON file to <code>none</code>, then restart it. For Docker, replace <code>ORCHESTRARR_API_KEY</code> in <code>.env</code> and recreate the container.

## Demo mode

Demo mode is useful for previews, screenshots and first-time setup.

- Enable it from **Settings → Demo mode**.
- Set <code>DEMO_MODE=true</code> for a deployment default.
- Set <code>demoMode</code> to <code>true</code> in <code>config.json</code>.
- Disable it from Settings or with <code>DEMO_MODE=false</code>, then configure the services you want to use.

An explicit saved setting wins over the environment default. When demo mode is active, the dashboard shows a persistent banner. Demo data never requires real service credentials. The catalog, users, history and service events are synthetic, and the local posters in public/demo/posters/ are original fictional placeholder artwork. Demo mode does not call external metadata services.

Choose the demo usage profile from **Settings → Demo usage profile**:

- **Light usage** (<code>small</code>) keeps the fixture light for quick previews and smaller screens.
- **Rich home server** (<code>medium</code>) provides the default scenario.
- **High activity** (<code>large</code>) adds more requests, playback history, queue activity, streams and calendar entries for a heavily used household.

The selected profile is saved as <code>demoProfile</code> in <code>config.json</code>. The setting affects the dashboard and the demo discovery, calendar, request, user and title-history endpoints together.
## Service connections

You can configure services from **Services**. For deployments, use environment variables or a private configuration file instead of committing credentials.

The supported environment variable names are listed in the [README](../README.md#supported-integrations-and-environment-variables). Service URLs should be reachable from the Orchestrarr process or container, not necessarily from the browser.

Some integrations have additional behavior:

- Tdarr uses its server/API port by default. Its web UI may use a different port.
- Cleanuparr only needs <code>CLEANUPARR_API_KEY</code> when API authentication is enabled.
- Tdarr authentication is disabled by default; set <code>TDARR_API_KEY</code> when it is enabled.
- <code>WIZARR_PUBLIC_URL</code> is the address invitation recipients open. It may differ from the internal <code>WIZARR_URL</code>.
- TMDb and OMDb use cloud API keys and do not need a service URL.
- Docker controls are opt-in. Set <code>DOCKER_ENABLED=true</code> only for trusted administrators.

Credentials are kept on the server and are not returned to the React application.

## Notifications

Set <code>NOTIFICATION_WEBHOOK_URL</code> to receive JSON notifications for test events and newly observed alerts. Use the **Test notification** action in Settings after saving the URL.

Keep the URL private. A notification destination can receive information about service events, so treat it like a credential.

## Incoming webhooks

Orchestrarr accepts forward-only events from:

- <code>POST /api/webhooks/plex</code>
- <code>POST /api/webhooks/radarr</code>
- <code>POST /api/webhooks/sonarr</code>

Configure those URLs in the corresponding services using the host and port where Orchestrarr is reachable.

Protect the endpoints with <code>ORCHESTRARR_WEBHOOK_SECRET</code> or <code>webhooks.secret</code> in <code>config.json</code>. Send the secret either as:

- <code>?secret=&lt;your-secret&gt;</code> in the webhook URL
- <code>X-Orchestrarr-Webhook-Secret: &lt;your-secret&gt;</code> as a request header

A configured webhook secret is required even when dashboard authentication uses a different mode. Without a secret, webhook endpoints remain available only when you intentionally run the dashboard without authentication on a trusted local deployment.

Accepted payloads can be JSON bodies or form bodies containing a JSON <code>payload</code> field. Events are written to <code>.data/request-events.json</code> or the directory selected by <code>STATE_DIR</code>. The file is written atomically and is shown in Activity from the point tracking begins.

## Storage and backups

The default locations are:

- <code>config.json</code>: integration and application settings
- <code>.data/request-events.json</code>: locally recorded webhook events
- Docker <code>/app/.data</code>: the persistent configuration and state directory

Back up these files or the Docker volume privately. They may contain service credentials, webhook settings and operational history. Do not commit them to Git or include them in public support requests.

To move the files, set <code>CONFIG_PATH</code> and <code>STATE_DIR</code> before starting the server. Ensure the process can read and write both locations.

## Remote access

Native and development servers bind to <code>127.0.0.1</code> by default. To serve the dashboard on a network, deliberately configure <code>HOST=0.0.0.0</code>, enable authentication and put the service behind a trusted HTTPS reverse proxy or VPN.

The Docker image listens on <code>0.0.0.0</code> inside the container, while the Compose example publishes only to host loopback. Preserve the browser's <code>Host</code> header through a reverse proxy. Do not expose the Vite development server or an unauthenticated deployment to the public internet.

All signed-in users currently have administrative access to configured integrations. There are no separate viewer and administrator roles.
