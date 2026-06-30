# Map Visual Config Wiring Report

Generated: 2026-06-30 13:18:22 Europe/Oslo

## Changes Made

- Updated `src/components/Map.jsx` to use visual metadata from `src/config/layers.js`.
- Added small local helpers for:
  - resolving a layer's `symbol` config
  - resolving `styleByProperty` overrides by property value
- Wired line visual values from config:
  - default line color
  - SPO/AFO color overrides
  - dash arrays
  - line weight
  - line opacity
  - selected line glow color and weight
- Wired point visual values from config:
  - point stroke color
  - point fill color
  - point radius
  - stroke width
  - fill opacity
  - selected point glow color
  - owner-based stroke overrides for `FK`, `TK`, and `TR`

## Behavior Intended To Remain Unchanged

- `prv_punkt` remains circle markers.
- `prv_punkt` owner colors remain:
  - default/FK magenta
  - TK green
  - TR orange-red
- `ult_punkt` remains square divIcon markers.
- `utl_ledning` remains dashed.
- SPO and AFO line colors and dash behavior remain unchanged.
- Selected point and selected line highlights remain visually the same.
- Label behavior and label content are unchanged.
- Popup content was not changed.
- Legend content was not changed.
- Export, measurement, coordinate display, basemap behavior, sidebar behavior, data files, app layout/branding, and search/filter logic were not changed.

## Assumptions

- Existing `layers.js` visual values already matched the hardcoded map values, so no config correction was needed.
- Existing domain checks for overflow points, owners, and `FCODE` remain in `Map.jsx`; this phase only moved their visual values to config.

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

Wire popup/display field metadata from `src/config/layers.js` in a focused pass, keeping the current popup layout and labels unchanged where possible.

