# Product and interface direction

This document describes the interface decisions contributors should follow when extending Orchestrarr. It describes the current product language, not the history of how the interface arrived here.

## Product character

Orchestrarr is a calm operations instrument for a personal media stack. It helps a technically capable operator scan state, understand what changed and take the next useful action.

The interface is:

- **Quiet.** Surfaces, borders and decoration stay subordinate to content and status.
- **Dense.** A screen should expose useful operational state without making the operator open every row.
- **Precise.** Labels describe the data actually available. The interface never invents an ETA, permission, timestamp or healthy state.
- **Fast.** Navigation, search and common actions are available from the keyboard and do not depend on animation.
- **Trustworthy.** Loading, unavailable, unconfigured, failed and healthy are distinct states.
- **Recognisable.** Artwork identifies media; the surrounding layout explains its operational state.

## Current design decisions

### 1. Show state before decoration

Every page answers a practical question first: what is happening, what needs attention or what can I do next? Use artwork and accent colour to support recognition and hierarchy. Do not use cards, gradients or decorative illustrations to create importance that the data does not have.

### 2. Use one visual language across the product

All routes share the same shell, semantic tokens, typography, controls, status shapes and spacing scale. A new page should compose existing primitives before introducing a new surface or interaction pattern.

### 3. Make the operator's next action obvious

Primary actions sit close to the item or state they affect. Row actions stay quiet until hover or focus, remain available on touch, and use specific verbs such as **Search again**, **Import now**, **Approve** or **Open**. Avoid generic actions such as **Manage** when the concrete action is known.

### 4. Preserve context while moving through the stack

Titles have one canonical detail route: `/title/movie/:id`, `/title/tv/:id`, with optional `/sN` or `/sNeN` focus. Collection filters and sort state live in the URL when sharing or browser navigation benefits from it. Opening a title keeps enough context to return to the originating collection.

### 5. Reveal complexity progressively

The overview exposes triage-level information. Collection pages expose filtering and operational actions. Detail views expose properties, history, recovery actions and linked services. Technical fields, episode details and secondary actions open in place or in a drawer instead of competing with the primary reading path.

### 6. Treat missing data honestly

Use separate UI for loading, unavailable, not configured, empty, degraded and failed. A missing integration must not look healthy because its count is zero. A loading value must not briefly appear as “Unavailable”. Unknown data stays unknown until a source answers.

### 7. Let color support meaning, never carry it alone

The accent identifies focus and action. Status uses both a shape and a label; color is an additional cue. Reserve warning and danger colors for conditions that require attention. Do not color ordinary navigation or every interactive element.

### 8. Keep media and operations together

A title page combines recognition, availability, request state, acquisition state, playback context and linked services. Do not split a useful title decision across several unrelated dashboards when the API can provide the context together.

### 9. Make every interaction touch-safe and keyboard-complete

Hover may reveal detail, but it may not be the only way to reach an action. Use native buttons, links, inputs, lists and dialogs. Keep visible focus, logical tab order, readable labels and a non-pointer path for every action.

### 10. Motion confirms a change; it does not perform the change

Use short, restrained transitions for pressed states, drawers, expandable details and poster navigation. Reduced-motion users and browsers without the View Transitions API receive the same information and actions without animation.

### 11. Translate interface copy without translating service contracts

Interface labels, explanations, actions, accessibility names and status labels use the shared locale layer. English is the fallback so an incomplete translation remains usable. Values returned by Plex, Sonarr, Radarr and other services stay in their original form for matching, logging and troubleshooting; only their visible status label is translated.

## Visual foundations

### Surfaces and color

Feature styles consume semantic tokens from `src/styles/settings/_index.scss`. Use the existing roles instead of hard-coding product colors:

- Canvas: `--background-canvas`
- Content surfaces: `--background-primary`, `--background-secondary`, `--background-tertiary`
- Interaction: `--background-hover`, `--background-active`
- Text: `--foreground-primary`, `--foreground-secondary`, `--foreground-muted`, `--foreground-disabled`
- Borders: `--border-subtle`, `--border-primary`, `--border-strong`
- Accent: signal cyan `#2bd4c5` in dark mode and teal `#0a7a71` in light mode
- Meaning: `--success`, `--warning`, `--danger`, `--info`

