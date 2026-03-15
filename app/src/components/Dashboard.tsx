import {
  useEffect,
  useState
} from "react";

import { mergeChartData } from "../lib/chart";
import {
  DATASET_END_INPUT,
  DATASET_START_INPUT,
  DEFAULT_HORIZON_HOURS,
  MAX_HORIZON_HOURS,
  clampHorizonHours,
  fetchStaticDataset,
  formatUtcVerboseLabel,
  isValidRange,
  parseUtcInputValue,
  selectActualPoints,
  selectForecastPoints,
  type StaticDataset
} from "../lib/dataset";
import { DateRangePicker } from "./DateRangePicker";
import { HorizonSlider } from "./HorizonSlider";
import { StatusCard } from "./StatusCard";
import { WindChart } from "./WindChart";

function getValidationMessage(startValue: string, endValue: string): string | null {
  try {
    const startTime = parseUtcInputValue(startValue);
    const endTime = parseUtcInputValue(endValue);

    if (!isValidRange(startTime, endTime)) {
      return "Choose a UTC range inside January 2024, and keep the end time after the start time.";
    }

    return null;
  } catch {
    return "Enter valid UTC timestamps on half-hour boundaries.";
  }
}

export function Dashboard() {
  const [startValue, setStartValue] = useState(DATASET_START_INPUT);
  const [endValue, setEndValue] = useState(DATASET_END_INPUT);
  const [horizonHours, setHorizonHours] = useState(DEFAULT_HORIZON_HOURS);
  const [dataset, setDataset] = useState<StaticDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDataset() {
      try {
        const payload = await fetchStaticDataset();

        if (cancelled) {
          return;
        }

        setDataset(payload);
        setError(null);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError
            : new Error("Unable to load the wind dataset.")
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDataset();

    return () => {
      cancelled = true;
    };
  }, []);

  const validationMessage = getValidationMessage(startValue, endValue);
  const enabled = validationMessage === null;

  const startTime = enabled
    ? parseUtcInputValue(startValue)
    : "2024-01-01T00:00:00Z";
  const endTime = enabled ? parseUtcInputValue(endValue) : "2024-01-01T00:30:00Z";

  const actuals =
    enabled && dataset
      ? selectActualPoints(dataset, {
          startTime,
          endTime
        })
      : [];

  const forecasts =
    enabled && dataset
      ? selectForecastPoints(dataset, {
          startTime,
          endTime,
          horizonHours
        })
      : [];

  const chartData = mergeChartData(actuals, forecasts);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-5 sm:px-5 sm:py-8 md:px-8 md:py-10">
      <section className="rounded-[1.9rem] border border-white/10 bg-white/4 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur sm:p-6 md:rounded-[2.25rem] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
              UK wind forecast monitor
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Compare January 2024 wind forecasts against actual national output.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              The dashboard stays in UTC from input through rendering, so the UK
              dataset window does not shift with browser locale. Forecast points
              disappear when no publish time satisfies the selected horizon.
            </p>
          </div>

          <div className="w-full rounded-3xl border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm text-amber-50 sm:w-auto sm:min-w-72 sm:rounded-[1.75rem] sm:px-5">
            <div className="text-xs uppercase tracking-[0.18em] text-amber-100/70">
              Current view
            </div>
            <div className="mt-2 font-medium">
              {formatUtcVerboseLabel(startTime)} UTC to{" "}
              {formatUtcVerboseLabel(endTime)} UTC
            </div>
            <div className="mt-1 text-amber-100/80">
              Horizon {horizonHours} hour{horizonHours === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:mt-8 xl:grid-cols-[1.4fr_0.9fr] xl:gap-5">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)] sm:rounded-4xl sm:p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Time window controls
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Inputs stay locked to January 2024 and half-hour increments.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                UTC only
              </div>
            </div>

            <div className="mt-5">
              <DateRangePicker
                startValue={startValue}
                endValue={endValue}
                min={DATASET_START_INPUT}
                max={DATASET_END_INPUT}
                onStartChange={setStartValue}
                onEndChange={setEndValue}
              />
            </div>
          </div>

          <HorizonSlider
            value={horizonHours}
            min={0}
            max={MAX_HORIZON_HOURS}
            onChange={(value) => setHorizonHours(clampHorizonHours(value))}
          />
        </div>

        <div className="mt-8">
          {validationMessage ? (
            <StatusCard title="Invalid range" message={validationMessage} />
          ) : isLoading ? (
            <StatusCard
              title="Loading dataset"
              message="Loading the checked-in January 2024 wind snapshot."
            />
          ) : error ? (
            <StatusCard
              title="Dataset error"
              message={error.message || "Unable to load the wind dataset."}
            />
          ) : chartData.length === 0 ? (
            <StatusCard
              title="No chartable data"
              message="This range does not contain rows that satisfy the selected forecast horizon."
            />
          ) : (
            <WindChart data={chartData} />
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Actual points
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">{actuals.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Forecast points
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {forecasts.length}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Combined timestamps
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {chartData.length}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
