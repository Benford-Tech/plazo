import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import type { ParsedBooking, Reservation } from "@/lib/types";
import { ReservationForm } from "./ReservationForm";

const previewCapacity = vi.fn();
const createReservation = vi.fn();
const updateReservation = vi.fn();
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      previewCapacity: (...args: unknown[]) => previewCapacity(...args),
      createReservation: (...args: unknown[]) => createReservation(...args),
      updateReservation: (...args: unknown[]) => updateReservation(...args),
      getStops: async () => ({ data: [] }),
    },
  };
});

function renderForm(onSaved = vi.fn(), props: { reservation?: Reservation; prefill?: ParsedBooking } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ReservationForm onSaved={onSaved} {...props} />
    </QueryClientProvider>,
  );
  return onSaved;
}

const booked = (patch: Partial<Reservation> = {}) =>
  ({
    id: "r9",
    channel: "phone",
    channelDetail: null,
    status: "upcoming",
    arrivalAt: "2026-10-12T06:30:00.000Z",
    returnAt: "2026-10-19T13:05:00.000Z",
    passengers: 2,
    customerName: "Camille Martin",
    customerFirstName: "Camille",
    customerLastName: "Martin",
    customerPhone: "+33612345678",
    customerEmail: null,
    plate: "AB-123-CD",
    returnFlight: null,
    departureFlight: null,
    notes: null,
    ...patch,
  }) as Reservation;

async function fillStay() {
  fireEvent.change(screen.getByLabelText("Arrivée — Date"), { target: { value: "2026-10-04" } });
  fireEvent.change(screen.getByLabelText("Arrivée — Heure"), { target: { value: "06:30" } });
  fireEvent.change(screen.getByLabelText("Retour — Date"), { target: { value: "2026-10-11" } });
  fireEvent.change(screen.getByLabelText("Retour — Heure"), { target: { value: "15:05" } });
  await userEvent.type(screen.getByLabelText("Prénom"), "Sophie");
  await userEvent.type(screen.getByLabelText("Nom"), "Laurent");
  await userEvent.type(screen.getByLabelText("Téléphone"), "0612345678");
  await userEvent.type(screen.getByLabelText("Plaque"), "gk318px");
}

describe("ReservationForm", () => {
  beforeEach(() => {
    previewCapacity.mockReset();
    createReservation.mockReset();
    updateReservation.mockReset();
    previewCapacity.mockResolvedValue({ nights: [], fullNights: [], canForce: true });
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

  it("envoie le prénom et le nom du client à part, sans le nom affiché", async () => {
    createReservation.mockResolvedValue({ data: { id: "r1" } });
    const onSaved = renderForm();
    await fillStay();
    expect(screen.queryByLabelText("Client")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const input = createReservation.mock.calls[0][0];
    expect(input).toMatchObject({ customerFirstName: "Sophie", customerLastName: "Laurent" });
    expect(input).not.toHaveProperty("customerName");
  });

  it("affiche l'erreur du serveur sous le champ concerné", async () => {
    createReservation.mockRejectedValue(new ApiError(400, "Validation failed", "validation_failed", { customerLastName: "required" }));
    renderForm();
    await fillStay();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByText("Champ obligatoire.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Prénom")).toHaveAttribute("aria-invalid", "false");
  });

  it("reprend le prénom et le nom enregistrés et les renvoie à la modification", async () => {
    updateReservation.mockResolvedValue({ data: { id: "r9" } });
    const onSaved = renderForm(vi.fn(), { reservation: booked() });
    expect(screen.getByLabelText("Prénom")).toHaveValue("Camille");
    expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
    await userEvent.clear(screen.getByLabelText("Nom"));
    await userEvent.type(screen.getByLabelText("Nom"), "  Martin-Durand ");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateReservation).toHaveBeenCalledWith("r9", expect.objectContaining({ customerFirstName: "Camille", customerLastName: "Martin-Durand" }));
    expect(updateReservation.mock.calls[0][1]).not.toHaveProperty("customerName");
  });

  it("coupe le nom affiché d'une ancienne réservation sans prénom ni nom", () => {
    renderForm(vi.fn(), { reservation: booked({ customerName: "Jean de La Tour", customerFirstName: "", customerLastName: "" }) });
    expect(screen.getByLabelText("Prénom")).toHaveValue("Jean");
    expect(screen.getByLabelText("Nom")).toHaveValue("de La Tour");
  });

  it("préremplit depuis un mail : prénom et nom lus à part, sinon le nom coupé", () => {
    renderForm(vi.fn(), { prefill: { provider: "Onepark", customerName: "Marie Dupont", customerFirstName: "Marie-Anne", customerLastName: "Dupont" } });
    expect(screen.getByLabelText("Prénom")).toHaveValue("Marie-Anne");
    expect(screen.getByLabelText("Nom")).toHaveValue("Dupont");
  });

  it("préremplit depuis un mail qui ne donne que le nom complet", () => {
    renderForm(vi.fn(), { prefill: { provider: "Allopark", customerName: "Jean Dupont" } });
    expect(screen.getByLabelText("Prénom")).toHaveValue("Jean");
    expect(screen.getByLabelText("Nom")).toHaveValue("Dupont");
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
