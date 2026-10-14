import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AirportLiveProvider } from "../AirportLive";
import { ResultCard } from "../ResultCard";
import { pinsOf } from "../HomeMap";
import type { AirportLive, LatLng, LiveShuttle, SearchResult } from "@/lib/types";

const result = (over: Partial<SearchResult> = {}): SearchResult => ({
  slug: "rhone",
  title: "Parking du Rhône",
  services: ["shuttle"],
  shuttleMinutes: 5,
  distanceKm: 3.5,
  openingHours: null,
  cancellationPolicy: "free_24h",
  photo: null,
  location: { lat: 45.73, lng: 5.05 },
  payment: "online",
  available: true,
  days: 6,
  priceCents: 5400,
  ...over,
});

describe("« EN DIRECT » dans les résultats (R-B + I-C)", () => {
  it("pastille sur la photo des parkings qui montrent leurs navettes, et rien sur les autres", () => {
    const { rerender } = render(<ResultCard result={result({ liveShuttle: true })} href="/lyon/rhone" highlighted={false} />);
    const pill = screen.getByTestId("live-shuttle");
    expect(pill).toHaveTextContent("En direct");
    expect(pill).toHaveAttribute("title", "Navette suivie en direct : vous la verrez arriver dans votre réservation.");
    rerender(<ResultCard result={result({ liveShuttle: false })} href="/lyon/rhone" highlighted={false} />);
    expect(screen.queryByTestId("live-shuttle")).not.toBeInTheDocument();
    rerender(<ResultCard result={result()} href="/lyon/rhone" highlighted={false} />);
    expect(screen.queryByTestId("live-shuttle")).not.toBeInTheDocument();
  });

  it("la pastille est posée sur la photo, pas parmi les badges", () => {
    render(<ResultCard result={result({ liveShuttle: true })} href="/lyon/rhone" highlighted badges={["cheapest"]} />);
    const pill = screen.getByTestId("live-shuttle");
    expect(pill.parentElement).toContainElement(screen.getByRole("img", { name: "Photos du parking à venir" }));
    expect(pill.closest("ul")).toBeNull();
    expect(screen.getByText("Le moins cher")).toHaveAttribute("data-badge", "cheapest");
  });

  it("le minibus suit le parking jusqu’à son étiquette sur la carte", () => {
    expect(pinsOf([result({ liveShuttle: true }), result({ slug: "pistes", liveShuttle: false })]).map(p => [p.slug, p.live])).toEqual([
      ["rhone", true],
      ["pistes", false],
    ]);
  });
});

