import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReservationForm } from "./ReservationForm";

const previewCapacity = vi.fn();
const createReservation = vi.fn();
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      previewCapacity: (...args: unknown[]) => previewCapacity(...args),
      createReservation: (...args: unknown[]) => createReservation(...args),
      getStops: async () => ({ data: [] }),
    },
  };
});

function renderForm(onSaved = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ReservationForm onSaved={onSaved} />
    </QueryClientProvider>,
  );
  return onSaved;
}

async function fillStay() {
  fireEvent.change(screen.getByLabelText("Arrivée — Date"), { target: { value: "2026-10-04" } });
  fireEvent.change(screen.getByLabelText("Arrivée — Heure"), { target: { value: "06:30" } });
  fireEvent.change(screen.getByLabelText("Retour — Date"), { target: { value: "2026-10-11" } });
  fireEvent.change(screen.getByLabelText("Retour — Heure"), { target: { value: "15:05" } });
  await userEvent.type(screen.getByLabelText("Client"), "Mme Laurent");
  await userEvent.type(screen.getByLabelText("Téléphone"), "0612345678");
  await userEvent.type(screen.getByLabelText("Plaque"), "gk318px");
}

describe("ReservationForm", () => {
  beforeEach(() => {
    previewCapacity.mockReset();
    createReservation.mockReset();
  });

  it("signale une nuit complète et ne permet d'enregistrer qu'en forçant", async () => {
    previewCapacity.mockResolvedValue({
      nights: [{ date: "2026-10-04", count: 312, bookable: 304, free: -8, overbooked: true }],
      fullNights: ["2026-10-04"],
      canForce: true,
    });
    createReservation.mockResolvedValue({ data: { id: "r1" } });
    const onSaved = renderForm();
    await fillStay();

    expect(await screen.findByText("Complet : dim. 4.")).toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Enregistrer" });
    expect(save).toBeDisabled();

    await userEvent.click(screen.getByLabelText("Enregistrer quand même (surréservation)"));
    await userEvent.click(save);
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(createReservation.mock.calls[0][0]).toMatchObject({
      arrivalAt: "2026-10-04T06:30",
      returnAt: "2026-10-11T15:05",
      channel: "phone",
      force: true,
    });
  });

  it("annonce la disponibilité quand il reste de la place", async () => {
    previewCapacity.mockResolvedValue({
      nights: [
        { date: "2026-10-04", count: 250, bookable: 304, free: 54, overbooked: false },
        { date: "2026-10-05", count: 300, bookable: 304, free: 4, overbooked: false },
      ],
      fullNights: [],
      canForce: true,
    });
    renderForm();
    await fillStay();
    expect(await screen.findByText("Disponible : au moins 4 places libres chaque nuit.")).toBeInTheDocument();
    expect(screen.getByText("7 nuits")).toBeInTheDocument();
  });
});
