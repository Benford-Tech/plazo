import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { BookingSurcharges } from "@/lib/types";
import { BookingSurchargesCard } from "./BookingSurchargesCard";

/** 12/11/2026 (« A puis B », B): supplements applied on a booking. Fictional data only. */

const api = vi.hoisted(() => ({
  bookingSurcharges: vi.fn(),
  addBookingSurcharge: vi.fn(),
  removeBookingSurcharge: vi.fn(),
  dismissBookingSurcharge: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const base: BookingSurcharges = {
  surcharges: [],
  options: [
    {
      key: "late",
      kind: "late",
      label: "Retard au rendez-vous",
      amountCents: 1000,
    },
    {
      key: "breakdown",
      kind: "breakdown",
      label: "Dépannage",
      amountCents: 500,
    },
  ],
  suggestion: {
    kind: "late",
    lateMinutes: 48,
    amountCents: 1000,
    scheduledAt: "2026-11-12T09:00",
    arrivedAt: "2026-11-12T09:48",
  },
  totalCents: 0,
  canEdit: true,
};

const show = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <BookingSurchargesCard reservationId="r1" mayConfigure />
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => vi.clearAllMocks());

it("propose le retard, l'applique, et dit ce qu'il reste à encaisser", async () => {
  api.bookingSurcharges.mockResolvedValue(base);
  api.addBookingSurcharge.mockResolvedValue({
    ...base,
    suggestion: null,
    surcharges: [
      {
        id: "s1",
        kind: "late",
        label: "Retard au rendez-vous (48 min)",
        amountCents: 1000,
        at: "2026-11-12T09:50",
        by: "Karim",
      },
    ],
    totalCents: 1000,
  });
  show();
  expect(
    await screen.findByText("Retard de 48 min au rendez-vous"),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Prévu à 09:00, voiture déposée à 09:48 : supplément de 10 € selon vos réglages.",
    ),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Appliquer 10 €" }));
  await waitFor(() =>
    expect(api.addBookingSurcharge).toHaveBeenCalledWith("r1", { key: "late" }),
  );
  expect(
    await screen.findByText(/ajouté par Karim à 09:50/),
  ).toBeInTheDocument();
  expect(screen.getByTestId("surcharges-total")).toHaveTextContent("10,00 €");
  expect(screen.queryByTestId("surcharge-suggestion")).not.toBeInTheDocument();
});

it("« Autre montant… » : un nom et un montant", async () => {
  api.bookingSurcharges.mockResolvedValue({ ...base, suggestion: null });
  api.addBookingSurcharge.mockResolvedValue({ ...base, suggestion: null });
  show();
  await userEvent.click(
    await screen.findByRole("button", { name: "Autre montant…" }),
  );
  await userEvent.type(screen.getByLabelText("Nom"), "Clé perdue");
  await userEvent.type(screen.getByLabelText("Montant (€)"), "25,50");
  await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
  await waitFor(() =>
    expect(api.addBookingSurcharge).toHaveBeenCalledWith("r1", {
      label: "Clé perdue",
      amountCents: 2550,
    }),
  );
});

it("caché quand le parking n'en propose aucun et qu'aucun n'est appliqué", async () => {
  api.bookingSurcharges.mockResolvedValue({
    ...base,
    options: [],
    suggestion: null,
  });
  const { container } = show();
  await waitFor(() => expect(api.bookingSurcharges).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});
