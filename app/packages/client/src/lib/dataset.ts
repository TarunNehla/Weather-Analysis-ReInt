import type { StaticDataset } from "@wind-forecast/shared";

const DATASET_URL = "/data/wind-forecast-january-2024.json";

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

