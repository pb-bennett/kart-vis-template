# Map Layer Metadata Wiring Report

Generated: 2026-06-30 13:01:31 Europe/Oslo

## Changes Made

- Updated `src/components/Map.jsx` to import layer definitions from `src/config/layers.js`.
- Added a layer lookup for map metadata.
- Replaced hardcoded map feature combination order with `layer.renderOrder`.
- Replaced hardcoded line visibility threshold with configured `layer.minZoom`.
- Replaced hardcoded point visibility threshold with configured `layer.minZoom`.
- Replaced hardcoded label visibility threshold with configured `layer.labelMinZoom`.

## Behavior Preserved

- Render order remains:
  - `utl_ledning` first, configured as `renderOrder: 10`
  - `ult_punkt` second, configured as `renderOrder: 20`
  - `prv_punkt` last/on top, configured as `renderOrder: 30`
- `utl_ledning` lines remain visible at zoom `>= 13`.
- `ult_punkt` points remain visible at zoom `>= 13`.
- `prv_punkt` points remain visible at all current zoom levels because `minZoom` is `null`.
- Point labels remain visible at zoom `>= 14` for layers with `labelMinZoom: 14`.

## Intentionally Left Unchanged

- Point and line styling were not changed.
- Icons and marker shapes were not changed.
- Popup content was not changed.
- Legend content was not changed.
- Export behavior was not changed.
- Measurement tool behavior was not changed.
- Coordinate display was not changed.
- Basemap behavior was not changed.
- Sidebar behavior was not changed.
- Data files were not changed.
- App layout and branding were not changed.
- Search/filter logic was not changed.

## Validation

Commands run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Results:

- `npm.cmd run lint` passed with no ESLint errors or warnings.
- `npm.cmd run build` passed.

## Recommended Next Phase

Wire map layer visual metadata in a small follow-up, starting with point/line colors and symbols from `layers.js` while keeping popup content untouched.

