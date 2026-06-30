# Shared Feature Filter Helpers Report

Generated: 2026-06-30 11:23:50 Europe/Oslo

## Changes Made

- Added `src/lib/features.js` with shared config-driven helpers:
  - `getFeatureProperty`
  - `getFeatureIdentity`
  - `getFirstNonEmptyProperty`
  - `featureMatchesSearch`
  - `featureMatchesFilters`
  - `filterFeatures`
  - `getConfiguredFilterOptions`
- Updated `src/app/page.js` to use `filterFeatures` with the `prv_punkt` layer config.
- Updated `src/components/SidePanel.jsx` to reuse shared helpers for:
  - configured search/filter matching
  - configured feature identity
  - first non-empty sidebar title/subtitle field lookup
  - configured filter option flattening

## Behavior Intended To Remain Unchanged

- `prv_punkt` search still matches `navn` and `vannlok-kode`.
- `prv_punkt` filters still support:
  - `vannprøve`
  - `sedimentprøve`
  - `bløtbunnsfauna`
  - `ownerFK`
  - `ownerTK`
  - `ownerTR`
- Map filtering remains limited to `prv_punkt`, matching the previous app behavior.
- Other map layers remain unfiltered in `page.js`.
- Sidebar search/filter behavior remains config-driven as before this phase.
- `Map.jsx`, data files, layer rendering, popups, export behavior, layout, and branding were not changed.

## Notes

- The previous `src/app/page.js` duplicated search/filter booleans were removed because the shared helper now handles the same logic from `layers.js`.
- The previous `react-hooks/exhaustive-deps` warning in `src/app/page.js` disappeared naturally after removing the duplicate derived booleans.
- No tests were added; the helper API is intentionally small and template-friendly.

## Validation

Commands run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Results:

- `npm.cmd run lint` passed with no errors and no warnings.
- `npm.cmd run build` passed.

## Recommended Next Phase

Start moving map-facing display metadata to config in a narrow step, such as wiring only basemap definitions from `src/config/basemaps.js` into `Map.jsx` before touching layer rendering or popups.

