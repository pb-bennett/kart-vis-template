# Config Branding Wiring Report

Generated: 2026-06-30 10:50:05 Europe/Oslo

## Changes Made

- Updated `src/app/layout.js` to import `appConfig`.
- Wired app metadata title to `appConfig.title`.
- Wired app metadata description to `appConfig.description`.
- Wired the root `<html>` language to `appConfig.language`, currently `nb-NO`.
- Updated `src/components/SidePanel.jsx` to import `appConfig`.
- Wired the sidebar logo source to `appConfig.branding.logoSrc`.
- Wired the sidebar logo alt text to `appConfig.branding.logoAlt`.

## Intentionally Left Unchanged

- Layer tab behavior remains hardcoded in `SidePanel.jsx`.
- Search and filter behavior remains unchanged.
- Feature-list title/subtitle behavior remains unchanged.
- Map behavior, basemaps, popups, legend, export, measurement, and layer rendering were not touched.
- Data files were not moved or renamed.
- Layer config was not wired in this phase.

## Validation

Validation run:

```powershell
npm run lint
npm run build
git status --short
```

Results:

- `npm run lint` and `npm run build` through PowerShell were blocked before execution by the local `npm.ps1` execution policy.
- `npm.cmd run lint` completed with 0 errors and 1 existing warning in `src/app/page.js` for the unnecessary `hasActiveFilters` dependency in `useMemo`.
- `npm.cmd run build` passed.
- Final status showed only the two edited source files and this new report.
