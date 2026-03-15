import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  buildStaticDataset,
  DATASET_START_ISO,
  INGEST_LOOKBACK_HOURS,
  normalizeActualApiRows,
  normalizeForecastApiRows,
  toUtcIsoString
} from "@wind-forecast/shared";

const ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1";
const MAX_FUELHH_RANGE_DAYS = 7;
const OUTPUT_PATH = resolve(
  process.cwd(),
  "packages/client/public/data/wind-forecast-january-2024.json"
);

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

type DatasetResponse<Row> = {
  data?: Row[];
};

function buildUrl(pathname: string, query: Record<string, string>): string {
  const normalizedBaseUrl = ELEXON_BASE_URL.endsWith("/")
    ? ELEXON_BASE_URL
    : `${ELEXON_BASE_URL}/`;
  const normalizedPath = pathname.startsWith("/")
    ? pathname.slice(1)
    : pathname;
  const url = new URL(normalizedPath, normalizedBaseUrl);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

async function fetchDataset<Row>(url: string): Promise<Row[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Elexon API request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as DatasetResponse<Row> | Row[];

  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.data ?? [];
}

async function fetchActualRows(): Promise<ActualApiRow[]> {
  const rows: ActualApiRow[] = [];
  let cursor = new Date("2024-01-01T00:00:00Z");
  const finalSettlementDate = new Date("2024-01-31T00:00:00Z");

  while (cursor <= finalSettlementDate) {
    const chunkStart = new Date(cursor);
    const chunkEnd = new Date(cursor);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + (MAX_FUELHH_RANGE_DAYS - 1));

    const effectiveChunkEnd =
      chunkEnd > finalSettlementDate ? finalSettlementDate : chunkEnd;

    const url = buildUrl("datasets/FUELHH", {
      settlementDateFrom: toUtcIsoString(chunkStart).slice(0, 10),
      settlementDateTo: toUtcIsoString(effectiveChunkEnd).slice(0, 10),
      fuelType: "WIND",
      format: "json"
    });

    rows.push(...(await fetchDataset<ActualApiRow>(url)));

    cursor = new Date(effectiveChunkEnd);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return rows;
}

async function fetchForecastRows(): Promise<ForecastApiRow[]> {
  const rows: ForecastApiRow[] = [];
  const start = new Date(DATASET_START_ISO);
  start.setUTCHours(start.getUTCHours() - INGEST_LOOKBACK_HOURS);

  let cursor = start;
  const finalPublishTime = new Date("2024-01-31T23:59:59Z");

  while (cursor <= finalPublishTime) {
    const chunkStart = new Date(cursor);
    const chunkEnd = new Date(cursor);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + 1);
    chunkEnd.setUTCMilliseconds(chunkEnd.getUTCMilliseconds() - 1);

    const effectiveChunkEnd =
      chunkEnd > finalPublishTime ? finalPublishTime : chunkEnd;

    const url = buildUrl("datasets/WINDFOR", {
      publishDateTimeFrom: toUtcIsoString(chunkStart),
      publishDateTimeTo: toUtcIsoString(effectiveChunkEnd),
      format: "json"
    });

    rows.push(...(await fetchDataset<ForecastApiRow>(url)));

    cursor = new Date(effectiveChunkEnd);
    cursor.setUTCMilliseconds(cursor.getUTCMilliseconds() + 1);
  }

  return rows;
}

async function main() {
  const [actualRows, forecastRows] = await Promise.all([
    fetchActualRows(),
    fetchForecastRows()
  ]);

  const dataset = buildStaticDataset(
    normalizeActualApiRows(actualRows),
    normalizeForecastApiRows(forecastRows)
  );

  await mkdir(dirname(OUTPUT_PATH), {
    recursive: true
  });
  await writeFile(`${OUTPUT_PATH}`, `${JSON.stringify(dataset, null, 2)}\n`);

  console.info(
    `Wrote ${dataset.actuals.length} actuals and ${dataset.forecasts.length} forecast timestamps to ${OUTPUT_PATH}.`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

