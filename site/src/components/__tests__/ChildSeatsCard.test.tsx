import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChildSeatsCard } from "../ChildSeatsCard";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });
const booking = (seats: { infant: number; toddler: number; booster: number }) => ({ reference: "R7KQ2M", passengers: 3, childSeats: seats });

describe("ChildSeatsCard (« Sièges auto » on Ma réservation)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockClear();
  });

  it("shows « Aucun siège demandé », then saves the seats asked by PUT …/child-seats and says so", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, booking({ infant: 1, toddler: 0, booster: 1 })));
    vi.stubGlobal("fetch", fetchMock);
    render(<ChildSeatsCard reference="R7KQ2M" token="tok" seats={{ infant: 0, toddler: 0, booster: 0 }} passengers={3} editable />);
    expect(screen.getByText("Aucun siège demandé")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Un bébé de plus" }));
    fireEvent.click(screen.getByRole("button", { name: "Un enfant de 4 à 10 ans de plus" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/bookings/R7KQ2M/child-seats",
      expect.objectContaining({ method: "PUT", headers: { "x-booking-token": "tok", "content-type": "application/json" }, body: JSON.stringify({ infant: 1, toddler: 0, booster: 1 }) }),
    );
    expect(screen.getByText("1 siège bébé · 1 réhausseur")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Sièges auto enregistrés.");
    expect(refresh).toHaveBeenCalled();
  });

  it("holds back more seats than passengers, before any call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ChildSeatsCard reference="R7KQ2M" token="tok" seats={{ infant: 0, toddler: 0, booster: 0 }} passengers={1} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Un bébé de plus" }));
    expect(screen.getByText("Les enfants comptent dans les passagers : ajoutez-les au nombre de passagers.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.getByText("Aucun siège demandé")).toBeInTheDocument();
  });

  it("the booking is no longer « Attendu » (409): the seats stay, « Modifier » goes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(409, { code: "child_seats_locked" })));
    render(<ChildSeatsCard reference="R7KQ2M" token="tok" seats={{ infant: 1, toddler: 0, booster: 0 }} passengers={3} editable />);
    expect(screen.getByText("1 siège bébé")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Un enfant de 1 à 4 ans de plus" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    });
    expect(screen.getByText("1 siège bébé")).toBeInTheDocument();
    expect(screen.getByText("Les sièges auto ne se modifient plus en ligne : dites-le au parking.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
  });

  it("another refusal is said in French, the steppers kept open", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("offline")));
    render(<ChildSeatsCard reference="R7KQ2M" token="tok" seats={{ infant: 0, toddler: 0, booster: 0 }} passengers={3} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Un bébé de plus" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    });
    expect(screen.getByText("Le service ne répond pas. Vérifiez votre connexion et réessayez.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeInTheDocument();
  });

  it("not editable: the summary only", () => {
    render(<ChildSeatsCard reference="R7KQ2M" token="tok" seats={{ infant: 0, toddler: 2, booster: 0 }} passengers={3} editable={false} />);
    expect(screen.getByText("2 sièges 1 à 4 ans")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
  });
});
