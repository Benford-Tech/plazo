import {
  filterProspects,
  groupByRegion,
  nextSort,
  NO_FILTERS,
  notOpenYet,
  parseCsvCells,
  readProspectsCsv,
  renderSubjectText,
  renderText,
  sortProspects,
  toolOptions,
  unknownVariables,
} from "./prospecting";
import type { Prospect } from "./types";

// Prospection (18/10/2026): the admin's CSV file and the preview of a mail. Fictional data only.

describe("CSV des prospects", () => {
  it("lit ; ou , avec guillemets, BOM et en-têtes français avec ou sans accents", () => {
    expect(parseCsvCells('﻿a;b\n"x;1";"dit ""oui"""\r\n\n')).toEqual([
      ["a", "b"],
      ["x;1", 'dit "oui"'],
    ]);
    const reading = readProspectsCsv(
      'Parking,Prénom,Nom,E-mail,Ville,Aéroport,Téléphone,Notes,Inconnue\nParking Alpha,Camille,Exemple,contact@alpha.example,Pusignan,LYS,04 00 00 00 00,"Rappeler, lundi",x\n',
    );
    expect(reading.missing).toEqual([]);
    expect(reading.ignored).toEqual(["Inconnue"]);
    expect(reading.rows).toEqual([
      {
        companyName: "Parking Alpha",
        contactFirstName: "Camille",
        contactLastName: "Exemple",
        email: "contact@alpha.example",
        town: "Pusignan",
        airportCode: "LYS",
        phone: "04 00 00 00 00",
        notes: "Rappeler, lundi",
      },
    ]);
  });

  it("signale les colonnes obligatoires absentes", () => {
    expect(readProspectsCsv("Prénom;Ville\nCamille;Genas").missing).toEqual([
      "companyName",
    ]);
  });
});

describe("aperçu des mails", () => {
  const values = {
    prenom: "",
    nom: "Exemple",
    parking: "Parking Alpha",
    aeroport: "Lyon Saint-Exupéry",
    ville: "Pusignan",
    lienDemo: "https://www.plazo.fr/pro/demo/AbCd2345EfGh",
  };
  it("remplace les variables comme l'API, sans trace d'une variable vide", () => {
    expect(
      renderText("Bonjour {prénom},\n{parking} près de {aeroport}", values),
    ).toBe("Bonjour,\nParking Alpha près de Lyon Saint-Exupéry");
    expect(renderSubjectText("{prénom}, vos réservations", values)).toBe(
      "Vos réservations",
    );
    expect(unknownVariables("{prénom} {société}")).toEqual(["{société}"]);
    expect(renderText("Essayez : {lien_demo}", values)).toBe(
      "Essayez : https://www.plazo.fr/pro/demo/AbCd2345EfGh",
    );
  });
});

describe("classement par région (19/10/2026)", () => {
  it("la colonne « Région » du CSV est lue telle quelle (le serveur la reconnaît)", () => {
    const reading = readProspectsCsv(
      "parking;e-mail;Région\nParking Alpha;a@alpha.example;Île-de-France\n",
    );
    expect(reading.ignored).toEqual([]);
    expect(reading.rows).toEqual([
      {
        companyName: "Parking Alpha",
        email: "a@alpha.example",
        region: "Île-de-France",
      },
    ]);
  });

  it("blocs dans l'ordre des régions, « Sans région » en dernier, l'ordre de la liste gardé dans chaque bloc", () => {
    const p = (id: string, region: Prospect["region"]) =>
      ({ id, region }) as Prospect;
    const ara = {
      key: "auvergne-rhone-alpes",
      label: "Auvergne-Rhône-Alpes",
      manual: false,
    };
    const bzh = { key: "bretagne", label: "Bretagne", manual: true };
    const groups = groupByRegion(
      [p("1", null), p("2", bzh), p("3", ara), p("4", ara)],
      [
        { key: "auvergne-rhone-alpes", label: "Auvergne-Rhône-Alpes" },
        { key: "bretagne", label: "Bretagne" },
        { key: "corse", label: "Corse" },
      ],
    );
    expect(
      groups.map((g) => [g.key, g.label, g.prospects.map((x) => x.id)]),
    ).toEqual([
      ["auvergne-rhone-alpes", "Auvergne-Rhône-Alpes", ["3", "4"]],
      ["bretagne", "Bretagne", ["2"]],
      ["none", "Sans région", ["1"]],
    ]);
    expect(groupByRegion([], [])).toEqual([]);
  });
});

