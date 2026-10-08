import PostalMime from "postal-mime";
import { describe, expect, it } from "vitest";
import { BODY_MAX_CHARS, toInboundPayload } from "../src/payload";
import { alloparkForwarded, gmailConfirmation, groupOnly } from "./samples";

const envelope = { from: "bounce+srs=xyz@gmail.com", to: "Parkair-Lyon-7f3a@plazo.fr" };

describe("toInboundPayload", () => {
  it("garde l'expéditeur d'origine, l'adresse Plazo de l'enveloppe et les deux versions du texte", async () => {
    const { items } = toInboundPayload(await PostalMime.parse(alloparkForwarded), envelope);
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item.From).toEqual({ Name: "ALLOPARK", Address: "info@allopark.com" });
    // The forwarded email is still addressed to the parking: only the envelope names its Plazo address.
    expect(item.To).toEqual([{ Name: "Parking Air Lyon", Address: "contact@parkair.fr" }]);
    expect(item.Recipients).toEqual(["parkair-lyon-7f3a@plazo.fr"]);
    expect(item.Subject).toBe("Confirmation de votre réservation AL-884880719");
    expect(item.MessageId).toBe("<abc123@allopark.com>");
    expect(item.RawTextBody).toContain("Réservation AL-884880719");
    expect(item.RawTextBody).toContain("Du 12 octobre 2026 - 08:30 au 19 octobre 2026 - 17:00");
    expect(item.RawHtmlBody).toContain("<b>AL-884880719</b>");
  });

  it("transmet le mail de code de Gmail tel quel (Plazo y lit le code)", async () => {
    const [item] = toInboundPayload(await PostalMime.parse(gmailConfirmation), { from: "x@google.com", to: "parkair-lyon-7f3a@plazo.fr" }).items;
    expect(item.From?.Address).toBe("forwarding-noreply@google.com");
    expect(item.Subject).toContain("(#482913507)");
    expect(item.RawTextBody).toContain("Confirmation code: 482913507");
    expect(item.RawHtmlBody).toBeNull();
  });

  it("aplatit les groupes d'adresses, coupe les corps trop longs, retombe sur l'enveloppe sans expéditeur", async () => {
    const parsed = await PostalMime.parse(groupOnly);
    const [item] = toInboundPayload({ ...parsed, from: undefined, html: "x".repeat(BODY_MAX_CHARS + 50) }, envelope).items;
    expect(item.To.map(a => a.Address)).toEqual(["a@example.com", "b@example.com"]);
    expect(item.From).toEqual({ Name: null, Address: envelope.from });
    expect(item.RawTextBody).toBeNull();
    expect(item.RawHtmlBody).toHaveLength(BODY_MAX_CHARS);
  });
});
