# Contributing to Orchestrarr

Orchestrarr is an early community project maintained in the official repository at <https://github.com/xSpylon/orchestrarr>. The canonical project site is <https://orchestrarr.com>. Bug reports, documentation fixes and focused pull requests are welcome. Maintenance is best-effort; there is no guaranteed response time or support SLA. Ask questions and float ideas in [Discussions](https://github.com/xSpylon/orchestrarr/discussions); open an issue before starting a large feature so we can agree on scope.

## Project identity and upstream work

The official project is the repository's default branch and published releases. Forks are welcome under the [AGPL-3.0 license](LICENSE), but the Orchestrarr name, wordmark and logo are governed by the [trademark policy](TRADEMARKS.md). Do not present a modified distribution as the official Orchestrarr project or imply endorsement.

When you improve functionality that belongs in the shared project, please open a pull request against this repository. Keeping improvements upstream reduces fragmentation and gives contributors visible credit in the changelog and release notes. Commercial deployments may use and sell Orchestrarr under the license; upstream contributions are encouraged but are not a condition of using the software.

## Development

Use Node.js 22.18 or newer (Node 22 LTS is used in Docker and CI) and Yarn 4.18.0, pinned in `package.json`.

```sh
corepack enable
yarn install --immutable
yarn dev
```

The app starts in demo mode when no local configuration exists. Keep development on localhost. Never use production credentials in tests, fixtures, screenshots or issue reports.

Before opening a pull request:

```sh
yarn check
yarn build
yarn test
docker build -t orchestrarr:ci .
DOCKER_IMAGE=orchestrarr:ci yarn test:docker
```

Build before running the HTTP smoke tests. The Node suite includes isolated API, authentication, deployment and service-adapter tests; Vitest covers React components and hooks. The Docker smoke test starts the built image, checks the health endpoint and frontend shell, and verifies that API-key authentication is enforced. These tests use isolated temporary configuration and state directories and never your local media services. Add regression coverage for bug fixes and update the relevant documentation when behavior changes. Keep pure logic in helpers, data loading in hooks and interface components focused; see `docs/project_ui_architecture.md`.

Describe the problem, resulting behavior and validation. For interface changes, include screenshots with synthetic data. For integration bugs, include the service version, reproduction steps and redacted logs. Security vulnerabilities follow [SECURITY.md](SECURITY.md), not public issues.

## Naming conventions

Use PascalCase for React component and page folders and their component files, including colocated `*.types.ts` and `*.module.scss` files. Use snake_case for server modules, helpers, hooks, libraries, UI utilities and test filenames. Keep JavaScript and TypeScript identifiers in camelCase, including hook exports such as `useDashboard`; the filename convention does not change the language convention. Preserve snake_case field names required by upstream service APIs, such as TMDb, Plex and Sonarr payloads.

## Contribution sign-off

Contributions are accepted under the project's [AGPL-3.0 license](LICENSE). Each commit in a pull request must include a Developer Certificate of Origin sign-off. Add `-s` to your commit command, or add this line manually when you are certain it is accurate:

```text
Signed-off-by: Your Name <your.email@example.com>
```

By signing off, you confirm that you have the right to submit the work under the project's license. The full DCO text is available at <https://developercertificate.org/>.

## Rights and conduct

Only contribute work you have the right to share. Preserve third-party copyright notices and document new dependencies or assets in `docs/reference_third_party_notices.md`. Add your name or handle to release notes when a contribution is included.

Be respectful, discuss the work rather than the person, and do not post private information. Maintainers may remove abusive content or close contributions outside the project's scope.

## File naming

Keep filenames predictable so contributors can find code by its role:

- React components and pages use PascalCase, including their colocated `.types.ts` and `.module.scss` files.
- Server modules, helpers, hooks, libraries, UI utilities and tests use snake_case.
- JavaScript and TypeScript identifiers continue to use camelCase, including exported hooks such as `useDashboard`.
- Preserve names required by external APIs, environment variables and generated files.

Run `yarn check` before opening a pull request. It includes the filename convention check.

## Dependencies

Dependabot opens weekly update PRs for npm packages, GitHub Actions and the Docker base image ([.github/dependabot.yml](.github/dependabot.yml)). Minor and patch updates are grouped; major updates arrive separately. New versions wait a few days before Dependabot proposes them. Security updates arrive as soon as an advisory is published. Merge an update only when CI is green, and read the changelog of a major update before merging.

## Releases

Commit messages start with a [Conventional Commits](https://www.conventionalcommits.org/) type, then the gitmoji and a short sentence, for example `feat: ✨ Add a public demo` or `fix: 🐛 Show readable Pipeline times`. Write the sentence for users: `feat` and `fix` lines become the release notes (under Added and Fixed). `perf` and `revert` appear under Changed, `security` under Security. `docs`, `refactor`, `test`, `chore`, `ci`, `build` and `style` stay out of the notes. A breaking change gets a `!` after the type (`feat!:`) or a `BREAKING CHANGE:` footer.

Releases are automated with [release-please](https://github.com/googleapis/release-please). After CI passes on `main`, `.github/workflows/project_release.yml` keeps a release pull request open with the next version in `package.json` and its section in [CHANGELOG.md](CHANGELOG.md). Before 1.0, `feat` bumps the minor version and `fix` the patch version. Edit the notes in that pull request if they need polish, then merge it to release: the workflow creates the `vX.Y.Z` tag, the GitHub release and the Docker images (`X.Y.Z`, `X.Y` and `latest`). Do not edit the version, the changelog or tags by hand outside that pull request. Day-to-day work happens on `dev` and reaches `main` as a fast-forward. After every green push to `main`, the workflow fast-forwards `dev` to it as well, so the release commit lands on `dev` without a manual step; it leaves `dev` alone when `dev` already has commits that `main` does not. Run `git pull` on `dev` after a release before you continue.

GitHub does not run CI on a pull request opened with the workflow's own token. To get CI on the release pull request, add a fine-grained personal access token with contents and pull-request write access as the `RELEASE_PLEASE_TOKEN` secret.
