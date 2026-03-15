import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { ChartPoint } from "../lib/dataset";
import { formatUtcLabel, formatUtcVerboseLabel } from "../lib/dataset";

type WindChartProps = {
  data: ChartPoint[];
};

function getIsMobileViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(max-width: 640px)").matches;
}

function formatCompactUtcLabel(timestampMs: number, mobile: boolean): string {
  const isoString = new Date(timestampMs).toISOString();

  if (!mobile) {
    return formatUtcLabel(isoString);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(new Date(isoString));
}

function formatPowerTick(value: number): string {
  if (Math.abs(value) >= 1000) {
    const formatted = (value / 1000).toFixed(value >= 10000 ? 0 : 1);
    return `${formatted.replace(".0", "")}k`;
  }

  return String(value);
}

function TooltipContent({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
      <p className="text-sm font-semibold text-white">
        {formatUtcVerboseLabel(point.startTime)} UTC
      </p>
      <p className="mt-2 text-sm text-slate-200">
        Actual: {point.actual ?? "No data"} MW
      </p>
      <p className="text-sm text-slate-200">
        Forecast: {point.forecast ?? "No data"} MW
      </p>
      {point.publishTime ? (
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-200/80">
          Published {formatUtcVerboseLabel(point.publishTime)} UTC
        </p>
      ) : null}
    </div>
  );
}

export function WindChart({ data }: WindChartProps) {
  const [isMobile, setIsMobile] = useState(getIsMobileViewport);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:rounded-4xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Forecast vs actual
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
            UTC timeline with forecast gaps preserved when no qualifying horizon
            exists.
          </p>
        </div>
        <div className="self-start rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-300 sm:text-xs">
          Wind generation (MW)
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-sky-100">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          Actual
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-amber-100">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          Forecast
        </div>
      </div>

      <div className="mt-4 h-72 sm:h-96 md:h-116">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 8,
              right: isMobile ? 4 : 12,
              bottom: isMobile ? 6 : 10,
              left: isMobile ? -22 : -12
            }}
          >
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="timestampMs"
            domain={["dataMin", "dataMax"]}
            interval="preserveStartEnd"
            minTickGap={isMobile ? 72 : 28}
            scale="time"
            stroke="#cfd5df"
            tick={{ fontSize: isMobile ? 11 : 12 }}
            tickFormatter={(value) => formatCompactUtcLabel(Number(value), isMobile)}
            tickMargin={isMobile ? 10 : 8}
            type="number"
          />
          <YAxis
            stroke="#cfd5df"
            tick={{ fontSize: isMobile ? 11 : 12 }}
            tickFormatter={(value) => formatPowerTick(Number(value))}
            tickMargin={isMobile ? 6 : 8}
            width={isMobile ? 40 : 52}
          />
          <Tooltip content={<TooltipContent />} />
          <Line
            dataKey="actual"
            dot={false}
            name="Actual"
            stroke="#5f9cff"
            strokeWidth={2.5}
            type="monotone"
          />
          <Line
            dataKey="forecast"
            connectNulls
            dot={false}
            name="Forecast"
            stroke="#f5b85c"
            strokeWidth={2.5}
            type="monotone"
          />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
