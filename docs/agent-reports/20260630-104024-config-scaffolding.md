# Config Scaffolding Report

Generated: 2026-06-30 10:40:24 Europe/Oslo

## Files Added

- `src/config/appConfig.js`
- `src/config/theme.js`
- `src/config/basemaps.js`
- `src/config/layers.js`
- `src/config/labels.nb.js`
- `docs/agent-reports/20260630-104024-config-scaffolding.md`

## Captured Values

`appConfig.js` captures the current app-level defaults:

- App title: `Kart Vis`
- Description: `Kartvisualisering for Færder Kommune`
- Norwegian Bokmål locale/language: `nb-NO`
- Færder branding fields
- Logo path: `/FK_logo.svg`
- Basic loading, empty, search-empty, error, and malformed-data text

`theme.js` captures shared UI and map colors currently hardcoded in components:

- Primary blue: `#4782cb`
- Text gray: `#656263`
- Muted gray: `#9ca3af`
- Backgrounds, borders, selected row background, selected map highlight
- Map symbol colors for sampling points, overflow points, owners, and line categories
- Basic control constants such as sidebar width, border radii, z-index values, line weight, and point radii

`basemaps.js` captures the current basemap options:

- Kartverket topographic color: `geonorge`
- Kartverket topographic gray tone: `geonorgeGraatone`, marked as default
- OpenStreetMap: `osm`
- Each entry includes id, label, tile URL, attribution, max native zoom, and default flag

`layers.js` captures metadata for the current layers:

- `prv_punkt`
  - Point geometry, current data path, default visibility, sidebar visibility, render order, label zoom, id/fallback fields, title/subtitle/search fields, display/popup/sidebar/export fields, circle symbol styling, owner styling by `Eier`, and current sample-type/owner filters.

- `ult_punkt`
  - Point geometry, current data path, min zoom, label zoom, id/fallback fields, title/subtitle/search fields, display/popup/sidebar/export fields, square overflow-point styling, and `FCODE` style metadata.

- `utl_ledning`
  - `LineString` and `MultiLineString` geometry support, current data path, min zoom, id/fallback fields, title/subtitle/search fields, display/popup/sidebar/export fields, line symbol styling, and `FCODE` style variants for `SPO` and `AFO`.

`labels.nb.js` captures reusable Norwegian Bokmål labels currently hardcoded in the app:

- Basemap selector labels
- Tool/menu labels
- Legend labels
- Search, filter, and export labels
- Common popup/detail labels such as `Ukjent`, `Ingen registrert`, `Lengde`, `Materiale`, and `Dimensjon`
- Coordinate labels for WGS84 and UTM32N

## Intentionally Not Wired Yet

- No existing app components were edited.
- `src/app/layout.js` still contains the current metadata directly.
- `src/app/page.js` still imports data and owns state exactly as before.
- `src/components/Map.jsx` still contains the active basemap, style, popup, legend, measurement, and export logic.
- `src/components/SidePanel.jsx` still contains the active layer tabs, filters, logo, and feature-list display logic.
- Data files were not moved or renamed.
- Layer ids were not renamed.
- No runtime import path was changed.

The new config files are scaffolding only, so the running app behavior should be unchanged.

## Assumptions

- `nb-NO` is the suitable default locale/language for Norwegian Bokmål user-facing UI.
- Current data paths are recorded as strings because the config is not wired into the app yet.
- `ult_punkt` does not appear to expose `fid` consistently, so fallback id fields include `PSID`, `REF`, and `STATION`.
- `utl_ledning` is configured for both `LineString` and `MultiLineString` even though the current active file contains `MultiLineString`.
- Export fields capture the current CSV/export behavior where it exists; `utl_ledning` export metadata is included for future consistency even though the current export modal only handles point layers.

## Recommended Next Phase

Wire the lowest-risk config first:

1. Use `appConfig` for app metadata, language, and logo fields.
2. Use `basemaps` for the map basemap selector.
3. Use `theme` for shared colors that are repeated across components.
4. Use `layers` for sidebar tabs and list title/subtitle helpers.

Keep each step as a separate small commit and run `npm run lint` and `npm run build` after each phase.

## Validation

Validation run after this scaffold:

```powershell
npm.cmd run lint
npm.cmd run build
git status --short
```

Results:

- `npm run lint` through PowerShell failed before running lint because local script execution blocks `npm.ps1`.
- `npm.cmd run lint` completed with 0 errors and 1 pre-existing warning in `src/app/page.js` about an unnecessary `useMemo` dependency: `hasActiveFilters`.
- `npm.cmd run build` initially failed in the restricted sandbox because Next.js could not fetch Google Fonts for `Geist` and `Geist Mono`.
- `npm.cmd run build` passed when rerun with network access.
- `git status --short` shows only the new config directory and this new agent report as untracked changes.
