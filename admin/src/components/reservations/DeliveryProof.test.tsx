import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeliveryProof } from "./DeliveryPill";
import type { ReminderProof } from "@/lib/types";

const render1 = (proof: ReminderProof) => render(<DeliveryProof proof={proof} />);

describe("DeliveryProof (11/11/2026, « un status des envois réaliste »)", () => {
  it("a WhatsApp accepted by Meta and never confirmed is never « remis »", () => {
    render1({
      level: "unconfirmed",
      whatsapp: { state: "accepted", at: "2026-11-11T19:51", statusAt: null },
      sms: { state: "sent", at: "2026-11-11T20:00", statusAt: null },
    });
    expect(screen.getByTestId("delivery-proof")).toHaveTextContent("WhatsApp accepté · pas de confirmation");
    expect(screen.getByTestId("delivery-proof")).toHaveAttribute("data-level", "unconfirmed");
    expect(screen.getByText(/accepté par Meta à 19:51, sans réponse depuis · SMS de repli parti du téléphone à 20:00, remise non confirmée/)).toBeInTheDocument();
    expect(screen.queryByText(/remis à/i)).toBeNull();
  });

  it("read on WhatsApp: confirmed, with the time", () => {
    render1({ level: "confirmed", whatsapp: { state: "read", at: "2026-11-11T19:51", statusAt: "2026-11-11T19:55" }, sms: null });
    expect(screen.getByTestId("delivery-proof")).toHaveTextContent("WhatsApp lu à 19:55");
  });

  it("refused by Meta and the SMS failed: « Non remis »", () => {
    render1({
      level: "failed",
      whatsapp: { state: "refused", at: "2026-11-11T19:51", statusAt: null },
      sms: { state: "failed", at: "2026-11-11T19:51", statusAt: null },
    });
    expect(screen.getByTestId("delivery-proof")).toHaveTextContent("Non remis");
    expect(screen.getByText(/WhatsApp refusé par Meta à 19:51 · SMS en échec/)).toBeInTheDocument();
  });
});
