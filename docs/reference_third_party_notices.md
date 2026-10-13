# Third-party notices

Orchestrarr's original source code is licensed under [AGPL-3.0](../LICENSE). The project identity and original-author notice are documented in [NOTICE](../NOTICE) and [TRADEMARKS.md](../TRADEMARKS.md). This does not relicense third-party software, font files, trademarks, metadata or artwork.

## Bundled browser dependencies

| Component | License | Included notice |
| --- | --- | --- |
| React | MIT | [React notice](../public/licenses/reference_react.txt) |
| React DOM | MIT | [React DOM notice](../public/licenses/reference_react_dom.txt) |
| Scheduler | MIT | [Scheduler notice](../public/licenses/reference_scheduler.txt) |
| Inter / @fontsource-variable/inter | SIL Open Font License 1.1 | [Inter notice](../public/licenses/reference_inter.txt) |

These notices are copied into the frontend build and available under `/licenses/`, including in Docker. Preserve them when distributing builds. Development tools and the Node/Alpine/Docker CLI base-image components retain their respective upstream licenses; this table covers the app's bundled browser dependencies.

## Metadata, artwork and branding

This product uses the TMDB API but is not endorsed or certified by TMDB.

The unmodified TMDB logo in `public/reference_tmdb.svg` comes from [TMDB's approved logos](https://www.themoviedb.org/about/logos-attribution): [original SVG](https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg). The logo and notice appear on the About page. TMDB's [API terms and attribution requirements](https://developer.themoviedb.org/docs/faq) apply separately, including requirements for commercial use.

Plex, TMDB, IMDb, Rotten Tomatoes, Metacritic and connected-service names or marks belong to their respective owners. Orchestrarr is an independent project and does not imply affiliation or endorsement. Operators supply their own service access and API keys. Open-sourcing the dashboard does not grant rights to redistribute films, posters or third-party data.

The images under public/demo/posters/ are original fictional demo artwork generated for Orchestrarr. They do not depict real titles, characters, people or service logos and are included only as local placeholder artwork for demo mode.
