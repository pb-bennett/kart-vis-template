# Basemap Config Wiring Report

Generated: 2026-06-30 12:56:22 Europe/Oslo

## Changes Made

- Updated `src/components/Map.jsx` to import basemap definitions from `src/config/basemaps.js`.
- Replaced the local hardcoded basemap object with configured basemap lookup data.
- Replaced the hardcoded `<option>` elements with options generated from the configured basemap list.
- Wired the default basemap to `defaultBasemapId`.
- Wired `TileLayer` attribution, tile URL, and `maxNativeZoom` to the selected configured basemap.

## Behavior Intended To Remain Unchanged

- Available basemaps remain:
  - Kartverket topographic color
  - Kartverket topographic gray tone
  - OpenStreetMap
- Default basemap remains `geonorgeGraatone`.
- Labels, tile URLs, attribution, `maxZoom={19}`, and native zoom values are preserved.
- Basemap selector layout and styling are unchanged.
- Layer rendering, point/line styling, popups, legend, export, measurement, coordinate display, data files, sidebar, layout, branding, and search/filter logic were not changed.

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

Wire map layer metadata from `src/config/layers.js` one small piece at a time, starting with non-visual values such as render order and min zoom thresholds before moving point/line styling or popup fields.

