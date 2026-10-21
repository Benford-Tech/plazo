import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import DemoEntryPage from "./DemoEntryPage";

const enterDemo = vi.fn();
const demoLink = vi.fn();
vi.mock("@/lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      enterDemo: (...args: unknown[]) => enterDemo(...args),
      demoLink: (...args: unknown[]) => demoLink(...args),
    },
  };
});

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            <Route path="/demo" element={<DemoEntryPage />} />
            <Route path="/demo/:token" element={<DemoEntryPage />} />
            <Route path="/" element={<p>Tableau de bord</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("DemoEntryPage", () => {
  beforeEach(() => {
    enterDemo.mockReset();
    demoLink.mockReset();
  });

  it("entre dans la démo dans le rôle choisi", async () => {
    enterDemo.mockResolvedValue({
      tokenData: { access: { token: "a", expires: "2026-10-22T00:00:00Z" }, refresh: { token: "r", expires: "2026-10-30T00:00:00Z" } },
      user: { id: "s1", name: "Karim Démo", role: "driver", demo: { resetsAt: "2026-10-22T01:00:00Z" } },
    });
    renderAt("/demo");
    await userEvent.click(screen.getByRole("radio", { name: /Chauffeur/ }));
    await userEvent.click(screen.getByRole("button", { name: "Entrer dans la démo" }));
    expect(enterDemo).toHaveBeenCalledWith("driver", undefined);
    expect(await screen.findByText("Tableau de bord")).toBeInTheDocument();
  });

  it("salue le prospect de son lien et le compte", async () => {
    demoLink.mockResolvedValue({ status: "valid", companyName: "Parking Fictif" });
    enterDemo.mockRejectedValue(new ApiError(410, "Expired", "demo_link_expired"));
    renderAt("/demo/AbCd2345EfGh");
    expect(await screen.findByText("Bonjour Parking Fictif : voici votre démo.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Entrer dans la démo" }));
    expect(enterDemo).toHaveBeenCalledWith("manager", "AbCd2345EfGh");
    expect(await screen.findByText(/Ce lien de démo a expiré/)).toBeInTheDocument();
  });

  it("laisse entrer sans compter un lien expiré", async () => {
    demoLink.mockResolvedValue({ status: "expired", companyName: null });
    renderAt("/demo/AbCd2345EfGh");
    expect(await screen.findByText(/Ce lien a expiré/)).toBeInTheDocument();
    enterDemo.mockResolvedValue({ tokenData: {}, user: { id: "s1", name: "Claire Démo", role: "manager" } });
    await userEvent.click(screen.getByRole("button", { name: "Entrer dans la démo" }));
    expect(enterDemo).toHaveBeenCalledWith("manager", undefined);
  });
});
