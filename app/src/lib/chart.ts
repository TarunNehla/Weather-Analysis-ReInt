import type { ActualPoint, ChartPoint, ForecastPoint } from "./dataset";

export function mergeChartData(
  actuals: ActualPoint[],
  forecasts: ForecastPoint[]
): ChartPoint[] {
  const points = new Map<string, ChartPoint>();

  for (const actual of actuals) {
    const timestampMs = new Date(actual.startTime).getTime();
    const current = points.get(actual.startTime);

    points.set(actual.startTime, {
      startTime: actual.startTime,
      timestampMs,
      actual: actual.generation,
      ...(current?.forecast !== undefined
        ? { forecast: current.forecast }
        : {}),
      ...(current?.publishTime ? { publishTime: current.publishTime } : {})
    });
  }

  for (const forecast of forecasts) {
    const timestampMs = new Date(forecast.startTime).getTime();
    const current = points.get(forecast.startTime);

    points.set(forecast.startTime, {
      startTime: forecast.startTime,
      timestampMs,
      ...(current?.actual !== undefined ? { actual: current.actual } : {}),
      forecast: forecast.generation,
      publishTime: forecast.publishTime
    });
  }

  return [...points.values()].sort((left, right) => left.timestampMs - right.timestampMs);
}
