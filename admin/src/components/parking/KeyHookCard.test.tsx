import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Parking } from "@/lib/types";
import { KeyHookCard } from "./KeyHookCard";

const api = vi.hoisted(() => ({ setKeyHook: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, adminApi: { ...actual.adminApi, ...api } };
});

const parking = { id: "p1", name: "Parking du Rhône", shuttleTracking: "team" } as Parking;

describe("KeyHookCard (04/11/2026)", () => {
  it("allumé par défaut, s'éteint d'un clic", async () => {
    api.setKeyHook.mockResolvedValue({ data: { ...parking, keyHookIsPlace: false } });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <KeyHookCard parking={parking} />
      </QueryClientProvider>,
    );
    const toggle = screen.getByTestId("key-hook-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("key-hook-explain")).toHaveTextContent("vont d'office au crochet de la place");
    await userEvent.click(toggle);
    await waitFor(() => expect(api.setKeyHook).toHaveBeenCalledWith("p1", false));
  });

  it("éteint : l'équipe tape le numéro", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <KeyHookCard parking={{ ...parking, keyHookIsPlace: false }} />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId("key-hook-toggle")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("key-hook-explain")).toHaveTextContent("tant que l'équipe n'a pas tapé son numéro");
  });
});
