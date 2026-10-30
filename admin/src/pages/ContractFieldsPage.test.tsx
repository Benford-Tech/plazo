import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ContractTemplates } from "@/lib/types";
import ContractFieldsPage from "./ContractFieldsPage";

const api = vi.hoisted(() => ({
  getContractTemplate: vi.fn(),
  contractTemplateFile: vi.fn(),
  setContractFields: vi.fn(),
  contractFieldsPreview: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});
// pdf.js does not run in jsdom: a two-page PDF that draws nothing.
vi.mock("@/lib/pdf-render", () => ({
  loadPdf: vi.fn(async () => ({ numPages: 2, render: vi.fn(async () => 1.414), destroy: vi.fn() })),
}));

const templates = (fields: ContractTemplates["current"] extends infer T ? (T extends { fields?: infer F } ? F : never) : never = []): ContractTemplates => ({
  current: {
    id: "tpl1",
    version: 2,
    title: "Contrat des Cèdres",
    fileName: "contrat.pdf",
    sizeBytes: 12000,
    pageCount: 2,
    sha256: "a".repeat(64),
    uploadedAt: "2026-10-26T10:00:00.000Z",
    uploadedBy: "Joanny",
    retiredAt: null,
    signedCount: 0,
    fields,
    fieldsSetAt: null,
  },
  history: [],
  plazoSignedCount: 0,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/parking/contrat/tpl1/champs"]}>
        <Routes>
          <Route path="/parking/contrat/:templateId/champs" element={<ContractFieldsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getContractTemplate.mockResolvedValue(templates());
  api.contractTemplateFile.mockResolvedValue({ blob: new Blob(["%PDF"]), filename: "contrat.pdf" });
  api.setContractFields.mockImplementation(async (_id: string, fields) => templates(fields));
  api.contractFieldsPreview.mockResolvedValue(new Blob(["%PDF"]));
});

describe("ContractFieldsPage", () => {
  it("pose les informations sur la page, change de page, puis enregistre le calque", async () => {
    renderPage();
    expect(await screen.findByText("Contrat des Cèdres · version 2")).toBeInTheDocument();
    expect(await screen.findByTestId("fields-page")).toHaveTextContent("Page 1 / 2");
    await userEvent.click(screen.getByTestId("palette-customer_name"));
    expect(screen.getByTestId("field-customer_name")).toHaveTextContent("Claire Martin");
    expect(screen.getByTestId("palette-customer_name")).toHaveTextContent("✓");

    await userEvent.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(screen.getByTestId("fields-page")).toHaveTextContent("Page 2 / 2");
    // Only the boxes of the page shown.
    expect(screen.queryByTestId("field-customer_name")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("palette-signed_on"));
    await userEvent.click(screen.getByTestId("palette-signature"));
    // The size of the selected (last added) text.
    expect(screen.getByTestId("field-selected")).toHaveTextContent("Signature");

    await userEvent.click(screen.getByTestId("fields-save"));
    await waitFor(() => expect(api.setContractFields).toHaveBeenCalled());
    const [id, fields] = api.setContractFields.mock.calls[0];
    expect(id).toBe("tpl1");
    expect(fields.map((f: { key: string; page: number }) => [f.key, f.page])).toEqual([
      ["customer_name", 0],
      ["signed_on", 1],
      ["signature", 1],
    ]);
    for (const f of fields) {
      expect(f.x + f.w).toBeLessThanOrEqual(1);
      expect(f.y + f.h).toBeLessThanOrEqual(1);
    }
  });

  it("dépose une information là où on la lâche, la retire, et ouvre l'aperçu", async () => {
    api.getContractTemplate.mockResolvedValue(
      templates([{ key: "plate", page: 0, x: 0.1, y: 0.1, w: 0.2, h: 0.03 }]),
    );
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    URL.createObjectURL = vi.fn(() => "blob:apercu");
    URL.revokeObjectURL = vi.fn();
    renderPage();
    expect(await screen.findByTestId("field-plate")).toBeInTheDocument();
    const sheet = screen.getByTestId("fields-sheet");
    sheet.getBoundingClientRect = () => ({ left: 0, top: 0, width: 620, height: 877, right: 620, bottom: 877, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.drop(sheet, { clientX: 310, clientY: 438, dataTransfer: { getData: () => "phone" } });
    // jsdom has no DragEvent coordinates: the box lands on the page shown.
    expect(screen.getByTestId("field-phone")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Retirer" }));
    expect(screen.queryByTestId("field-phone")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("fields-preview"));
    await waitFor(() => expect(api.contractFieldsPreview).toHaveBeenCalledWith("tpl1", [expect.objectContaining({ key: "plate" })]));
    await waitFor(() => expect(open).toHaveBeenCalled());
  });
});
