# Operations guide

Orchestrarr is a control center for the lifecycle of a title: discover it, request it, acquire it, import it, see it in Plex and understand what happened when something fails.

## Main workflows

### Find and request a title

1. Choose **Discover** on Overview to browse and search movies and series, or **New request** on Requests to start a request inside Orchestrarr.
2. Open the title detail view.
3. Use the available add or request action.
4. Follow the request in **Requests** or return to the title later.

TMDb provides discovery and metadata. Jellyseerr provides request actions when it is configured.

### Approve a household request

1. Open **Requests** from the sidebar or Overview.
2. Inspect the request and requester details.
3. Approve or decline the request.
4. Continue following the title through Pipeline and Library.

### Recover a stuck acquisition

1. Open **Pipeline** or an alert from Overview or Activity.
2. Inspect the title, download client and automation service.
3. Use the action that matches the problem.
4. Recheck the item after the service reports the next state.

### Find something already available

Use **Library** to search, sort and paginate Plex titles. Open a title to see its availability, metadata, related requests and operational details.

### Diagnose an interruption

Start in **Overview** or **Activity** and follow the signal to the relevant title or service. **Services** shows connection state and configuration health. **Infrastructure** shows host metrics and optional Docker status.

## Pipeline actions

Actions are intentionally narrow and preserve the download when an operation cannot be completed safely.

### Import now

For completed Radarr or Sonarr downloads waiting for import:

1. Orchestrarr asks the relevant service to import the files with move semantics.
2. It waits for Radarr or Sonarr to report a completed import.
3. It removes the torrent from qBittorrent only after the import succeeds.

If the import fails or takes longer than one minute, the download is kept. Sample files are skipped. Sonarr files without matched episodes stop with a reason.

### Blocklist

Blocklist removes the download and its files from the client, blocklists the release in Radarr or Sonarr and lets that service search for another release.

### Pause and resume

qBittorrent actions use the version 5 <code>torrents/stop</code> and <code>torrents/start</code> endpoints and fall back to the version 4 <code>pause</code> and <code>resume</code> endpoints. A completed torrent that has already stopped seeding does not receive a Resume action.

### Open in the source service

Title and pipeline links can open the relevant Radarr or Sonarr page. The service must expose an address reachable from the browser for those links to be useful.

## Calendar export

The Calendar page combines Sonarr and Radarr release entries. The iCalendar export is available at:

~~~text
GET /api/calendar.ics
~~~

Optional <code>from</code> and <code>to</code> query parameters restrict the date range:

~~~text
/api/calendar.ics?from=2026-01-01&to=2026-01-31
~~~

The response is an attachment named <code>orchestrarr.ics</code>. The export uses the same configured services and credentials as the Calendar page.

## Activity and event history

Incoming Plex, Radarr and Sonarr webhooks create local events. The Activity page shows events recorded after tracking begins. Event history is stored in <code>.data/request-events.json</code>, or in the directory selected by <code>STATE_DIR</code>.

The live dashboard uses <code>GET /api/events</code> as a server-sent event stream for webhook-driven refreshes. Clients fall back to polling when a stream is unavailable.

Event history is local operational data. Back it up privately and remove it before sharing a diagnostic archive.

## Notifications

A configured <code>NOTIFICATION_WEBHOOK_URL</code> receives JSON notifications for:

- Test notifications from Settings
- Newly observed alert events

A notification failure does not replace the original service error. Check the webhook destination, network access from the Orchestrarr process and the destination's response status.

## Service health

The Services page separates these states:

- **Connected**: the adapter answered successfully.
- **Degraded**: the adapter answered but reported a problem.
- **Not configured**: required connection details are missing.
- **Offline**: the connection could not be reached.
- **Error**: the service returned an unexpected response.

A zero count is not used to imply a healthy service when the adapter is unavailable or not configured.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| The browser cannot connect | Confirm the process is running and open the correct port: <code>5173</code> for development, <code>4173</code> for the built server and Docker |
| The dashboard shows the login page | Check the active auth mode and use the matching API key or Basic Auth credentials |
| Settings fields are locked | Environment variables are overriding the saved JSON values |
| A service is not configured | Check its URL and credentials in Services or the matching environment variables |
| A service is offline | Test reachability from the Orchestrarr host or container, not only from your laptop |
| Webhooks are rejected | Check the webhook secret, request header or <code>secret</code> query parameter |
| Calendar is empty | Check Sonarr and Radarr calendar data and the selected date range |
| Actions are missing | Confirm the item is in a state supported by that action and that the required service is connected |
| Docker controls are unavailable | Set <code>DOCKER_ENABLED=true</code> and verify the Docker socket is available to the process |
| Changes disappear after recreation | Persist <code>/app/.data</code> or the configured <code>STATE_DIR</code> |

For security issues, follow [SECURITY.md](../SECURITY.md) instead of opening a public issue with credentials or exploit details.
