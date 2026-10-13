# 0001. Publish Docker images to GHCR

## Context

Self-hosters of Plex and *arr stacks install from a prebuilt image: one `image:` line in Compose, Portainer or Unraid. Building from a checkout raised the barrier to a first install, and Raspberry Pi and other ARM hosts are common in this audience.

## Decision

When CI passes on a `main` commit whose `package.json` version has no release yet, `.github/workflows/project_release.yml` creates the tag and GitHub release, then builds `linux/amd64` and `linux/arm64` with Buildx and pushes to `ghcr.io/xspylon/orchestrarr` with the tags `latest`, `X.Y.Z` and `X.Y`. The build stage runs on the native platform because its output (`dist`) is platform-independent; only the small runtime stage is assembled per architecture. The default `docker-compose.yml` uses the published image.

## Consequences

- Releasing means bumping the version in `package.json` with a matching `CHANGELOG.md` section. Other commits on `main` produce no image.
- The release and the image are built in one workflow because tags created with `GITHUB_TOKEN` do not trigger other workflows.
- GHCR is free for public images and keeps the image next to the source, with the `org.opencontainers.image.source` label linking the two.
- Contributors who need a local image build it with `docker build` as described in `CONTRIBUTING.md`.
