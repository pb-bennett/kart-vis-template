# Template Inspection Report

Generated: 2026-06-30 07:58:23 Europe/Oslo

Repository: `kart-vis-template`

Scope: inspection and recommendations only. No functional code changes were made.

## 1. Current Project Architecture

### Framework and Versions

- Framework: Next.js App Router.
- Runtime UI stack: React and React DOM.
- Map stack: Leaflet with React Leaflet.
- Styling: Tailwind CSS v4 plus inline styles.
- Package versions from `package.json`:
  - `next`: `^16.0.10`
  - `react`: `19.2.0`
  - `react-dom`: `19.2.0`
  - `leaflet`: `^1.9.4`
  - `react-leaflet`: `^5.0.0`
  - `react-leaflet-cluster`: `^4.0.0`, installed but marker clustering is currently commented out.
  - `tailwindcss`: `^4`
  - `eslint`: `^9`

### Main Folders and Files

- `src/app/layout.js`
  - Defines fonts, imports global CSS, and sets metadata.
  - Metadata is still specific to the original app: title `Kart Vis`, description `Kartvisualisering for Færder Kommune`.
  - `<html lang="en">` does not match the Norwegian Bokmål UI direction.

- `src/app/page.js`
  - Main client-side page.
  - Imports all active data files directly from `src/data`.
  - Owns top-level state for selected feature, active layer, search query, and filters.
  - Dynamically imports `Map` with `ssr: false`, which is the right direction for Leaflet in Next.js.

- `src/components/Map.jsx`
  - Large client component containing most map behavior.
  - Handles basemap selection, Leaflet map creation, point rendering, line rendering, popups, labels, legend, measuring tool, coordinate copy, export modal, fly-to behavior, and auto-opening point popups.
  - Contains many reusable ideas, but it is currently tightly coupled to the original layer names, property names, colors, and domain labels.

- `src/components/SidePanel.jsx`
  - Client component for logo, layer tabs, search/filter UI, and feature list.
  - Also heavily tied to the original Færder/water-sampling schema.

- `src/app/globals.css`
  - Imports Tailwind and Leaflet CSS.
  - Defines basic CSS variables and font theme hooks.

- `src/data/`
  - Stores active and old/reference GeoJSON-like datasets plus field aliases.

- `public/`
  - Contains standard Next assets plus `FK_logo.svg`, the current municipality logo used by the sidebar.

- Project docs:
  - `APP_PLAN.md` and `TODO.md` describe earlier implementation goals, but contain encoding/mojibake in parts of the checked-in text.
  - `README.md` is still the default create-next-app README.

### Main Components

- `Home` in `src/app/page.js`
  - Coordinates state and passes layer data to `SidePanel` and `Map`.
  - Current state shape is simple and understandable:
    - `selected`
    - `activeLayer`
    - `searchQuery`
    - `filters`

- `SidePanel`
  - Renders:
    - Færder logo.
    - Three hardcoded layer tabs.
    - Search box only for `prv_punkt`.
    - Filter checkboxes for sample type and owner only for `prv_punkt`.
    - Feature list with hardcoded title/subtitle logic by active layer.

- `Map`
  - Renders:
    - Basemap selector.
    - Tools menu.
    - Measurement overlay.
    - Legend.
    - `MapContainer` with `TileLayer`.
    - `Polyline` for `LineString` and `MultiLineString`.
    - `CircleMarker` for sampling points.
    - `Marker` with `L.divIcon` square marker for overflow points.
    - Labels at zoom levels.
    - Popups.
    - Export modal for selected point datasets.

### Data Files

Active data:

- `src/data/prv_punkt.json`
  - `FeatureCollection`
  - 41 features
  - Geometry: `Point`
  - Properties include: `fid`, `PSID`, `FCODE`, `TYPE`, `DATEREG`, `DATECHANGE`, `MPNT_GUID`, `navn`, `vannlok-kode`, `Bløtbunnsfauna`, `sedimentprøve`, `vannprøve`, `Eier`, `utm_x`, `utm_y`.

