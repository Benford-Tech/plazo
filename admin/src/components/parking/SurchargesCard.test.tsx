import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SurchargeSettings } from "@/lib/types";
import { SurchargesCard } from "./SurchargesCard";

/** 12/11/2026 (« les conditions pénalisantes doivent être paramétrables », choix A). Fictional data only. */

const api = vi.hoisted(() => ({ surcharges: vi.fn(), setSurcharges: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { demo: null } }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const settings: SurchargeSettings = {
  surcharges: [
    {
      id: "late",
      kind: "late",
      enabled: false,
      amountCents: 1000,
      minutes: 30,
      label: null,
      note: null,
    },
    {
      id: "night",
      kind: "night",
      enabled: false,
      amountCents: 1000,
      minutes: null,
      label: null,
      note: null,
    },
    {
      id: "breakdown",
      kind: "breakdown",
      enabled: false,
      amountCents: 500,
      minutes: null,
      label: null,
      note: null,
    },
  ],
  night: null,
  nightFeesCharged: false,
  configured: false,
  line: null,
};

it("allume les suppléments, montre la phrase du client et enregistre la liste", async () => {
  api.surcharges.mockResolvedValue(settings);
  api.setSurcharges.mockImplementation(async () => ({
    ...settings,
    configured: true,
  }));
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SurchargesCard parkingId="p1" />
    </QueryClientProvider>,
  );
  const late = await screen.findByTestId("surcharge-late");
  expect(screen.getByTestId("surcharges-preview")).toHaveTextContent(
    "Aucun supplément allumé",
  );

  await userEvent.click(
    within(late).getByRole("switch", {
      name: "Activer : Retard au rendez-vous",
    }),
  );
  await userEvent.type(
    within(late).getByLabelText("Précision (facultatif)"),
    "service sur rendez-vous",
  );
  await userEvent.click(
    within(screen.getByTestId("surcharge-night")).getByRole("switch"),
  );
  await userEvent.click(
    within(screen.getByTestId("surcharge-breakdown")).getByRole("switch"),
  );
  expect(screen.getByTestId("surcharges-preview")).toHaveTextContent(
    "À savoir : Retard de plus de 30 minutes : supplément de 10 € (service sur rendez-vous) ; Prise en charge ou restitution entre 22h et 6h : supplément de 10 € ; Service de dépannage : 5 €.",
  );

  await userEvent.click(
    screen.getByRole("button", { name: "+ Ajouter un supplément" }),
  );
  const own = screen.getByTestId("surcharge-custom-3");
  await userEvent.type(within(own).getByLabelText("Nom"), "Clé perdue");
  await userEvent.type(within(own).getByLabelText("Montant (€)"), "25");
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

  await waitFor(() => expect(api.setSurcharges).toHaveBeenCalled());
  const [, body] = api.setSurcharges.mock.calls[0];
  expect(body.night).toEqual({ start: "22:00", end: "06:00" });
  expect(body.surcharges).toEqual([
    {
      kind: "late",
      enabled: true,
      amountCents: 1000,
      minutes: 30,
      label: null,
      note: "service sur rendez-vous",
    },
    {
      kind: "night",
      enabled: true,
      amountCents: 1000,
      minutes: null,
      label: null,
      note: null,
    },
    {
      kind: "breakdown",
      enabled: true,
      amountCents: 500,
      minutes: null,
      label: null,
      note: "",
    },
    {
      kind: "custom",
      enabled: true,
      amountCents: 2500,
      minutes: null,
      label: "Clé perdue",
      note: "",
    },
  ]);
});
