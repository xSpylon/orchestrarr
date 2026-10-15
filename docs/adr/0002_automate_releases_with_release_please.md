# 0002. Automate releases with release-please

## Context

Up to 0.2.0 a release was a hand-made commit: bump `version` in `package.json`, move the `Unreleased` entries of `CHANGELOG.md` under a dated heading, fix the comparison links, then merge to `main` (see [0001](0001_publish_docker_images_to_ghcr.md)). Every step was manual and easy to get wrong, for example a release without a changelog section, which made the workflow fail.

## Decision

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`). After CI passes on `main`, `.github/workflows/project_release.yml` runs [release-please](https://github.com/googleapis/release-please), which keeps a release pull request open with the next version and its changelog section, built from the `feat` and `fix` commits. Merging that pull request creates the tag and the GitHub release; the same workflow then builds and pushes the images as in 0001. `release-please-config.json` maps commit types to the existing section names (Added, Fixed, Changed, Security) and `.release-please-manifest.json` holds the current version. Dependabot commits use the `chore(deps)` type so they stay out of the notes.

## Consequences

- Releasing is merging one pull request. The version follows from the commits: before 1.0, `feat` bumps the minor version and `fix` the patch version.
- Release notes are only as good as the commit messages. They can still be edited in the release pull request before merging.
- `CHANGELOG.md` has no `Unreleased` section any more; sections from 0.2.0 down were written by hand and stay as they are.
- Commits without a recognized type are left out of the notes and do not trigger a release.
- With `GITHUB_TOKEN`, CI does not run on the release pull request. A `RELEASE_PLEASE_TOKEN` secret (a fine-grained personal access token) enables it.
- After every green push to `main`, the workflow fast-forwards `dev` to it, so the release commit reaches `dev` without a manual merge. It never merges or forces: when `dev` has its own commits, it is left as it is. Pushes made with `GITHUB_TOKEN` start no new CI run on `dev`, which is fine because the commit already passed on `main`.
- The images are still built in the release workflow because releases and tags created with `GITHUB_TOKEN` do not trigger other workflows.