describe("carte de résultat Boutique", () => {
  it("un parking complet reste lisible : pastille « Complet à ces dates », sans lien ni carte estompée", () => {
    render(<ResultCard result={result({ available: false })} href="/lyon/rhone" highlighted={false} />);
    const card = screen.getByRole("article", { name: "Parking du Rhône" });
    expect(card).toHaveTextContent("Complet à ces dates");
    expect(card).toHaveTextContent("Essayez d’autres dates");
    expect(card.className).not.toMatch(/opacity/);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("sans photo, un visuel « Photos du parking à venir » ; « Le moins cher » en pastille", () => {
    render(<ResultCard result={result()} href="/lyon/rhone" highlighted badges={["cheapest", "fastestShuttle"]} />);
    expect(screen.getByRole("img", { name: "Photos du parking à venir" })).toBeInTheDocument();
    expect(screen.getByText("Le moins cher")).toHaveAttribute("data-badge", "cheapest");
    expect(screen.getByText("Navette la plus rapide")).toHaveAttribute("data-badge", "fastestShuttle");
    expect(screen.getByRole("link", { name: /^Voir et réserver/ })).toHaveAttribute("href", "/lyon/rhone");
  });

  it("frais de nuit (direction B, 12/10/2026) : le total seul, sans pastille ni détail ; la carte aussi", () => {
    const night = result({ priceCents: 6900, basePriceCents: 5400, nightFee: { arrivalCents: 1500, returnCents: 0, totalCents: 1500 } });
    render(<ResultCard result={night} href="/lyon/rhone" highlighted={false} />);
    const card = screen.getByRole("article", { name: "Parking du Rhône" });
    expect(card).toHaveTextContent("69,00 €");
    expect(card).toHaveTextContent("6 jours, tout compris");
    expect(card).not.toHaveTextContent(/nuit|15,00/);
    expect(pinsOf([night])[0].label).toBe("69\u00a0€");
  });
});

describe("tags et encart navette (direction C, 14/10/2026)", () => {
  it("l’encart sous le nom : « Navette gratuite », trajet et attente moyenne en chiffres", () => {
    render(<ResultCard result={result({ shuttleMinutes: 5, shuttleWaitMinutes: 6 })} href="/lyon/rhone" highlighted={false} />);
    const box = screen.getByTestId("shuttle-box");
    expect(box).toHaveTextContent("Navette gratuite");
    expect(within(box).getByText("Trajet").nextElementSibling).toHaveTextContent("5 min");
    const wait = box.querySelector('[data-figure="wait"]')!;
    expect(wait).toHaveTextContent("6 min");
    // « ATTENTE MOY. » on a wide card, « ATTENTE » on a narrow one; read « Attente moyenne ».
    expect(within(wait as HTMLElement).getByText("Attente moyenne")).toHaveClass("sr-only");
    expect(within(wait as HTMLElement).getByText("Attente moy.")).toHaveClass("hidden", "@lg:inline");
    expect(within(wait as HTMLElement).getByText("Attente")).toHaveClass("@lg:hidden");
    // The former « 5 min » chip is gone: the ride is in the box only.
    expect(screen.getAllByText("5 min")).toHaveLength(1);
    expect(screen.queryByTestId("live-rail")).not.toBeInTheDocument();
  });

  it("sans attente déclarée, le chiffre est absent ; sans navette, pas d’encart", () => {
    const { rerender } = render(<ResultCard result={result({ shuttleMinutes: 5 })} href="/lyon/rhone" highlighted={false} />);
    const box = screen.getByTestId("shuttle-box");
    expect(box.querySelector('[data-figure="ride"]')).toHaveTextContent("5 min");
    expect(box.querySelector('[data-figure="wait"]')).toBeNull();
    expect(box).not.toHaveTextContent(/Attente/);
    rerender(<ResultCard result={result({ services: ["valet"], shuttleMinutes: null })} href="/lyon/rhone" highlighted={false} />);
    expect(screen.queryByTestId("shuttle-box")).not.toBeInTheDocument();
  });

  it("les pastilles : extérieur ou couvert, les clés (libellé court sur une carte étroite), l’ouverture, l’annulation en dernier", () => {
    const { rerender } = render(
      <ResultCard result={result({ services: ["shuttle", "valet", "open_24h", "fenced"] })} href="/lyon/rhone" highlighted={false} />,
    );
    const chips = () => screen.getAllByRole("listitem").map(li => li.textContent);
    expect(chips()).toEqual(["Extérieur", "Clés à remettreVous devez remettre vos clés", "24h/24Ouvert 24h/24", "Clôturé", "Gratuit 24 h (Annulation gratuite jusqu’à 24 h avant)"]);
    expect(screen.getByText("Clés à remettre")).toHaveClass("@lg:hidden");
    expect(screen.getByText("Vous devez remettre vos clés")).toHaveClass("hidden", "@lg:inline");
    rerender(<ResultCard result={result({ services: ["shuttle", "covered"], openingHours: "5h–23h" })} href="/lyon/rhone" highlighted={false} />);
    expect(chips()).toEqual(["Couvert", "Clés gardéesVous gardez vos clés", "Ouvert 5h–23h", "Gratuit 24 h (Annulation gratuite jusqu’à 24 h avant)"]);
  });

  it("dans la colonne à côté de la carte (compact), toujours les libellés courts, quelle que soit sa largeur", () => {
    render(
      <ResultCard result={result({ services: ["shuttle", "valet", "open_24h"], shuttleWaitMinutes: 6 })} href="/lyon/rhone" highlighted={false} compact />,
    );
    expect(screen.getAllByRole("listitem").map(li => li.textContent)).toEqual([
      "Extérieur",
      "Clés à remettre",
      "24h/24",
      "Gratuit 24 h (Annulation gratuite jusqu’à 24 h avant)",
    ]);
    expect(screen.queryByText("Vous devez remettre vos clés")).not.toBeInTheDocument();
    const box = screen.getByTestId("shuttle-box");
    expect(box.querySelector("dl")).not.toHaveClass("@lg:ml-auto");
    expect(box.querySelector('[data-figure="wait"] dt')).toHaveTextContent(/^AttenteAttente moyenne$/);
    expect(within(box).queryByText("Attente moy.")).not.toBeInTheDocument();
  });
});

describe("le trajet en direct (L3, 14/10/2026)", () => {
  const parking: LatLng = { lat: 45.73, lng: 5.05 };
  const airportAt: LatLng = { lat: 45.7256, lng: 5.0811 };
  const along = (f: number): LatLng => ({ lat: parking.lat + (airportAt.lat - parking.lat) * f, lng: parking.lng + (airportAt.lng - parking.lng) * f });
  const shuttle = (id: string, parkingSlug: string, position: LatLng | null, age: number | null): LiveShuttle => ({
    id,
    parking: parkingSlug,
    direction: "dropoff",
    vehicle: { model: "Vito", colour: "blanc" },
    position,
    positionAgeSeconds: age,
    startedAt: "2026-10-14T09:50:00Z",
  });
  const answer = (shuttles: LiveShuttle[]): AirportLive => ({
    serverTime: "2026-10-14T10:00:00Z",
    airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery", location: airportAt },
    parkings: [
      { slug: "rhone", title: "Parking du Rhône", services: ["shuttle"], shuttleMinutes: 5, location: parking, liveShuttle: true },
      { slug: "pistes", title: "Parking des Pistes", services: ["shuttle"], shuttleMinutes: 9, location: parking, liveShuttle: true },
    ],
    shuttles,
  });
  const airport = { slug: "lyon-saint-exupery", code: "LYS" };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("une seule lecture pour toute la page ; le minibus à sa vraie place, l’âge de la position qui court", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => answer([shuttle("t1", "rhone", along(0.25), 8), shuttle("t2", "rhone", null, null)]) });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AirportLiveProvider slug="lyon-saint-exupery">
        <ResultCard result={result({ liveShuttle: true, shuttleWaitMinutes: 5 })} href="/lyon/rhone" airport={airport} highlighted />
        <ResultCard result={result({ slug: "pistes", title: "Parking des Pistes", shuttleMinutes: 9, liveShuttle: true })} href="/lyon/pistes" airport={airport} highlighted={false} />
      </AirportLiveProvider>,
    );
    // Before the first answer (the server's HTML too) the page does not know yet: no status, no claim.
    expect(screen.getAllByTestId("live-rail-status").map(s => s.textContent)).toEqual(["\u00a0", "\u00a0"]);
    expect(screen.getAllByRole("img", { name: "Trajet du parking au Terminal 1" })).toHaveLength(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/public/airports/lyon-saint-exupery/live", { cache: "no-store" });

    const [rhone, pistes] = screen.getAllByTestId("live-rail");
    expect(rhone).toHaveTextContent("Navette en direct");
    expect(within(rhone).getByTestId("live-rail-status")).toHaveTextContent("il y a 8 s");
    const markers = within(rhone).getAllByTestId("rail-shuttle");
    expect(markers).toHaveLength(1);
    expect(Number(markers[0].dataset.progress)).toBeCloseTo(0.25, 2);
    // Two shuttles run, one of them without a position yet: the rail places one, the label counts both.
    expect(within(rhone).getByRole("img")).toHaveAccessibleName("2 navettes en route entre le parking et le Terminal 1");
    expect(rhone).toHaveTextContent("ParkingTerminal 1 · 5 min");
    // The other parking has no shuttle on the road.
    expect(within(pistes).queryByTestId("rail-shuttle")).not.toBeInTheDocument();
    expect(within(pistes).getByTestId("live-rail-status")).toHaveTextContent("Suivie en direct le jour J");
    expect(within(pistes).getByRole("img")).toHaveAccessibleName("Trajet du parking au Terminal 1, aucune navette en route en ce moment");
    expect(pistes).toHaveTextContent("Terminal 1 · 9 min");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(within(rhone).getByTestId("live-rail-status")).toHaveTextContent("il y a 11 s");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9_000);
    });
    // Every 12 s, still one request for the two cards.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sans fournisseur (ou sans parking en direct), aucune requête : le rail sans minibus, « Suivie en direct le jour J »", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = render(<ResultCard result={result({ liveShuttle: true })} href="/lyon/rhone" airport={airport} highlighted={false} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(13_000);
    });
    expect(screen.getByTestId("live-rail-status")).toHaveTextContent("Suivie en direct le jour J");
    expect(screen.queryByTestId("rail-shuttle")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Trajet du parking au Terminal 1, aucune navette en route en ce moment" })).toBeInTheDocument();
    unmount();
    render(
      <AirportLiveProvider slug="lyon-saint-exupery">
        <ResultCard result={result({ liveShuttle: false })} href="/lyon/rhone" airport={airport} highlighted={false} />
      </AirportLiveProvider>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(13_000);
    });
    expect(screen.queryByTestId("live-rail")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("le nom du rail dit ce qui est vrai : toutes les navettes en route, même au-delà des trois minibus ou sans place sur le trajet", async () => {
    const four = ["t1", "t2", "t3", "t4"].map((id, i) => shuttle(id, "rhone", along(0.2 * (i + 1)), 5 + i));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => answer(four) }));
    const { unmount } = render(
      <AirportLiveProvider slug="lyon-saint-exupery">
        <ResultCard result={result({ liveShuttle: true })} href="/lyon/rhone" airport={airport} highlighted={false} />
      </AirportLiveProvider>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getAllByTestId("rail-shuttle")).toHaveLength(3);
    expect(within(screen.getByTestId("live-rail")).getByRole("img")).toHaveAccessibleName("4 navettes en route entre le parking et le Terminal 1");
    unmount();

    // A parking whose entrance is known neither by the live answer nor by its card, away from Lyon.
    const elsewhere = answer([shuttle("t1", "rhone", along(0.5), 4)]);
    elsewhere.airport = { ...elsewhere.airport, code: "GVA", slug: "geneve" };
    elsewhere.parkings = elsewhere.parkings.map(p => ({ ...p, location: null }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => elsewhere }));
    render(
      <AirportLiveProvider slug="geneve">
        <ResultCard result={result({ liveShuttle: true, location: null })} href="/geneve/rhone" airport={{ slug: "geneve", code: "GVA" }} highlighted={false} />
      </AirportLiveProvider>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByTestId("live-rail-status")).toHaveTextContent("il y a 4 s");
    expect(screen.queryByTestId("rail-shuttle")).not.toBeInTheDocument();
    expect(within(screen.getByTestId("live-rail")).getByRole("img")).toHaveAccessibleName("1 navette en route entre le parking et l’aéroport, pas encore placée sur le trajet");
    expect(screen.getByTestId("live-rail")).toHaveTextContent("ParkingAéroport · 5 min");
  });

  it("si l’API ne répond pas, le rail reste vide : « le jour J » n’est dit qu’après une vraie réponse", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(
      <AirportLiveProvider slug="lyon-saint-exupery">
        <ResultCard result={result({ liveShuttle: true })} href="/lyon/rhone" airport={airport} highlighted={false} />
      </AirportLiveProvider>,
    );
    expect(screen.getByTestId("live-rail-status").textContent).toBe("\u00a0");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(screen.getByTestId("live-rail-status").textContent).toBe("\u00a0");
    expect(screen.getByRole("img", { name: "Trajet du parking au Terminal 1" })).toBeInTheDocument();
  });

  it("la lecture s’arrête quand le dernier rail s’en va, et quand la page part", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => answer([]) });
    vi.stubGlobal("fetch", fetchMock);
    const page = (live: boolean) => (
      <AirportLiveProvider slug="lyon-saint-exupery">
        <ResultCard result={result({ liveShuttle: live })} href="/lyon/rhone" airport={airport} highlighted={false} />
      </AirportLiveProvider>
    );
    const { rerender, unmount } = render(page(true));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // A filter hides the live parking; the page (and its provider) stays.
    rerender(page(false));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(40_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Back on the page, then the page leaves.
    rerender(page(true));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(40_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
