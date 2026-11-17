import { PDFDocument } from "pdf-lib";
import { buildFlyerPdf, flyerFileName, flyerQrUrl, initialsOf, printable } from "./flyer";

describe("flyer", () => {
  it("takes the parking's initials without « Parking des »", () => {
    expect(initialsOf("Parking des Cèdres")).toBe("C");
    expect(initialsOf("APL Parking Lyon")).toBe("AP");
    expect(initialsOf("  ")).toBe("P");
  });

  it("points the QR code at the parking's page once online, else at « Ma réservation »", () => {
    const listing = { status: "published", slug: "parking-des-cedres", airport: { slug: "lyon-saint-exupery" } };
    expect(flyerQrUrl("https://www.plazo.fr/", listing)).toEqual({
      url: "https://www.plazo.fr/lyon-saint-exupery/parking-des-cedres",
      listing: true,
    });
    expect(flyerQrUrl("https://www.plazo.fr", { ...listing, status: "pending_review" })).toEqual({
      url: "https://www.plazo.fr/ma-reservation",
      listing: false,
    });
    expect(flyerQrUrl("", null).url).toBe("https://www.plazo.fr/ma-reservation");
    // Opened from pro.plazo.fr: the QR code still leads to the travellers' site.
    expect(flyerQrUrl("https://pro.plazo.fr", listing).url).toBe("https://www.plazo.fr/lyon-saint-exupery/parking-des-cedres");
  });

  it("names the file after the parking", () => {
    expect(flyerFileName("Parking des Cèdres", "a4")).toBe("flyer-plazo-parking-des-cedres.pdf");
    expect(flyerFileName("!!", "a5")).toBe("flyer-plazo-parking-a5.pdf");
  });

  it("drops what the standard fonts cannot print", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont("Helvetica-Bold");
    expect(printable(font, "Parking des Cèdres 🚗  Łódź")).toBe("Parking des Cèdres ódz");
  });

  it("draws one A4 page, or two A5 on a landscape A4 sheet", async () => {
    const base = { name: "Parking des Cèdres 🚗", phone: "04 78 12 34 56", qrUrl: "https://www.plazo.fr/ma-reservation", logo: null, badges: null };
    const a4 = await PDFDocument.load(await buildFlyerPdf({ ...base, format: "a4" }));
    expect(a4.getPageCount()).toBe(1);
    expect(a4.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
    expect(a4.getTitle()).toBe("Flyer Plazo · Parking des Cèdres 🚗");
    const a5 = await PDFDocument.load(await buildFlyerPdf({ ...base, format: "a5" }));
    expect(a5.getPageCount()).toBe(1);
    expect(a5.getPage(0).getSize()).toEqual({ width: 841.89, height: 595.28 });
  });
});
