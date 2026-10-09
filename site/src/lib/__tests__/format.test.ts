import { describe, expect, it } from "vitest";
import { formatKm, listingFacts } from "../listing";
import { formatEuros, formatWholeEuros } from "../money";
import { fr, fromPriceUnit } from "../fr";
import { firstName, formatPhone, greetingName, isFrenchMobile, splitName } from "../phone";
import { hasSupportEmail } from "../product";
import { formatPlate, isPlausiblePlate, plateKey } from "../plate";

describe("prices", () => {
  it("formats cents as French euros", () => {
    expect(formatEuros(5500)).toBe("55,00 €");
    expect(formatEuros(3499)).toBe("34,99 €");
    expect(formatEuros(0)).toBe("0,00 €");
    expect(formatEuros(123456)).toBe("1 234,56 €");
    expect(formatEuros(-600)).toBe("-6,00 €");
    expect(formatWholeEuros(12000)).toBe("120 €");
  });
});

describe("plates", () => {
  it("adds the dashes of French plates and keeps foreign ones", () => {
    expect(formatPlate("gk318px")).toBe("GK-318-PX");
    expect(formatPlate(" gk 318 px ")).toBe("GK-318-PX");
    expect(formatPlate("GK-318-PX")).toBe("GK-318-PX");
    expect(formatPlate("b  ab 1234")).toBe("B AB 1234");
    expect(plateKey("gk-318 px")).toBe("GK318PX");
    expect(isPlausiblePlate("GK-318-PX")).toBe(true);
    expect(isPlausiblePlate("GK/318")).toBe(false);
    expect(isPlausiblePlate("A")).toBe(false);
  });
});

describe("phones and names", () => {
  it("formats French numbers for display", () => {
    expect(formatPhone("0612345678")).toBe("06 12 34 56 78");
    expect(formatPhone("06.12.34.56.78")).toBe("06 12 34 56 78");
    expect(formatPhone("+33612345678")).toBe("+33 6 12 34 56 78");
    expect(formatPhone("+44 20 7946 0958")).toBe("+44 20 7946 0958");
    expect(firstName("  Camille Laurent ")).toBe("Camille");
  });

  it("never greets with a title or an initial", () => {
    expect(firstName("M. Dupont")).toBe("");
    expect(firstName("Mme Dupont")).toBe("");
    expect(firstName("J. Dupont")).toBe("");
    expect(firstName("Marie-Anne Dupont")).toBe("Marie-Anne");
    expect(fr.manage.confirmedTitle(firstName("M. Dupont"))).toBe("C’est réservé !");
  });

  it("asks for the first name and the last name apart", () => {
    expect(fr.booking.firstName).toBe("Prénom");
    expect(fr.booking.lastName).toBe("Nom");
    // Under one field: no « prénom et nom » in the message.
    expect(fr.errors.invalid_name).toBe("Lettres, espaces, apostrophes et tirets seulement.");
  });

  it("greets with the first name the traveller typed, else the one guessed from the full name", () => {
    expect(greetingName({ customerFirstName: "Marie Claire", customerName: "Marie Claire Dupont" })).toBe("Marie Claire");
    expect(greetingName({ customerFirstName: " Camille ", customerName: "Camille Laurent" })).toBe("Camille");
    // An older API, or a booking without a first name: guessed as before.
    expect(greetingName({ customerName: "Camille Laurent" })).toBe("Camille");
    expect(greetingName({ customerFirstName: "", customerName: "Camille Laurent" })).toBe("Camille");
    // A title or an initial typed as a first name: no name in the greeting.
    expect(greetingName({ customerFirstName: "M.", customerName: "M. Dupont" })).toBe("");
    expect(fr.manage.confirmedTitle(greetingName({ customerFirstName: "Camille", customerName: "Camille Laurent" }))).toBe("C’est réservé, Camille !");
  });

  it("splits a full name as the API splits an older one (first word, then the rest)", () => {
    expect(splitName("  Camille   Laurent ")).toEqual({ firstName: "Camille", lastName: "Laurent" });
    expect(splitName("Jean de La Fontaine")).toEqual({ firstName: "Jean", lastName: "de La Fontaine" });
    expect(splitName("Camille")).toEqual({ firstName: "Camille", lastName: "" });
    expect(splitName("")).toEqual({ firstName: "", lastName: "" });
  });

  it("knows which numbers get the confirmation SMS (French mobiles)", () => {
    expect(isFrenchMobile("06 12 34 56 78")).toBe(true);
    expect(isFrenchMobile("+33 7 12 34 56 78")).toBe(true);
    expect(isFrenchMobile("0033 6 12 34 56 78")).toBe(true);
    expect(isFrenchMobile("04 72 22 72 21")).toBe(false);
    expect(isFrenchMobile("+44 7911 123456")).toBe(false);
  });

  it("hides the placeholder support address", () => {
    expect(hasSupportEmail("support@example.com")).toBe(false);
    expect(hasSupportEmail("")).toBe(false);
    expect(hasSupportEmail("contact@parkings-lyon.fr")).toBe(true);
  });

  it("says what a « dès » price covers", () => {
    expect(fromPriceUnit(1)).toBe("la journée");
    expect(fromPriceUnit(3)).toBe("pour 3 jours");
    expect(fromPriceUnit(null)).toBe("");
  });
});

describe("listing facts", () => {
  it("summarises a parking in one line", () => {
    expect(formatKm(3.5)).toBe("3,5");
    expect(
      listingFacts({
        slug: "p",
        title: "P",
        services: ["shuttle", "fenced", "cctv"],
        shuttleMinutes: 8,
        distanceKm: 3.5,
        openingHours: null,
        cancellationPolicy: "free_24h",
        photo: null,
      }),
    ).toBe("Navette 8 min · 3,5 km · Clôturé · Vidéosurveillance · Annulation gratuite 24 h");
  });
});
