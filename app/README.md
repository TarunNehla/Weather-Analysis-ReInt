# Wind Forecast Monitor

Wind Forecast Monitor compares forecasted vs actual UK national wind generation for January 2024. The app is a single frontend at the repository root: it loads one checked-in JSON snapshot and queries that data in memory, so local setup is just install and run.

## Stack

- React 19 + TypeScript + Vite
- Recharts, Tailwind CSS
- One local dataset helper module for UTC/date logic and in-memory selection

## Repository layout

```text
src/       React frontend
public/    Checked-in January 2024 dataset snapshot
scripts/   Maintainer script to rebuild the snapshot
```

## Local setup

```bash
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173`.

## Data source

Normal app usage does not call Elexon at runtime. The client reads the checked-in snapshot at [wind-forecast-january-2024.json](/Users/tarun/OneDrive/Desktop/assignment/app/public/data/wind-forecast-january-2024.json).

That snapshot was built from the current Elexon Insights Solution API at [data.elexon.co.uk](https://data.elexon.co.uk/bmrs/api/v1):

- `FUELHH` filtered with `settlementDateFrom`, `settlementDateTo`, and `fuelType=WIND`
- `WINDFOR` filtered with `publishDateTimeFrom` and `publishDateTimeTo`

The legacy BMRS service was switched off on **May 31, 2024**, so the maintenance script uses the current Insights endpoints only.

## Scripts

- `npm run dev` starts the Vite frontend.
- `npm run build` builds the frontend bundle.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs the client TypeScript check.
- `npm run data:refresh` refetches Elexon data and rewrites the checked-in JSON snapshot.

## Deployment

Deploy the repository root as a static SPA. [vercel.json](/Users/tarun/OneDrive/Desktop/assignment/app/vercel.json) already rewrites routes to `index.html` for client-side navigation.

No environment variables are required for normal development or deployment.

## Behavior notes

- The UI is UTC-only end-to-end.
- The default window is the full January 2024 dataset, from `2024-01-01T00:00:00Z` through `2024-01-31T23:30:00Z`.
- Forecast horizon is adjustable from `0` to `48` hours, defaulting to `4`.
- Missing forecast points are left missing. The chart does not zero-fill or interpolate them.
- Changing the time range or horizon recomputes locally from the already-loaded snapshot rather than making new network requests.
