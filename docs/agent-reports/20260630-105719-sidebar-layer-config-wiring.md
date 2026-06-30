# Sidebar Layer Config Wiring Report

Generated: 2026-06-30 10:57:19 Europe/Oslo

## Changes Made

- Updated `src/components/SidePanel.jsx` to import layer definitions from `src/config/layers.js`.
- Replaced the local hardcoded sidebar layer tab array with configured layers filtered by `showInSidebar`.
- Preserved the existing tab order from config:
  - `prv_punkt`
  - `ult_punkt`
  - `utl_ledning`
- Replaced tab display text with `layer.label`.
- Added small local helpers in `SidePanel.jsx` for:
  - property lookup
  - first non-empty configured field resolution
  - configured feature identity using `idField` plus `fallbackIdFields`
  - sidebar title/subtitle text from configured fields

## Behavior Intentionally Left Unchanged

- Search behavior was not changed.
- Filter behavior was not changed.
- `Map.jsx` was not changed.
- Data files were not moved or renamed.
- App layout and branding were not changed in this phase.
- Export and popup behavior were not changed.
- The sidebar still preserves the previous visible list formatting as closely as possible:
  - Lines still display as `FCODE - LSID ...` with length in meters.
  - Sampling points still prefer `navn`, then `PSID`.
  - Overflow points still prefer `navn`, then `REF`, then `PSID`.

## Fallback and ID Assumptions

- Feature identity now uses the configured layer `idField` first.
- If the configured `idField` is missing, `fallbackIdFields` are used.
- This keeps `fid` behavior for layers that have it, while improving stability for layers such as `ult_punkt` where `fid` may be absent.
- If no configured id value is available, the list index is used only as a final rendering fallback.
- Missing titles fall back to `PSID ...` where available, then `Ukjent`.

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

Wire sidebar search fields from `layers.js` next, while keeping the current `prv_punkt` search behavior as the default configured behavior.