- `src/data/ult_punkt.json`
  - `FeatureCollection`
  - 96 features
  - Geometry: `Point`
  - Properties include: `PSID`, `REF`, `STATION`, `FCODE`, `FUNC`, `YEAR`, `Z`, `DATEREG`, `DATECHANGE`, `utm_x`, `utm_y`.

- `src/data/utl_ledning.json`
  - `FeatureCollection`
  - 293 features
  - Geometry: `MultiLineString`
  - Properties include: `fid`, `LSID`, `FCODE`, `FCODEGROUP`, `LENGTH`, `DATEREG`, `DATECHANGE`, `MATERIAL`, `DIM`, `YEAR`, `SIGNREG`, `SIGNCHANGE`, `FROM_PSID`, `TO_PSID`, `LINE_GUID`, `orig_geom`.

Reference/older data:

- `src/data/prv_punkt_old.geojson`
  - `FeatureCollection`
  - 15 features
  - Geometry: `Point`
  - Older property schema using fields such as `REF`, `REFNO`, `STATION`, and `TYPE`.

- `src/data/prv_punkt_old.json`, `src/data/prv_punkt_old2.json`, `src/data/prv_punkt_old3.json`, `src/data/ult_punkt_old.json`
  - Older or intermediate data versions.

- `src/data/field_aliases.json`
  - Existing start of a display metadata model.
  - Defines global aliases and per-layer popup/display defaults for the original layers.
  - Not currently used by the app components.

### Styling Approach

- Tailwind utility classes provide layout and most spacing/typography.
- Inline style objects are used for many brand/theme colors:
  - Primary blue: `#4782cb`
  - Neutral text: `#656263`
  - Færder/sample magenta: `#c026d3`
  - Tønsberg/green: `#22c55e`
  - Tønsberg renseanlegg/orangered: `#ff4500`
  - Overflow orange: `#f97316`, `#fb923c`
  - AFO red: `#ef4444`
- Leaflet CSS is imported both in `globals.css` and `Map.jsx`. This works, but should be normalized during refactor.
- No shared theme object exists yet.

### Current Map and Layer Behavior

- Leaflet is loaded client-side only through `dynamic(() => import('../components/Map'), { ssr: false })`.
- All data is bundled by direct JSON imports from `src/data`.
- The map renders all three layers together, not just the active sidebar layer:
  - `utl_ledning` lines first.
  - `ult_punkt` points second.
  - `prv_punkt` points last, so they appear on top.
- The sidebar active layer controls which feature list is shown.
- Filtering/search currently only affects `prv_punkt`.
- `utl_ledning` lines are hidden when zoomed out; they render only at zoom `>= 13`.
- `ult_punkt` points are hidden below zoom 13 by current visible point filtering, while `prv_punkt` points remain visible.
- Labels are shown around zoom `>= 14`.
- Initial center uses the first point feature from all loaded data, with fallback `[59.2, 10.4]`.
- Initial zoom is hardcoded to `11`; max zoom is `19`.
- Basemaps are hardcoded:
  - Kartverket topographic color.
  - Kartverket topographic gray tone, default.
  - OpenStreetMap.
- Popups are hardcoded by inferred domain type:
  - Sampling point popup.
  - Overflow point popup.
  - Overflow line popup.
- Feature selection is synced between map and sidebar by storing the whole selected feature in React state.
- Point selection flies to the feature and auto-opens popup. Line selection uses the first coordinate of the first line for fly-to.
- Map includes additional tools:
  - Measurement tool.
  - Coordinate display and copy buttons.
  - GeoJSON/CSV export for `prv_punkt` and `ult_punkt`.

## 2. What Is Already Reusable

### Components

- The top-level `Home` pattern is reusable:
  - Load data.
  - Keep selected feature in state.
  - Keep active layer in state.
  - Pass state to map and sidebar.

- `SidePanel` has a reusable interaction pattern:
  - Layer tabs.
  - Search input.
  - Filter section.
  - Count display.
  - Feature list with selected highlight.