describe("filtres et tri des prospects (16/11/2026)", () => {
  const p = (over: Partial<Prospect>): Prospect =>
    ({
      id: over.id ?? "x",
      email: "a@b.example",
      companyName: "P",
      contactFirstName: null,
      contactLastName: null,
      town: null,
      airportCode: null,
      airportName: null,
      region: null,
      regionOverride: null,
      phone: null,
      website: null,
      language: "fr",
      languageOverride: null,
      notes: null,
      source: "csv",
      status: "to_contact",
      step: 0,
      nextStep: null,
      nextSendAt: null,
      firstContactedAt: null,
      lastContactedAt: null,
      stoppedAt: null,
      failedAttempts: 0,
      lastError: null,
      createdAt: "2026-11-01T00:00:00Z",
      ...over,
    }) as Prospect;
  const now = Date.parse("2026-11-16T12:00:00Z");
  const rows = [
    p({
      id: "a",
      companyName: "Bêta Parking",
      town: "Köln",
      tool: "🟢 Pas d'outil visible",
      language: "de",
    }),
    p({
      id: "b",
      companyName: "alpha valet",
      email: null,
      tool: "Excel",
      lastContactedAt: "2026-11-14T08:00:00Z",
    }),
    p({
      id: "c",
      companyName: "Gamma",
      tool: "Excel",
      lastContactedAt: "2026-09-01T08:00:00Z",
      demo: {
        url: "u",
        expiresAt: "",
        expired: false,
        opens: 2,
        lastOpenedAt: null,
      },
    }),
  ];
  const ids = (list: Prospect[]) => list.map((x) => x.id);

  it("origine : nouveaux parkings, BODACC, annuaire, fichier, à la main ; pas encore ouvert (22/11/2026)", () => {
    const list = [
      ...rows,
      p({ id: "d", origin: "bodacc", opensOn: "2026-12-01", source: "csv" }),
      p({ id: "e", origin: "directory", source: "csv" }),
      p({ id: "f", source: "manual" }),
    ];
    const by = (origin: typeof NO_FILTERS.origin) =>
      ids(filterProspects(list, { ...NO_FILTERS, origin }, now));
    expect(by("new")).toEqual(["d", "e"]);
    expect(by("bodacc")).toEqual(["d"]);
    expect(by("directory")).toEqual(["e"]);
    expect(by("manual")).toEqual(["f"]);
    expect(notOpenYet({ opensOn: "2026-12-01" }, "2026-11-22")).toBe(true);
    expect(notOpenYet({ opensOn: "2026-11-01" }, "2026-11-22")).toBe(false);
    expect(notOpenYet({ opensOn: null }, "2026-11-22")).toBe(false);
  });

  it("recherche sans accents, e-mail, langue, outil, démo, dernier mail", () => {
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, q: "beta koln" }, now)),
    ).toEqual(["a"]);
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, email: "without" }, now)),
    ).toEqual(["b"]);
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, language: "de" }, now)),
    ).toEqual(["a"]);
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, tool: "none" }, now)),
    ).toEqual(["a"]);
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, tool: "Excel" }, now)),
    ).toEqual(["b", "c"]);
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, demo: "opened" }, now)),
    ).toEqual(["c"]);
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, lastMail: "never" }, now)),
    ).toEqual(["a"]);
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, lastMail: "7d" }, now)),
    ).toEqual(["b"]);
    expect(
      ids(filterProspects(rows, { ...NO_FILTERS, lastMail: "older" }, now)),
    ).toEqual(["c"]);
    expect(toolOptions(rows)).toEqual([{ value: "Excel", count: 2 }]);
  });

  it("tri par colonne, vides en dernier, trois clics reviennent à l'ordre de la liste", () => {
    expect(ids(sortProspects(rows, { key: "parking", dir: "asc" }))).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(ids(sortProspects(rows, { key: "parking", dir: "desc" }))).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(ids(sortProspects(rows, { key: "demo", dir: "desc" }))).toEqual([
      "c",
      "a",
      "b",
    ]);
    const s1 = nextSort(null, "tool");
    expect(s1).toEqual({ key: "tool", dir: "asc" });
    expect(nextSort(nextSort(s1, "tool"), "tool")).toBeNull();
  });
});
