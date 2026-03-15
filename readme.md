# REint Full Stack SWE Challenge

## Repository Structure

```
├── app/                          # Part 1: Wind Forecast Monitoring App
│   ├── packages/
│   │   ├── client/               # React + Vite + TypeScript frontend
│   │   └── shared/               # Shared types and helpers
│   └── README.md                 # App-specific docs
│
├── Analysis/                     # Part 2: Forecast & Reliability Analysis
│   ├── forecast_error_analysis.ipynb    # 2a — Forecast error analysis
│   ├── wind_reliability_analysis.ipynb  # 2b — Wind reliability analysis
│   ├── actuals.csv                      # Actual wind generation (Jan 2024)
│   └── forecasts.csv                    # Wind forecasts (Jan 2024, 0-48h horizon)
│
└── readme.md                     # This file
```

## Part 1 — Wind Forecast Monitoring App (`/app`)

A web app that visualizes UK national wind power forecasts vs actuals for January 2024. Users can select a date range and adjust the forecast horizon (0-48h) to understand forecast accuracy.

### How to run

```bash
cd app
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173`. No database or API keys needed — the dataset is pre-loaded and bundled with the app.

### Deployed version

[Link to deployed app]

## Part 2 — Analysis (`/Analysis`)

Two Jupyter notebooks analyzing the Elexon BMRS wind data for January 2024.

### 2a — Forecast Error Analysis (`forecast_error_analysis.ipynb`)

Analyzes how the WINDFOR forecast model fails. Key findings: systematic over-prediction bias (+1,300 MW), error growth across forecast horizons, multi-hour error persistence (autocorrelation), and diurnal accuracy patterns.

### 2b — Wind Reliability Analysis (`wind_reliability_analysis.ipynb`)

Determines how much wind power the UK can reliably count on. Uses exceedance curves, drought duration analysis, and time-of-day reliability to recommend a dependable capacity figure.

### Data files

Both CSVs are included in the `/Analysis` folder. They were fetched from the Elexon BMRS API:
- `actuals.csv` — FUELHH endpoint (fuelType=WIND)
- `forecasts.csv` — WINDFOR endpoint, filtered to Jan 2024 with 0-48h horizon

## AI Tools Disclosure

AI tools were used to assist with building the web application (Part 1). The analysis notebooks (Part 2) reflect original analytical thinking with AI used only for low-level assistance (bug fixes, library syntax).