- `Map` contains reusable sub-behaviors:
  - Basemap selector.
  - Dynamic Leaflet setup for Next.js.
  - Fly-to on selection.
  - Auto-open point popup.
  - Copyable coordinate display.
  - Simple measurement tool.
  - Legend pattern.
  - GeoJSON/CSV export pattern.

### Data Loading Approach

- Direct imports from `src/data/*.json` are simple, fast, and suitable for small municipal map apps deployed to Vercel.
- Keeping datasets in the repository avoids introducing a backend, database, auth, or API.
- Current `FeatureCollection` structure is already compatible with a config-driven layer model.

### Leaflet Setup

- `Map` is a client component.
- The page dynamically imports `Map` with SSR disabled, avoiding common Leaflet/window errors in Next.js.
- Basic support exists for:
  - `Point`
  - `LineString`
  - `MultiLineString`
- Coordinate transformation from GeoJSON `[lng, lat]` to Leaflet `[lat, lng]` is handled in the render paths.

### UI Patterns

- Norwegian Bokmål UI labels are already the default intent.
- Sidebar list plus map selection is a good reusable interaction model.
- Tabs for layers are useful for small apps.
- Search and filters are understandable and simple.
- Legend, basemap selector, and tool controls are valuable for future apps.

## 3. What Is Currently Hardcoded

### Færder/Færder Kommune Branding

- `public/FK_logo.svg` is rendered directly by `SidePanel`.
- `alt="Færder Kommune"` is hardcoded.
- Metadata description says `Kartvisualisering for Færder Kommune`.
- Legend owner labels include:
  - `Færder kommune`
  - `Tønsberg kommune`
  - `Tønsberg renseanlegg`
- Owner codes `FK`, `TK`, and `TR` are hardcoded into filter logic and map styling.

### Water Sampling and Overflow Terminology

Hardcoded UI/domain labels include:

- `Prøvetakingspunkt`
- `Overløpspunkt`
- `Overløpsledning`
- `Prøvetyper`
- `Vannprøve`
- `Sedimentprøve`
- `Bløtbunnsfauna`
- `Vannlokalitetkode`
- `SPO ledning`
- `AFO ledning`
- `Ledninger`
- `Punkter`

These should remain as the default reference app labels, but become configurable for the template.

### Layer Names

Layer ids and names are hardcoded in multiple places:

- `prv_punkt`
- `ult_punkt`
- `utl_ledning`

The same ids appear in:

- Imports in `src/app/page.js`.
- `allLayers` object.
- Active layer default.
- Filter reset logic.
- Sidebar layer tab config.
- Map render ordering.
- Export modal.
- Popup logic.

### Colors and Icons

Hardcoded colors include:

- Primary UI blue: `#4782cb`
- Text gray: `#656263`
- Sampling point magenta: `#c026d3`, `#e879f9`
- Overflow point orange: `#f97316`, `#fb923c`
- Selected highlight: `#fbbf24`
- Owner green: `#22c55e`
- Owner orangered: `#ff4500`
- Line red: `#ef4444`
- Default line blue: `#3b82f6`

Hardcoded marker choices:

- Sampling points use circle markers.
- Overflow points use square `DivIcon` markers.
- SPO/AFO lines use dashed line styles.
- Manual SVG icons are embedded for copy, tools, export, and filter controls.

### Field Names

The app directly references specific property names:

- Shared identifiers:
  - `fid`
  - `PSID`
  - `DATEREG`
  - `DATECHANGE`
  - `utm_x`
  - `utm_y`

- Sampling point fields:
  - `navn`
  - `vannlok-kode`
  - `vannprøve`
  - `sedimentprøve`
  - `Bløtbunnsfauna`
  - `Eier`

- Overflow point fields:
  - `REF`
  - `STATION`
  - `FCODE`
  - `FUNC`

- Line fields:
  - `LSID`
  - `FCODE`
  - `LENGTH`
  - `MATERIAL`
  - `DIM`

### Map Center, Zoom, and Bounds

