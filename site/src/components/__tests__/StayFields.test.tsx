import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StayFields } from "../StayFields";

const props = { idPrefix: "t", arrivee: "2026-10-10T08:00", retour: "2026-10-14T18:00", minDate: "2026-10-02" };

function values(container: HTMLElement) {
  return Object.fromEntries([...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map(i => [i.name, i.value]));
}

describe("StayFields", () => {
  it("renders native date and time inputs in the server HTML (works without JavaScript)", () => {
    const html = renderToString(<StayFields {...props} />);
    expect(html).toContain('type="date"');
    expect(html).toContain('name="date_depot"');
    expect(html).toContain('min="2026-10-02"');
    expect(html).toContain('type="time"');
    expect(html).toContain('name="heure_retour"');
  });

  it("after hydration, keeps the same field names in hidden inputs", () => {
    const { container } = render(<StayFields {...props} />);
    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(values(container)).toEqual({ date_depot: "2026-10-10", heure_depot: "08:00", date_retour: "2026-10-14", heure_retour: "18:00" });
    expect(screen.getByRole("button", { name: "Date de dépôt : samedi 10 octobre 2026" })).toHaveTextContent("sam. 10 oct.");
  });

  it("picks a range in the popover with the mouse, then applies it", async () => {
    const user = userEvent.setup();
    const { container } = render(<StayFields {...props} />);
    await user.click(screen.getByRole("button", { name: /Date de dépôt/ }));
    const dialog = screen.getByRole("dialog", { name: "Vos dates" });
    expect(within(dialog).getAllByRole("grid")).toHaveLength(2);
    expect(within(dialog).getAllByRole("columnheader").map(h => h.textContent).slice(0, 7)).toEqual(["lu", "ma", "me", "je", "ve", "sa", "di"]);
    expect(within(dialog).getByText("5 jours")).toBeInTheDocument();
    // Past days are disabled and cannot be picked.
    const past = within(dialog).getByRole("gridcell", { name: /jeudi 1 octobre 2026/ });
    expect(past).toHaveAttribute("aria-disabled", "true");
    await user.click(past);
    expect(within(dialog).getByRole("gridcell", { name: /samedi 10 octobre 2026/ })).toHaveAttribute("aria-selected", "true");

    await user.click(within(dialog).getByRole("gridcell", { name: /lundi 12 octobre 2026/ }));
    await user.click(within(dialog).getByRole("gridcell", { name: /vendredi 16 octobre 2026/ }));
    expect(within(dialog).getByText("lun. 12 oct. → ven. 16 oct.", { exact: false })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Valider" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(values(container)).toMatchObject({ date_depot: "2026-10-12", date_retour: "2026-10-16" });
    // Focus goes back to the pill.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Date de dépôt/ }));
  });

  it("moves with the arrow keys, selects with Enter and discards with Escape", async () => {
    const user = userEvent.setup();
    const { container } = render(<StayFields {...props} />);
    await user.click(screen.getByRole("button", { name: /Date de retour/ }));
    // Opened from the return pill: the focus is on the return day and the next pick is the return.
    expect(document.activeElement).toHaveAttribute("data-date", "2026-10-14");
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(document.activeElement).toHaveAttribute("data-date", "2026-10-22");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("gridcell", { name: /jeudi 22 octobre 2026/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("13 jours")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(values(container).date_retour).toBe("2026-10-14");
  });

  it("disables Valider until both dates are chosen, Effacer clears them", async () => {
    const user = userEvent.setup();
    render(<StayFields {...props} />);
    await user.click(screen.getByRole("button", { name: /Date de dépôt/ }));
    await user.click(screen.getByRole("button", { name: "Effacer" }));
    expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
    expect(screen.getByText("Choisissez la date de dépôt")).toBeInTheDocument();
  });

  it("picks a time from the half-hour slots", async () => {
    const user = userEvent.setup();
    const { container } = render(<StayFields {...props} />);
    await user.click(screen.getByRole("button", { name: /Heure de dépôt/ }));
    const list = screen.getByRole("listbox", { name: "Heure de dépôt" });
    expect(within(list).getByRole("option", { name: "08:00" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(values(container).heure_depot).toBe("09:00");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens a bottom sheet on phones, with the focus kept inside", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("max-width"), media: q, addEventListener() {}, removeEventListener() {} })) as never;
    try {
      const user = userEvent.setup();
      const { container } = render(<StayFields {...props} />);
      await user.click(screen.getByRole("button", { name: /Date de dépôt/ }));
      const sheet = screen.getByRole("dialog", { name: "Vos dates" });
      expect(sheet).toHaveAttribute("aria-modal", "true");
      expect(within(sheet).getAllByRole("grid")).toHaveLength(1);
      await user.click(within(sheet).getByRole("button", { name: /Retour/ }));
      await user.click(within(sheet).getByRole("option", { name: "19:30" }));
      // Tab from the last control comes back to the first one.
      const last = within(sheet).getByRole("button", { name: "Valider les dates" });
      last.focus();
      await user.tab();
      expect(sheet.contains(document.activeElement)).toBe(true);
      await user.click(last);
      expect(values(container).heure_retour).toBe("19:30");
    } finally {
      window.matchMedia = original;
    }
  });

  it("phoneSummary: one « Vos dates » pill (short form) that opens the bottom sheet, same field names", async () => {
    const user = userEvent.setup();
    const { container } = render(<StayFields {...props} retour="2026-10-17T13:00" phoneSummary />);
    const pill = screen.getByRole("button", { name: "Vos dates : du samedi 10 octobre 2026 à 08:00 au samedi 17 octobre 2026 à 13:00" });
    expect(pill).toHaveTextContent("Vos datessam. 10 oct. 08:00→ sam. 17 13:00");
    expect(pill.parentElement).toHaveClass("sm:hidden");
    // The four pills stay for tablets and desktops.
    expect(screen.getByRole("button", { name: /Date de dépôt/ }).closest("fieldset")).toHaveClass("max-sm:hidden");

    await user.click(pill);
    const sheet = screen.getByRole("dialog", { name: "Vos dates" });
    expect(sheet).toHaveAttribute("aria-modal", "true");
    expect(pill).toHaveAttribute("aria-expanded", "true");
    await user.click(within(sheet).getByRole("gridcell", { name: /lundi 12 octobre 2026/ }));
    await user.click(within(sheet).getByRole("gridcell", { name: /mardi 20 octobre 2026/ }));
    await user.click(within(sheet).getByRole("button", { name: "Valider les dates" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(values(container)).toEqual({ date_depot: "2026-10-12", heure_depot: "08:00", date_retour: "2026-10-20", heure_retour: "13:00" });
    expect(pill).toHaveTextContent("lun. 12 oct. 08:00→ mar. 20 13:00");
    expect(document.activeElement).toBe(pill);
  });

  it("phoneSummary without JavaScript: the native date and time inputs, no summary pill", () => {
    const html = renderToString(<StayFields {...props} phoneSummary />);
    for (const name of ["date_depot", "heure_depot", "date_retour", "heure_retour"]) expect(html).toContain(`name="${name}"`);
    expect(html).toContain('type="date"');
    expect(html).not.toContain("Vos dates");
    expect(html).not.toContain("max-sm:hidden");
  });

  it("phoneSummary: the validation message moves under the pill", () => {
    render(<StayFields {...props} phoneSummary errors={{ returnAt: "return_before_arrival" }} />);
    expect(screen.getByRole("button", { name: /^Vos dates/ })).toHaveAttribute("aria-describedby", "t-dates-error");
    expect(document.getElementById("t-dates-error")?.textContent).toBeTruthy();
  });

  it("shows the existing validation messages", () => {
    render(<StayFields {...props} errors={{ returnAt: "return_before_arrival" }} />);
    expect(screen.getByRole("button", { name: /Date de retour/ })).toHaveAttribute("aria-describedby", "t-retour-error");
    expect(document.getElementById("t-retour-error")?.textContent).toBeTruthy();
  });

  it("closes on a click outside", async () => {
    render(<StayFields {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Date de dépôt/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await act(async () => {
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
