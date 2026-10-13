# Security policy

## Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** feature to send a private report. Include the affected version, reproduction steps using synthetic data, impact and a suggested fix if available. Never include real tokens, passwords, viewing history or personal data.

If private reporting is unavailable, open an issue that only asks the maintainer to enable a private reporting channel. Do not publish vulnerability details or an exploit in that issue. Maintainers must enable GitHub private vulnerability reporting before the public release.

Security fixes target the latest version on the default branch. This is a best-effort community project, without a guaranteed response time or support SLA.

## Deployment boundary

- Native and development servers bind to `127.0.0.1` by default. Enabling network access with `HOST` is an explicit operator decision. Use authentication before enabling it.
- Docker listens inside its container and requires API-key authentication by default. Compose publishes only on host loopback. Without `ORCHESTRARR_API_KEY` in `.env`, a random key is generated on first start, printed once in the logs and stored with owner-only permissions in the state volume.
- All signed-in users have administrative control over the configured integrations. There are no separate viewer and administrator roles.
- Use HTTPS through a trusted reverse proxy or a VPN for remote access. Preserve the browser's Host header and do not expose the development server.
- Mounting a Docker socket grants powerful control over the host. A `:ro` socket mount does **not** prevent Docker API writes. Docker integration is opt-in.
- Keep configuration, `.env`, `.data`, backups and logs private. Revoke or rotate exposed credentials; deleting a commit is insufficient.
- The app stores integration credentials on disk when entered in Services. Password hashing protects the dashboard's Basic Auth password, not service API tokens. Protect the host and its backups.

Static HTTP hosting serves only the frontend build. Configuration files, dotfiles, server code, source maps and paths outside the frontend directory must never be served. Regression tests cover this with and without a build, including symlinks and encoded paths.
