import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WhatsappNumber } from "@/lib/types";
import { OperatorWhatsappPanel } from "./OperatorWhatsappPanel";

const api = vi.hoisted(() => ({ getPlatformWhatsappNumber: vi.fn(), platformWhatsappNumber: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const added: WhatsappNumber = {
  status: "added",
  phone: "06 39 98 12 40",
  phoneNumberId: "1111111111",
  displayName: "Plazo",
  nameStatus: null,
  metaStatus: null,
  quality: null,
  requestedAt: null,
  codeSentAt: null,
  registeredAt: null,
  activeAt: null,
  checkedAt: null,
  lastError: null,
  sending: false,
};
const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OperatorWhatsappPanel operatorId="op1" />
    </QueryClientProvider>,
  );

describe("OperatorWhatsappPanel (14/11/2026)", () => {
  it("ajoute le numéro avec le nom « Plazo », puis demande le code et le vérifie", async () => {
    api.getPlatformWhatsappNumber.mockResolvedValue({ number: null, displayName: "Plazo", available: true });
    api.platformWhatsappNumber.mockResolvedValueOnce(added).mockResolvedValueOnce({ ...added, status: "code_sent" }).mockResolvedValueOnce({
      ...added,
      status: "registered",
      nameStatus: "PENDING_REVIEW",
    });
    renderPanel();
    expect(await screen.findByDisplayValue("Plazo")).toHaveAttribute("readonly");
    await userEvent.type(screen.getByLabelText("Numéro"), "06 39 98 12 40");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter chez Meta" }));
    await waitFor(() => expect(api.platformWhatsappNumber).toHaveBeenCalledWith("op1", "add", { phone: "06 39 98 12 40" }));
    await userEvent.click(await screen.findByRole("button", { name: "Envoyer le code par SMS" }));
    await waitFor(() => expect(api.platformWhatsappNumber).toHaveBeenCalledWith("op1", "code", { method: "SMS" }));
    await userEvent.type(screen.getByLabelText("Code à 6 chiffres"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Vérifier" }));
    await waitFor(() => expect(api.platformWhatsappNumber).toHaveBeenCalledWith("op1", "verify", { code: "123456" }));
    expect(await screen.findByText("PENDING_REVIEW")).toBeInTheDocument();
  });
});
