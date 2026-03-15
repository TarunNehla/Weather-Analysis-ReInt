import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DATASET_END_INPUT,
  DATASET_START_INPUT
} from "@wind-forecast/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "./Dashboard";

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return render(
    <QueryClientProvider client={client}>
      <Dashboard />
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Dashboard", () => {
  it("renders the default UTC window from a single static dataset fetch", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          actuals: [
            {
              startTime: "2024-01-01T00:00:00Z",
              generation: 1000
            },
            {
              startTime: "2024-01-01T00:30:00Z",
              generation: 1100
            }
          ],
          forecasts: [
            {
              startTime: "2024-01-01T00:00:00Z",
              versions: [
                {
                  publishTime: "2023-12-31T20:00:00Z",
                  generation: 950
                }
              ]
            }
          ]
        }),
        { status: 200 }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();

    expect(screen.getByLabelText(/start time/i)).toHaveValue(DATASET_START_INPUT);
    expect(screen.getByLabelText(/end time/i)).toHaveValue(DATASET_END_INPUT);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("recomputes locally when the horizon changes without refetching", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          actuals: [
            {
              startTime: "2024-01-01T00:00:00Z",
              generation: 1000
            }
          ],
          forecasts: [
            {
              startTime: "2024-01-01T00:00:00Z",
              versions: [
                {
                  publishTime: "2023-12-31T22:00:00Z",
                  generation: 980
                },
                {
                  publishTime: "2023-12-31T20:00:00Z",
                  generation: 950
                }
              ]
            }
          ]
        }),
        { status: 200 }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.input(screen.getByLabelText(/forecast horizon/i), {
      target: {
        value: "12"
      }
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/forecast horizon/i)).toHaveValue("12");
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows a validation message when the range becomes invalid", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(
        JSON.stringify({
          actuals: [],
          forecasts: []
        }),
        { status: 200 }
      )
    ));

    renderDashboard();

    const user = userEvent.setup();
    const startInput = screen.getByLabelText(/start time/i);
    const endInput = screen.getByLabelText(/end time/i);

    await user.clear(startInput);
    await user.type(startInput, "2024-01-31T23:30");
    await user.clear(endInput);
    await user.type(endInput, "2024-01-01T00:00");

    expect(await screen.findByText(/choose a utc range inside january 2024/i)).toBeInTheDocument();
  });
});