- Fallback center: `[59.2, 10.4]`.
- Initial zoom: `11`.
- Max zoom: `19`.
- Line visibility threshold: zoom `>= 13`.
- Overflow point visibility threshold: zoom `>= 13`.
- Label visibility threshold: zoom `>= 14`.
- Fly-to zoom: `16`.
- No explicit configured bounds or max bounds.

### Popup and Sidebar Assumptions

- Popup fields are hardcoded separately for sampling points, overflow points, and lines.
- Sidebar title/subtitle logic assumes:
  - Lines are identified by `LSID`, `FCODE`, and `LENGTH`.
  - Sampling points are identified by `navn`, `vannlok-kode`, and `PSID`.
  - Overflow points are identified by `navn`, `REF`, and `PSID`.
- Selected feature comparison uses `fid`, but `ult_punkt.json` does not include `fid` in the inspected key list. That can cause fragile selection behavior for layers without `fid`.
- Export supports only `prv_punkt` and `ult_punkt`, with fixed CSV headers.
- Line fly-to assumes nested coordinates and uses `coordinates[0][0]`, which works for `MultiLineString` but should be generalized for all geometry types.

### Norwegian Labels That Should Become Configurable

Examples:

- `Bakgrunnskart`
- `Topografisk Norgeskart farge`
- `Topografisk Norgeskart gråtone`
- `Verktøy`
- `Tegnforklaring`
- `Søk i navn eller vannlok...`
- `Filter på prøvetype`
- `Filtrer på prøvetype`
- `Filtrer på eier`
- `Nullstill`
- `Eksporter data`
- `Velg datatype`
- `Velg format`
- `Avbryt`
- `Last ned`
- `Ingen data å eksportere`
- `Registrert`
- `Funksjon`
- `Lengde`
- `Materiale`
- `Dimensjon`
- `Ukjent`
- `Ingen registrert`
- Coordinate labels such as `WGS84 (GPS)` and `UTM Zone 32N (EUREF89)` may also need config for other municipalities or coordinate systems.

## 4. Recommended Target Template Architecture

Keep the app simple and static-data friendly. A good target structure:

```text
src/
  app/
    layout.js
    page.js
    globals.css
  config/
    appConfig.js
    theme.js
    basemaps.js
    layers.js
    labels.nb.js
  data/
    README.md
    reference/
      faerder/
        prv_punkt.json
        ult_punkt.json
        utl_ledning.json
    sample/
      example_points.json
      example_lines.json
  components/
    map/
      Map.jsx
      MapLayer.jsx
      PointFeature.jsx
      LineFeature.jsx
      PopupContent.jsx
      Legend.jsx
      BasemapControl.jsx
      MeasureTool.jsx
      CoordinateDisplay.jsx
    sidebar/
      SidePanel.jsx
      LayerTabs.jsx
      SearchBox.jsx
      FilterPanel.jsx
      FeatureList.jsx
      FeatureSummary.jsx
    layout/
      AppShell.jsx
      HeaderLogo.jsx
  lib/
    geojson/
      geometry.js
      bounds.js
      fields.js
      filters.js
      export.js
      validation.js
```

Suggested principles:

- Keep `src/app/page.js` thin. It should import config, load configured data, and compose the shell.
- Keep the original Færder app understandable by preserving a `reference/faerder` config and data set.
- Move all project-specific strings, fields, colors, layer ids, and render rules into config files.
- Put generic GeoJSON operations in `src/lib/geojson`.
- Avoid adding a backend, database, authentication, or heavy state-management library.
- Continue using static files and client-side rendering for the small-app template use case.

## 5. Suggested Configuration Model

The template can use JavaScript config first. JSON can come later if non-developers need to edit config directly.

### App Config

Recommended fields:

```js
export const appConfig = {
  title: 'Kart Vis',
  description: 'Kartvisualisering for Færder kommune',
  language: 'nb',
  branding: {
    kommune: 'Færder kommune',
    projectName: 'Kart Vis',
    logoSrc: '/FK_logo.svg',
    logoAlt: 'Færder kommune',
    headerText: null,
  },
  states: {
    loading: 'Laster kartdata...',
    empty: 'Ingen treff',
    error: 'Kunne ikke laste kartdata',
  },
};
```

