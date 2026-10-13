# 0001. Publish Docker images to GHCR

## Context

Self-hosters of Plex and *arr stacks install from a prebuilt image: one `image:` line in Compose, Portainer or Unraid. Building from a checkout raised the barrier to a first install, and Raspberry Pi and other ARM hosts are common in this audience.

## Decision

A `v*` tag triggers `.github/workflows/docker_publish.yml`, which builds `linux/amd64` and `linux/arm64` with Buildx and pushes to `ghcr.io/xspylon/orchestrarr` with the tags `latest`, `X.Y.Z` and `X.Y`. The build stage runs on the native platform because its output (`dist`) is platform-independent; only the small runtime stage is assembled per architecture. The default `docker-compose.yml` uses the published image.

## Consequences

- Releasing means pushing a version tag. Untagged commits on `main` produce no image.
- GHCR is free for public images and keeps the image next to the source, with the `org.opencontainers.image.source` label linking the two.
- Contributors who need a local image build it with `docker build` as described in `CONTRIBUTING.md`.
