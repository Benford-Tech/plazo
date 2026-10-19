import { groupByRegion, parseCsvCells, readProspectsCsv, renderSubjectText, renderText, unknownVariables } from "./prospecting";
import type { Prospect } from "./types";

// Prospection (18/10/2026): the admin's CSV file and the preview of a mail. Fictional data only.

describe("CSV des prospects", () => {
  it("lit ; ou , avec guillemets, BOM et en-têtes français avec ou sans accents", () => {
    expect(parseCsvCells('﻿a;b\n"x;1";"dit ""oui"""\r\n\n')).toEqual([
      ["a", "b"],
      ["x;1", 'dit "oui"'],
    ]);
    const reading = readProspectsCsv(
      "Parking,Prénom,Nom,E-mail,Ville,Aéroport,Téléphone,Notes,Inconnue\nParking Alpha,Camille,Exemple,contact@alpha.example,Pusignan,LYS,04 00 00 00 00,\"Rappeler, lundi\",x\n",
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
    expect(readProspectsCsv("Prénom;Ville\nCamille;Genas").missing).toEqual(["companyName", "email"]);
  });
});

describe("aperçu des mails", () => {
  const values = { prenom: "", nom: "Exemple", parking: "Parking Alpha", aeroport: "Lyon Saint-Exupéry", ville: "Pusignan" };
  it("remplace les variables comme l'API, sans trace d'une variable vide", () => {
    expect(renderText("Bonjour {prénom},\n{parking} près de {aeroport}", values)).toBe("Bonjour,\nParking Alpha près de Lyon Saint-Exupéry");
    expect(renderSubjectText("{prénom}, vos réservations", values)).toBe("Vos réservations");
    expect(unknownVariables("{prénom} {société}")).toEqual(["{société}"]);
  });
});

describe("classement par région (19/10/2026)", () => {
  it("la colonne « Région » du CSV est lue telle quelle (le serveur la reconnaît)", () => {
    const reading = readProspectsCsv("parking;e-mail;Région\nParking Alpha;a@alpha.example;Île-de-France\n");
    expect(reading.ignored).toEqual([]);
    expect(reading.rows).toEqual([{ companyName: "Parking Alpha", email: "a@alpha.example", region: "Île-de-France" }]);
  });

  it("blocs dans l'ordre des régions, « Sans région » en dernier, l'ordre de la liste gardé dans chaque bloc", () => {
    const p = (id: string, region: Prospect["region"]) => ({ id, region }) as Prospect;
    const ara = { key: "auvergne-rhone-alpes", label: "Auvergne-Rhône-Alpes", manual: false };
    const bzh = { key: "bretagne", label: "Bretagne", manual: true };
    const groups = groupByRegion([p("1", null), p("2", bzh), p("3", ara), p("4", ara)], [
      { key: "auvergne-rhone-alpes", label: "Auvergne-Rhône-Alpes" },
      { key: "bretagne", label: "Bretagne" },
      { key: "corse", label: "Corse" },
    ]);
    expect(groups.map(g => [g.key, g.label, g.prospects.map(x => x.id)])).toEqual([
      ["auvergne-rhone-alpes", "Auvergne-Rhône-Alpes", ["3", "4"]],
      ["bretagne", "Bretagne", ["2"]],
      ["none", "Sans région", ["1"]],
    ]);
    expect(groupByRegion([], [])).toEqual([]);
  });
});