### Theme Config

Recommended fields:

```js
export const theme = {
  colors: {
    primary: '#4782cb',
    text: '#656263',
    border: '#e5e7eb',
    selected: '#fbbf24',
    panelBackground: '#ffffff',
    mapControlBackground: '#ffffff',
  },
};
```

Layer-specific symbol colors should live with layer definitions, not global theme, unless they are genuinely shared brand colors.

### Map Config

Recommended fields:

```js
export const mapConfig = {
  initialCenter: [59.2, 10.4],
  initialZoom: 11,
  maxZoom: 19,
  fitBoundsOnLoad: true,
  boundsPadding: [24, 24],
  maxBounds: null,
  flyToZoom: 16,
  labelMinZoom: 14,
  lineMinZoom: 13,
};
```

### Basemap Settings

Recommended fields:

```js
export const basemaps = [
  {
    id: 'geonorgeGraatone',
    label: 'Topografisk Norgeskart gråtone',
    url: 'https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png',
    attribution: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>',
    maxNativeZoom: 18,
    default: true,
  },
  {
    id: 'geonorge',
    label: 'Topografisk Norgeskart farge',
    url: 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
    attribution: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>',
    maxNativeZoom: 18,
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19,
  },
];
```

### Layer Definitions

Recommended fields:

```js
export const layers = [
  {
    id: 'prv_punkt',
    label: 'Prøvetakingspunkt',
    pluralLabel: 'Prøvetakingspunkter',
    geometryTypes: ['Point'],
    data: () => import('../data/reference/faerder/prv_punkt.json'),
    defaultVisible: true,
    showInSidebar: true,
    minZoom: null,
    labelMinZoom: 14,
    idField: 'fid',
    fallbackIdFields: ['MPNT_GUID', 'PSID', 'navn'],
    titleField: 'navn',
    subtitleFields: ['vannlok-kode', 'PSID'],
    searchFields: ['navn', 'vannlok-kode', 'PSID'],
    symbol: {
      shape: 'circle',
      radius: 6,
      strokeColor: '#c026d3',
      fillColor: '#e879f9',
      selectedColor: '#fbbf24',
    },
    styleByProperty: [
      {
        field: 'Eier',
        values: {
          FK: { strokeColor: '#c026d3', label: 'Færder kommune' },
          TK: { strokeColor: '#22c55e', label: 'Tønsberg kommune' },
          TR: { strokeColor: '#ff4500', label: 'Tønsberg renseanlegg' },
        },
      },
    ],
    displayFields: ['navn', 'vannlok-kode', 'PSID', 'DATEREG'],
    popupFields: ['navn', 'vannlok-kode', 'PSID', 'vannprøve', 'sedimentprøve', 'Bløtbunnsfauna', 'DATEREG'],
    sidebarFields: ['navn', 'vannlok-kode'],
    exportFields: ['fid', 'navn', 'vannlok-kode', 'PSID', 'DATEREG', 'utm_x', 'utm_y'],
    filters: [
      {
        id: 'sampleType',
        label: 'Prøvetype',
        type: 'booleanAny',
        options: [
          { field: 'vannprøve', label: 'Vannprøve' },
          { field: 'sedimentprøve', label: 'Sedimentprøve' },
          { field: 'Bløtbunnsfauna', label: 'Bløtbunnsfauna' },
        ],
      },
    ],
  },
];
```

### Geometry Types

The first template version should explicitly support:

- `Point`
  - Render as circle marker or icon marker.
  - Configurable radius, shape, stroke, fill, label field, min zoom, popup fields.

- `LineString`
  - Render as `Polyline`.
  - Convert `[lng, lat]` to `[lat, lng]`.
  - Configurable color, width, opacity, dash pattern, min zoom, popup fields.

- `MultiLineString`
  - Render as `Polyline` with nested positions.
  - Same style model as `LineString`.

Later optional support:

- `Polygon`
- `MultiPolygon`

