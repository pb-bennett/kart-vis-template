# Sidebar Filter Config Wiring Report

Generated: 2026-06-30 11:14:06 Europe/Oslo

## Changes Made

- Updated `src/components/SidePanel.jsx` to use the active layer's configured `filters` definitions.
- Replaced hardcoded prøvetype/eier checkbox metadata with config-driven filter groups from `src/config/layers.js`.
- Preserved the current `prv_punkt` filter option ids, labels, and behavior:
  - `vannprøve`
  - `sedimentprøve`
  - `bløtbunnsfauna`
  - `ownerFK`
  - `ownerTK`
  - `ownerTR`
- Preserved current filter semantics:
  - selected options within a filter group are OR matches
  - multiple active filter groups are AND matches
- Preserved owner checkbox accent colors from config.
- Filter reset now clears the configured filter options for the active layer.
- Sidebar list filtering now combines configured search and configured filters.

## Behavior Intentionally Left Unchanged

- `Map.jsx` was not changed.
- Data files were not moved or renamed.
- Layer rendering was not changed.
- Popups were not changed.
- Export behavior was not changed.
- App layout and branding were not changed.
- Search behavior was only touched where needed to combine with configured filters.
- Layers without configured filters do not show filter controls.

## Validation

Commands run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Results:

- `npm.cmd run lint` passed with 0 errors.
- The existing warning remains in `src/app/page.js` for the unnecessary `hasActiveFilters` dependency in `useMemo`.
- `npm.cmd run build` passed.

## Recommended Next Phase

Move the remaining parent-level search/filter logic in `src/app/page.js` to shared config-driven helpers, so map and sidebar filtering use the same source of truth without duplicating field logic.

