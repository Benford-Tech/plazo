import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { LinkedEmail } from "@/lib/types";
import { LinkedEmails } from "./LinkedEmails";

const api = vi.hoisted(() => ({ getReservationEmails: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const mail = (over: Partial<LinkedEmail> = {}): LinkedEmail => ({
  id: "m1",
  status: "imported",
  fromAddress: "info@allopark.com",
  fromName: "Allopark",
  subject: "Confirmation de votre réservation AL-482913",
  textBody: "Bonjour Léa,\nvotre réservation est confirmée.",
  provider: "Allopark",
  parsed: null,
  missing: [],
  reservationId: "r1",
  reservationReference: "R7KQ2M",
  reading: null,
  receivedAt: "2026-10-12T06:31:00Z",
  analysedAt: null,
  pageLookup: null,
  change: null,
  role: "created",
  inboxView: "done",
  ...over,
});

const renderBlock = () =>
  render(
    <MemoryRouter>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <LinkedEmails reservationId="r1" />
      </QueryClientProvider>
    </MemoryRouter>,
  );

describe("LinkedEmails (mails liés d'une réservation)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rien quand la réservation n'a aucun mail", async () => {
    api.getReservationEmails.mockResolvedValue({ data: [] });
    renderBlock();
    await waitFor(() =>
      expect(api.getReservationEmails).toHaveBeenCalledWith("r1"),
    );
    expect(screen.queryByTestId("linked-emails")).toBeNull();
  });

  it("liste les mails avec leur rôle, ouvre le mail dans un tiroir et mène à la boîte de réception", async () => {
    api.getReservationEmails.mockResolvedValue({
      data: [
        mail(),
        mail({
          id: "m2",
          role: "change",
          status: "unrecognised",
          subject: "Modification AL-482913",
          textBody: null,
          inboxView: "todo",
        }),
      ],
    });
    renderBlock();
    const block = await screen.findByTestId("linked-emails");
    expect(within(block).getByText("Mails liés · 2")).toBeInTheDocument();
    const rows = within(block).getAllByTestId("linked-email");
    expect(rows.map((r) => r.dataset.role)).toEqual(["created", "change"]);
    expect(within(rows[0]).getByText("À l'origine")).toBeInTheDocument();

    await userEvent.click(
      within(rows[0]).getByRole("button", { name: /Voir/ }),
    );
    const drawer = screen.getByRole("dialog", {
      name: "Mail lié à la réservation",
    });
    expect(
      within(drawer).getByText("Confirmation de votre réservation AL-482913"),
    ).toBeInTheDocument();
    expect(within(drawer).getByTestId("inbound-body")).toHaveTextContent(
      "votre réservation est confirmée.",
    );
    expect(within(drawer).getByTestId("linked-email-inbox")).toHaveAttribute(
      "href",
      "/reservations/a-verifier?vue=done&mail=m1",
    );

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(
      within(rows[1]).getByRole("button", { name: /Voir/ }),
    );
    const second = screen.getByRole("dialog");
    expect(
      within(second).getByText("Texte effacé 30 jours après la réception."),
    ).toBeInTheDocument();
    expect(within(second).getByTestId("linked-email-inbox")).toHaveAttribute(
      "href",
      "/reservations/a-verifier?vue=todo&mail=m2",
    );
  });

  it("un mail sorti de la boîte de réception le dit au lieu du lien", async () => {
    api.getReservationEmails.mockResolvedValue({
      data: [mail({ inboxView: null })],
    });
    renderBlock();
    await userEvent.click(await screen.findByRole("button", { name: /Voir/ }));
    expect(screen.queryByTestId("linked-email-inbox")).toBeNull();
    expect(
      screen.getByText("Ce mail n'est plus listé dans la Boîte de réception."),
    ).toBeInTheDocument();
  });
});