For polygons, add fill color, fill opacity, stroke style, and area/perimeter display only when needed.

### Display, Popup, Sidebar, and Search Fields

Recommended conventions:

- `idField`: stable unique field used for selection.
- `fallbackIdFields`: fallbacks when `idField` is missing.
- `titleField`: main label.
- `subtitleFields`: first non-empty field becomes subtitle.
- `displayFields`: default detail panel fields.
- `popupFields`: compact popup fields.
- `sidebarFields`: list title/subtitle fields.
- `searchFields`: fields searched by the sidebar.
- `fieldLabels`: layer-specific label overrides.
- `formatters`: date, number, boolean, length, diameter, coordinate, and fallback display.

### Icons and Colors

Use a symbol config rather than branching on layer ids:

```js
symbol: {
  shape: 'circle', // circle | square | icon
  iconSrc: null,
  radius: 6,
  strokeColor: '#c026d3',
  fillColor: '#e879f9',
  strokeWidth: 2,
  lineDash: null,
}
```

For style variants:

```js
styleByProperty: [
  {
    field: 'FCODE',
    values: {
      SPO: { color: '#22c55e', dashArray: '10, 10', label: 'SPO ledning' },
      AFO: { color: '#ef4444', dashArray: '10, 10', label: 'AFO ledning' },
    },
    default: { color: '#3b82f6', dashArray: '10, 10' },
  },
]
```

### Empty, Loading, and Error States

Add configurable UI copy:

- Global loading message.
- Per-layer empty list message.
- Search empty message.
- Filter empty message.
- Data load error message.
- Malformed geometry warning message for skipped features.

The first implementation can log malformed feature details to the console and show a simple user-facing error count.

## 6. Refactor Plan

Each phase should be a small safe commit and preserve a working app.

### Phase 1: Documentation and Baseline Checks

- Add an architecture note to `README.md` or `docs/`.
- Record the current app as the Færder reference implementation.
- Do not move behavior yet.
- Validate current baseline with lint/build.

Safe commit: documentation only.

### Phase 2: Introduce Config Files Without Changing Behavior

- Add:
  - `src/config/appConfig.js`
  - `src/config/theme.js`
  - `src/config/basemaps.js`
  - `src/config/layers.js`
  - `src/config/labels.nb.js`
- Copy current hardcoded labels, colors, basemaps, and layer metadata into config.
- Keep components still using old constants until the config is reviewed.

Safe commit: config scaffolding, no behavior changes.

### Phase 3: Wire App Metadata and Branding to Config

- Use `appConfig` in `layout.js` metadata.
- Change `<html lang>` to configured `nb`/`nb-NO`.
- Use configured logo source and alt text in the sidebar.
- Keep `FK_logo.svg` as the default reference asset.

Safe commit: config-driven metadata/branding.

### Phase 4: Move Layer Tabs and Sidebar Fields to Config

- Replace hardcoded `layers` array in `SidePanel` with configured layer definitions.
- Add helper functions for title/subtitle resolution.
- Add robust feature id helper using `idField` and `fallbackIdFields`.
- Preserve current labels and list output.

Safe commit: sidebar config wiring.

### Phase 5: Move Search and Filters to Config

- Generalize search to `searchFields`.
- Generalize boolean filters to configured filter groups.
- Preserve current `prv_punkt` behavior by encoding the sample-type and owner filters in config.
- Keep filters hidden for layers without filter config.

Safe commit: config-driven search/filter.

### Phase 6: Move Map Layer Styling to Config

- Introduce generic `MapLayer`, `PointFeature`, and `LineFeature` components.
- Render based on `geometryTypes` and symbol/style config.
- Preserve current render order, colors, thresholds, and selected styles.
- Keep `Point`, `LineString`, and `MultiLineString` supported.

Safe commit: generic layer rendering.

### Phase 7: Move Popup, Legend, and Export Fields to Config

- Replace popup branches with `PopupContent` driven by `popupFields`.
- Build legend from configured layer symbols and style variants.
- Build export fields from `exportFields`.
- Keep CSV and GeoJSON client-side export only.

