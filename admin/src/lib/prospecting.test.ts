import { parseCsvCells, readProspectsCsv, renderSubjectText, renderText, unknownVariables } from "./prospecting";

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
