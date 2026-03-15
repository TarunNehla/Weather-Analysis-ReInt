export type TimeRangeQuery = {
  startTime: string;
  endTime: string;
};

export type ForecastQuery = TimeRangeQuery & {
  horizonHours: number;
};

export type ActualPoint = {
  startTime: string;
  generation: number;
};

export type ForecastPoint = {
  startTime: string;
  generation: number;
  publishTime: string;
};

export type ForecastVersion = {
  publishTime: string;
  generation: number;
};

export type StaticForecastEntry = {
  startTime: string;
  versions: ForecastVersion[];
};

export type StaticDataset = {
  actuals: ActualPoint[];
  forecasts: StaticForecastEntry[];
};

export type ChartPoint = {
  startTime: string;
  timestampMs: number;
  actual?: number;
  forecast?: number;
  publishTime?: string;
};

const DATASET_URL = "/data/wind-forecast-january-2024.json";

export const DATASET_START_ISO = "2024-01-01T00:00:00Z";
export const DATASET_END_ISO = "2024-01-31T23:30:00Z";
export const DATASET_START_INPUT = "2024-01-01T00:00";
export const DATASET_END_INPUT = "2024-01-31T23:30";
export const DEFAULT_HORIZON_HOURS = 4;
export const MAX_HORIZON_HOURS = 48;
export const INGEST_LOOKBACK_HOURS = 48;

type ActualApiRow = {
  startTime: string;
  fuelType: string;
  generation: number;
};

type ForecastApiRow = {
  startTime: string;
  publishTime: string;
  generation: number;
};

function isStaticDataset(value: unknown): value is StaticDataset {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StaticDataset>;
  return Array.isArray(candidate.actuals) && Array.isArray(candidate.forecasts);
}

export async function fetchStaticDataset(): Promise<StaticDataset> {
  const response = await fetch(DATASET_URL);

  if (!response.ok) {
    throw new Error(`Dataset request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as unknown;

  if (!isStaticDataset(payload)) {
    throw new Error("Dataset payload is malformed.");
  }

  return payload;
}

export function toUtcIsoString(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`);
  }

  return date.toISOString().replace(".000Z", "Z");
}

export function parseUtcInputValue(value: string): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    throw new Error(`Invalid datetime-local value: ${value}`);
  }

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    )
  );

  return toUtcIsoString(date);
}

export function isWithinDatasetBounds(isoString: string): boolean {
  const value = new Date(isoString).getTime();
  return (
    value >= new Date(DATASET_START_ISO).getTime() &&
    value <= new Date(DATASET_END_ISO).getTime()
  );
}

export function isValidRange(startTime: string, endTime: string): boolean {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  return (
    start < end &&
    isWithinDatasetBounds(startTime) &&
    isWithinDatasetBounds(endTime)
  );
}

export function clampHorizonHours(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_HORIZON_HOURS;
  }

  return Math.min(Math.max(Math.round(value), 0), MAX_HORIZON_HOURS);
}

export function formatUtcLabel(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(new Date(isoString));
}

export function formatUtcVerboseLabel(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(new Date(isoString));
}

export function getForecastHorizonHours(
  startTime: string,
  publishTime: string
): number {
  const start = new Date(startTime).getTime();
  const publish = new Date(publishTime).getTime();
  return (start - publish) / (60 * 60 * 1000);
}

export function normalizeActualApiRows(rows: ActualApiRow[]): ActualPoint[] {
  return rows
    .filter((row) => row.fuelType === "WIND")
    .map((row) => ({
      startTime: toUtcIsoString(row.startTime),
      generation: Number(row.generation)
    }))
    .filter((row) => isWithinDatasetBounds(row.startTime))
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

export function normalizeForecastApiRows(rows: ForecastApiRow[]): ForecastPoint[] {
  return rows
    .map((row) => ({
      startTime: toUtcIsoString(row.startTime),
      publishTime: toUtcIsoString(row.publishTime),
      generation: Number(row.generation)
    }))
    .filter((row) => isWithinDatasetBounds(row.startTime))
    .filter((row) => {
      const horizonHours = getForecastHorizonHours(
        row.startTime,
        row.publishTime
      );

      return horizonHours >= 0 && horizonHours <= MAX_HORIZON_HOURS;
    })
    .sort((left, right) => {
      const startTimeComparison = left.startTime.localeCompare(right.startTime);

      if (startTimeComparison !== 0) {
        return startTimeComparison;
      }

      return right.publishTime.localeCompare(left.publishTime);
    });
}

export function buildStaticDataset(
  actuals: ActualPoint[],
  forecasts: ForecastPoint[]
): StaticDataset {
  const actualMap = new Map<string, ActualPoint>();

  for (const actual of actuals) {
    actualMap.set(actual.startTime, actual);
  }

  const forecastMap = new Map<string, Map<string, ForecastVersion>>();

  for (const forecast of forecasts) {
    const versions = forecastMap.get(forecast.startTime) ?? new Map();

    versions.set(forecast.publishTime, {
      publishTime: forecast.publishTime,
      generation: forecast.generation
    });

    forecastMap.set(forecast.startTime, versions);
  }

  return {
    actuals: [...actualMap.values()].sort((left, right) =>
      left.startTime.localeCompare(right.startTime)
    ),
    forecasts: [...forecastMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([startTime, versions]) => ({
        startTime,
        versions: [...versions.values()].sort((left, right) =>
          right.publishTime.localeCompare(left.publishTime)
        )
      }))
  };
}

export function selectActualPoints(
  dataset: StaticDataset,
  query: TimeRangeQuery
): ActualPoint[] {
  const startMs = new Date(query.startTime).getTime();
  const endMs = new Date(query.endTime).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || startMs > endMs) {
    return [];
  }

  return dataset.actuals.filter((actual) => {
    const timestampMs = new Date(actual.startTime).getTime();

    return timestampMs >= startMs && timestampMs <= endMs;
  });
}

export function selectForecastPoints(
  dataset: StaticDataset,
  query: ForecastQuery
): ForecastPoint[] {
  const startMs = new Date(query.startTime).getTime();
  const endMs = new Date(query.endTime).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || startMs > endMs) {
    return [];
  }

  return dataset.forecasts.flatMap((entry) => {
    const startTimeMs = new Date(entry.startTime).getTime();

    if (startTimeMs < startMs || startTimeMs > endMs) {
      return [];
    }

    const cutoffMs = startTimeMs - query.horizonHours * 60 * 60 * 1000;
    const version = entry.versions.find((candidate) => {
      const publishTimeMs = new Date(candidate.publishTime).getTime();
      return publishTimeMs <= cutoffMs;
    });

    if (!version) {
      return [];
    }

    return [
      {
        startTime: entry.startTime,
        publishTime: version.publishTime,
        generation: version.generation
      }
    ];
  });
}
