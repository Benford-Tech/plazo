import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfirmProvider } from "./confirm";
import { useConfirm } from "./confirm-context";

function Demo() {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={() =>
        void confirm("Effacer tout ?", {
          confirmLabel: "Effacer",
          destructive: true,
        }).then((ok) => {
          document.title = ok ? "oui" : "non";
        })
      }
    >
      Demander
    </button>
  );
}

describe("fenêtre de confirmation (07/10/2026, plus d'alerte native)", () => {
  it("pose la question dans l'app et rend la réponse", async () => {
    render(
      <ConfirmProvider>
        <Demo />
      </ConfirmProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Demander" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("Effacer tout ?");
    expect(screen.getByRole("button", { name: "Effacer" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    await waitFor(() => expect(document.title).toBe("non"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Demander" }));
    fireEvent.click(screen.getByRole("button", { name: "Effacer" }));
    await waitFor(() => expect(document.title).toBe("oui"));
    // Escape says no.
    fireEvent.click(screen.getByRole("button", { name: "Demander" }));
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(document.title).toBe("non"));
  });
});
