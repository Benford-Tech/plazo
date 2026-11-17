import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Agreement, Agreements } from "@/lib/types";
import { AgreementsFlow } from "./AgreementsFlow";

const auth = vi.hoisted(() => ({
  user: {
    name: "Malik Dubois",
    operatorName: "Parking Alpha",
    role: "manager" as const,
  },
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: auth.user }),
}));
const api = vi.hoisted(() => ({
  getAgreements: vi.fn(),
  signAgreements: vi.fn(),
  agreementPreview: vi.fn(),
  agreementFile: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

// 17/11/2026, « Il faut un contrat pour publier des annonces et un contrat d'utilisation de Plazo Pro » (choice C).
const agreement = (
  kind: Agreement["kind"],
  over: Partial<Agreement> = {},
): Agreement => ({
  kind,
  title:
    kind === "pro_terms"
      ? "Conditions d'utilisation de Plazo Pro"
      : "Contrat de diffusion des annonces",
  version: "2026-11-17",
  parties: [
    "Benford Tech, qui exploite la plateforme Plazo,",
    "et Parking Alpha.",
  ],
  articles: [
    {
      heading: kind === "pro_terms" ? "1. Objet du logiciel" : "5. Commission",
      paragraphs: ["Texte de l'article."],
    },
  ],
  textSha256: `${kind}-sha`,
  signed: null,
  history: [],
  ...over,
});

const state = (over: Partial<Agreements> = {}): Agreements => ({
  agreements: [agreement("pro_terms"), agreement("listing")],
  sellsOnPlazo: true,
  toSign: ["pro_terms", "listing"],
  canSign: true,
  plan: null,
  ...over,
});

function renderFlow() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AgreementsFlow />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("Vos contrats Plazo", () => {
  it("lit les deux contrats puis les signe d'un seul nom", async () => {
    api.getAgreements.mockResolvedValue(state());
    const signedAt = "2026-11-17T09:00:00Z";
    api.signAgreements.mockResolvedValue(
      state({
        toSign: [],
        agreements: [
          agreement("pro_terms", {
            signed: {
              id: "a1",
              version: "2026-11-17",
              signedAt,
              signerName: "Malik Dubois",
              textSha256: "x",
              pdfSha256: "y",
            },
          }),
          agreement("listing", {
            signed: {
              id: "a2",
              version: "2026-11-17",
              signedAt,
              signerName: "Malik Dubois",
              textSha256: "x",
              pdfSha256: "y",
            },
          }),
        ],
      }),
    );
    renderFlow();

    await userEvent.click(
      await screen.findByRole("button", { name: "Les lire et les signer" }),
    );
    expect(screen.getByText("1. Objet du logiciel")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "J'ai lu, continuer" }),
    );
    expect(screen.getByText("5. Commission")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "J'ai lu, continuer" }),
    );

    expect(
      screen.getByLabelText("Votre nom complet, comme signature"),
    ).toHaveValue("Malik Dubois");
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(2);
    const submit = screen.getByRole("button", { name: "Signer le contrat" });
    expect(submit).toBeDisabled();
    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[1]);
    await userEvent.click(
      screen.getByRole("button", { name: "Signer les 2 contrats" }),
    );
    await waitFor(() =>
      expect(api.signAgreements).toHaveBeenCalledWith(
        "Malik Dubois",
        ["pro_terms", "listing"],
        { pro_terms: "pro_terms-sha", listing: "listing-sha" },
      ),
    );
    expect(
      await screen.findAllByRole("button", { name: "PDF signé" }),
    ).toHaveLength(2);
  });

  it("le contrat de diffusion peut attendre : on signe les conditions seules", async () => {
    api.getAgreements.mockResolvedValue(
      state({ sellsOnPlazo: false, toSign: ["pro_terms"] }),
    );
    api.signAgreements.mockResolvedValue(
      state({ sellsOnPlazo: false, toSign: [] }),
    );
    renderFlow();

    expect(
      await screen.findByText("Quand vous vendrez sur Plazo"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Les lire et les signer" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "J'ai lu, continuer" }),
    );
    expect(screen.getByText(/ce contrat pourra attendre/)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Je ne vends pas sur Plazo pour l'instant",
      }),
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(
      screen.getByRole("button", { name: "Signer le contrat" }),
    );
    await waitFor(() =>
      expect(api.signAgreements).toHaveBeenCalledWith(
        "Malik Dubois",
        ["pro_terms"],
        { pro_terms: "pro_terms-sha" },
      ),
    );
  });

  it("en consultation, on lit sans pouvoir signer", async () => {
    api.getAgreements.mockResolvedValue(state({ canSign: false }));
    renderFlow();
    await userEvent.click(
      await screen.findByRole("button", { name: "Les lire et les signer" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "J'ai lu, continuer" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "J'ai lu, continuer" }),
    );
    expect(
      screen.getByText(/on lit les contrats mais on ne les signe pas/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
