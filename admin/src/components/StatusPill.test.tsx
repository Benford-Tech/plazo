import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("shows « Attendu » in amber and « Sur place » in green, solid", () => {
    render(
      <>
        <StatusPill status="upcoming" />
        <StatusPill status="arrived" />
      </>,
    );
    expect(screen.getByTestId("status-pill-upcoming")).toHaveTextContent("Attendu");
    expect(screen.getByTestId("status-pill-upcoming").className).toContain("bg-[#B45309]");
    expect(screen.getByTestId("status-pill-arrived")).toHaveTextContent("Sur place");
    expect(screen.getByTestId("status-pill-arrived").className).toContain("bg-[#15803D]");
  });
});