Dark and light themes use the same semantic roles. Check contrast whenever a new color pairing is introduced.

### Typography

Inter Variable is bundled with the application for reliable local-network use. The base size is 13px. Use 12px for metadata and 11px only for compact labels. Page titles are 18px; section headings are 13px. Use sentence case for interface copy and tabular numerals for counts, dates and measurements.

Typography creates hierarchy through size, weight, spacing and placement before color. Do not introduce a second UI typeface or use all caps to manufacture emphasis.

### Spacing and dimensions

Use the shared spacing tokens from 2px through 32px. The standard control is 28px high; touch-oriented controls use 36px. Dense row actions may use the 24px small control. Standard list rows are 40px and the top bar is 44px. The desktop content gutter is 24px and the panel radius is 8px.

### Controls

Render actions through `Button` or `buttonClass()`:

- `solid`: the primary action for the current task
- `quiet`: a normal secondary action
- `ghost`: a low-emphasis row or card action
- `icon`: an icon-only action with an accessible label
- `link`: an inline navigation or supporting action
- `danger`: a destructive action, used with one of the action styles above

Do not create page-specific button styles. Add a class only for layout or a genuinely unique component treatment.

### Status

Use `StatusIcon` with a visible text label. The shared status mapping uses shape and text to distinguish waiting, active, complete, attention and failed or unknown. An unfamiliar state must remain visibly unresolved; it must never default to healthy.

## Page grammar

- **Shell:** grouped navigation, current page context, search, refresh, theme and attention entry point. The shell remains stable while page content changes.
- **Overview:** triage first. Show current playback, work needing approval, work needing attention, recent additions, acquisition progress and recent activity in that order.
- **Collection:** keep search, filters, sort and pagination beside the result set. Use full-width rows or tables for operational scanning.
- **Detail:** lead with identity and status, then availability and actions, then supporting history and service context. Keep the primary decision visible without opening another page.
- **Integration editor:** keep connection fields and test/save actions together. Credentials stay server-side and existing secret values are never displayed.
- **Settings:** group preferences, access and notifications by responsibility. Explain a setting at the point of use.

## State patterns

Every page should account for:

- Loading: preserve the final layout with skeletons.
- Empty: explain why there is nothing to show and what can be done next.
- Unconfigured: distinguish an optional integration from a failed integration.
- Unavailable: identify the source that did not answer.
- Error: explain the failed operation and provide a safe retry where possible.
- Populated: show the primary state first and keep secondary metadata quiet.

## Interaction and accessibility

- `⌘K` or `/` opens the command palette; `G` followed by a shortcut letter navigates to a page; `[` toggles the sidebar; `Esc` closes overlays.
- Use native controls and preserve visible `:focus-visible` styling.
- Give dialogs, menus, listboxes, status regions and icon-only controls accessible names and states.
- Keep actions reachable by keyboard and touch when they are revealed on hover.
- Respect reduced motion and avoid making data comprehension depend on animation.
- Keep DOM order aligned with priority on narrow screens; wide-screen layout may rearrange content visually.

## Contribution rules

When adding an interface feature:

1. Identify the user decision or operational question it supports.
2. Choose the closest existing page pattern and shared component.
3. Define loading, empty, unconfigured, unavailable and error states before styling the populated state.
4. Use semantic tokens, existing control variants and the shared status mapping.
5. Add keyboard, touch and reduced-motion behavior from the start.
6. Keep route state, API contracts and source-service links explicit.
7. Update this document only when the product language or a shared decision changes; local implementation details belong in the code.

### Comments

Comments should preserve reasoning that a future contributor cannot recover from the code alone. Use them for security assumptions, third-party API quirks, state invariants, accessibility exceptions and contracts between files or components. Keep comments close to the code they explain, and update them when the behavior changes.

Do not narrate component names, prop names, selectors or straightforward control flow. If a block needs a long explanation, prefer a clearer name, a smaller function or a contributor note in this document.
