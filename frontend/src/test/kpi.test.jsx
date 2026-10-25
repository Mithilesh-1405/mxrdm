import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kpi } from "../App.jsx";

test("renders KPI values with units", () => {
  render(<Kpi label="Average wind" value="12,400" unit="MW" />);
  expect(screen.getByText("Average wind")).toBeInTheDocument();
  expect(screen.getByText("12,400")).toBeInTheDocument();
  expect(screen.getByText("MW")).toBeInTheDocument();
});
