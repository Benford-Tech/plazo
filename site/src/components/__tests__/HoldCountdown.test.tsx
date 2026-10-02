import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { formatCountdown, HoldCountdown } from "../HoldCountdown";

describe("HoldCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("formats minutes and seconds", () => {
    expect(formatCountdown(1785)).toBe("29:45");
    expect(formatCountdown(59)).toBe("00:59");
    expect(formatCountdown(-3)).toBe("00:00");
  });

  it("renders the time left given by the server, then counts down every second", () => {
    render(<HoldCountdown secondsLeft={1785} />);
    expect(screen.getByText(/Votre place est réservée pendant/)).toHaveTextContent("Votre place est réservée pendant 29:45");
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("timer")).toHaveTextContent("29:42");
  });

  it("reloads the page once the hold is over (it then says « Le délai est dépassé »)", () => {
    render(<HoldCountdown secondsLeft={2} />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(refresh).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1500));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
