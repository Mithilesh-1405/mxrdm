import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DecisionTable } from "../App.jsx";

test("sorts the decision table when a header is pressed", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <DecisionTable
        rows={[
          {
            start_time: "2026-01-15T01:00:00Z",
            forecast_mw: 20,
            actual_mw: 21,
            error_mw: 1,
            publish_time: "2026-01-14T08:00:00Z",
            horizon_hours: 17,
          },
          {
            start_time: "2026-01-15T00:00:00Z",
            forecast_mw: 10,
            actual_mw: 8,
            error_mw: -2,
            publish_time: "2026-01-14T08:00:00Z",
            horizon_hours: 16,
          },
        ]}
      />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole("button", { name: /forecast/i }));
  expect(screen.getAllByRole("row")[1]).toHaveTextContent("10 MW");
});
