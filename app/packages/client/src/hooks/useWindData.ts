import { useQuery } from "@tanstack/react-query";
import {
  selectActualPoints,
  selectForecastPoints,
  type ForecastQuery
} from "@wind-forecast/shared";

import { mergeChartData } from "../lib/chart";
import { fetchStaticDataset } from "../lib/dataset";

type UseWindDataOptions = ForecastQuery & {
  enabled: boolean;
};

export function useWindData({
  enabled,
  ...query
}: UseWindDataOptions) {
  const datasetQuery = useQuery({
    queryKey: ["dataset"],
    queryFn: fetchStaticDataset,
    staleTime: Infinity,
    gcTime: Infinity
  });

  const actuals =
    enabled && datasetQuery.data
      ? selectActualPoints(datasetQuery.data, {
          startTime: query.startTime,
          endTime: query.endTime
        })
      : [];

  const forecasts =
    enabled && datasetQuery.data
      ? selectForecastPoints(datasetQuery.data, query)
      : [];

  return {
    actuals,
    forecasts,
    chartData: mergeChartData(actuals, forecasts),
    isLoading: datasetQuery.isLoading,
    error: datasetQuery.error
  };
}
