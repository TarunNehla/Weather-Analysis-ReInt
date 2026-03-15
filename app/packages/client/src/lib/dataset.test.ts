import {
  buildStaticDataset,
  normalizeActualApiRows,
  normalizeForecastApiRows,
  selectActualPoints,
  selectForecastPoints
} from "@wind-forecast/shared";
import { describe, expect, it } from "vitest";

describe("static dataset helpers", () => {
  it("normalizes January 2024 rows and builds a deterministic snapshot", () => {
    const actuals = normalizeActualApiRows([
      {
        startTime: "2024-01-01T00:30:00Z",
        fuelType: "WIND",
        generation: 1100
      },
      {
        startTime: "2024-01-01T00:00:00Z",
        fuelType: "WIND",
        generation: 1000
      },
      {
        startTime: "2024-01-01T01:00:00Z",
        fuelType: "SOLAR",
        generation: 999
      },
      {
        startTime: "2024-02-01T00:00:00Z",
        fuelType: "WIND",
        generation: 1200
      }
    ]);

    const forecasts = normalizeForecastApiRows([
      {
        startTime: "2024-01-01T00:00:00Z",
        publishTime: "2023-12-31T20:00:00Z",
        generation: 950
      },
      {
        startTime: "2024-01-01T00:00:00Z",
        publishTime: "2023-12-31T18:00:00Z",
        generation: 930
      },
      {
        startTime: "2024-01-01T00:30:00Z",
        publishTime: "2024-01-01T01:00:00Z",
        generation: 970
      },
      {
        startTime: "2024-02-01T00:00:00Z",
        publishTime: "2024-01-31T20:00:00Z",
        generation: 990
      }
    ]);

    const dataset = buildStaticDataset(actuals, forecasts);

    expect(dataset.actuals).toEqual([
      {
        startTime: "2024-01-01T00:00:00Z",
        generation: 1000
      },
      {
        startTime: "2024-01-01T00:30:00Z",
        generation: 1100
      }
    ]);

    expect(dataset.forecasts).toEqual([
      {
        startTime: "2024-01-01T00:00:00Z",
        versions: [
          {
            publishTime: "2023-12-31T20:00:00Z",
            generation: 950
          },
          {
            publishTime: "2023-12-31T18:00:00Z",
            generation: 930
          }
        ]
      }
    ]);
  });

  it("selects actuals and forecasts in memory with the same horizon semantics", () => {
    const dataset = {
      actuals: [
        {
          startTime: "2024-01-02T00:00:00Z",
          generation: 1200
        },
        {
          startTime: "2024-01-02T00:30:00Z",
          generation: 1250
        },
        {
          startTime: "2024-01-02T01:00:00Z",
          generation: 1300
        }
      ],
      forecasts: [
        {
          startTime: "2024-01-02T00:00:00Z",
          versions: [
            {
              publishTime: "2024-01-01T22:30:00Z",
              generation: 1280
            },
            {
              publishTime: "2024-01-01T20:00:00Z",
              generation: 1210
            }
          ]
        },
        {
          startTime: "2024-01-02T00:30:00Z",
          versions: [
            {
              publishTime: "2024-01-01T20:30:00Z",
              generation: 1230
            }
          ]
        },
        {
          startTime: "2024-01-03T00:00:00Z",
          versions: [
            {
              publishTime: "2024-01-01T00:30:00Z",
              generation: 1400
            },
            {
              publishTime: "2024-01-01T00:00:00Z",
              generation: 1390
            }
          ]
        }
      ]
    };

    expect(
      selectActualPoints(dataset, {
        startTime: "2024-01-02T00:00:00Z",
        endTime: "2024-01-02T00:30:00Z"
      })
    ).toEqual([
      {
        startTime: "2024-01-02T00:00:00Z",
        generation: 1200
      },
      {
        startTime: "2024-01-02T00:30:00Z",
        generation: 1250
      }
    ]);

    expect(
      selectForecastPoints(dataset, {
        startTime: "2024-01-02T00:00:00Z",
        endTime: "2024-01-02T00:30:00Z",
        horizonHours: 4
      })
    ).toEqual([
      {
        startTime: "2024-01-02T00:00:00Z",
        publishTime: "2024-01-01T20:00:00Z",
        generation: 1210
      },
      {
        startTime: "2024-01-02T00:30:00Z",
        publishTime: "2024-01-01T20:30:00Z",
        generation: 1230
      }
    ]);

    expect(
      selectForecastPoints(dataset, {
        startTime: "2024-01-03T00:00:00Z",
        endTime: "2024-01-03T00:00:00Z",
        horizonHours: 48
      })
    ).toEqual([
      {
        startTime: "2024-01-03T00:00:00Z",
        publishTime: "2024-01-01T00:00:00Z",
        generation: 1390
      }
    ]);
  });
});