Safe commit: configurable display surfaces.

### Phase 8: Add GeoJSON Validation Helpers

- Add small helpers under `src/lib/geojson`:
  - `getFeatureId`
  - `getFeatureTitle`
  - `getFeatureCoordinate`
  - `getFeatureBounds`
  - `isSupportedGeometry`
  - `normalizeLinePositions`
- Skip malformed features gracefully and report counts.

Safe commit: resilience improvements.

### Phase 9: Organize Reference Data and Template Example Data

- Move or copy current Færder data under `src/data/reference/faerder/`.
- Add tiny generic example files under `src/data/sample/`.
- Update layer config imports.
- Keep the current Færder config as the default app profile.

Safe commit: data organization while preserving default app.

### Phase 10: README Template Instructions

- Replace default create-next-app README with:
  - How to run.
  - How to configure branding.
  - How to add a layer.
  - Supported geometry types.
  - Vercel deployment notes.
  - Data size guidance.

Safe commit: documentation for users of the template.

## 7. Validation Plan

Run after each functional phase:

```powershell
npm run lint
npm run build
```

Run when dependencies change or after a fresh clone:

```powershell
npm install
```

Run for manual review:

```powershell
npm run dev
```

Manual checks after each phase:

- App opens without SSR/window/Leaflet errors.
- Sidebar logo and layer tabs render.
- All three layers still display as before.
- `prv_punkt` search still filters by `navn` and `vannlok-kode`.
- Sample type and owner filters still work.
- Clicking a sidebar feature selects and flies to the map feature.
- Clicking map features updates the sidebar selection.
- Popups display expected fields.
- Lines appear at zoom `>= 13`.
- Labels appear at zoom `>= 14`.
- Basemap selector changes tiles.
- Measurement tool still works.
- Export still downloads GeoJSON and CSV for supported layers.
- Build output remains compatible with Vercel.

Optional validation later:

- Add focused unit tests for `src/lib/geojson` helpers after they exist.
- Add a small Playwright smoke test only if UI behavior becomes more complex.

## 8. Risks and Cautions

### Next.js and Leaflet Client-Side Rendering

- Leaflet depends on browser globals, so the current dynamic import with `ssr: false` is important.
- Keep Leaflet-only code inside client components.
- Avoid importing Leaflet or React Leaflet from server components.
- Be careful when moving helper code: generic geometry helpers can be shared, but Leaflet-specific helpers should remain client-only.

### Static Export and Vercel Considerations

- Direct JSON imports are good for Vercel-hosted small apps.
- Large data files increase JavaScript bundle size when imported directly.
- For larger datasets, prefer lazy-loaded static files from `public/data` or dynamic imports per layer before considering APIs.
- Do not add a database, authentication, or backend API for the template baseline.
- External tile servers require network access from users' browsers; attribution and availability should be documented.

### Malformed GeoJSON

- The app currently assumes valid geometry and expected field presence.
- Risks:
  - Missing `geometry`.
  - Unsupported geometry type.
  - Empty coordinates.
  - `LineString`/`MultiLineString` nesting mismatch.
  - Missing `fid`.
  - Null title fields.
  - Numeric display fields stored as strings or null.
- Add validation and fallbacks before making the app a reusable template.
- Selection should not depend on `fid` alone.

### Keep the Template Simple

- The target users are small municipal map apps, so static config plus local GeoJSON is appropriate.
- Avoid premature database/auth/backend work.
- Avoid heavy state-management libraries unless later requirements clearly exceed local React state.
- Avoid over-generalizing into a full GIS platform. The useful template boundary is:
  - A few configured layers.
  - Static GeoJSON.
  - Map/sidebar interaction.
  - Search/filter.
  - Popups/details.
  - Simple export.

### Preserve the Reference App

- The original Færder implementation is valuable as a concrete example.
- Refactors should keep Færder as the default configured profile until a generic sample profile is ready.
- Prefer moving hardcoded values into `reference/faerder` config instead of deleting domain-specific behavior outright.

