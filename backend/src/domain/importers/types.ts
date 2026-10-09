/** What an importer could read from a pasted confirmation; anything missing is completed by staff. */
export interface ParsedBooking {
  provider: string; // display name, stored as channelDetail
  externalReference?: string;
  arrivalAt?: string; // local to the parking, "YYYY-MM-DDTHH:mm"
  returnAt?: string;
  /** Display form "Prénom Nom" (or the name as the email gives it, when it does not tell first and last name apart). */
  customerName?: string;
  /** 09/10/2026: when the email tells them apart (Onepark, Allopark, Claude's reading); else customerName is split. */
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  plate?: string;
  returnFlight?: string;
  departureFlight?: string;
  passengers?: number;
  /** Amount of the booking in euro cents (the parking's revenue: without the comparator's own booking fee). */
  priceCents?: number;
  vehicleModel?: string;
  vehicleColour?: string;
}

export interface EmailImporter {
  provider: string;
  /**
   * Who its confirmations come from, for the operator's forwarding rule (setup wizard, G-B): a full address when known
   * (« info@allopark.com »), else the word of the comparator's domain (« parclick »), which a Gmail filter matches.
   */
  senders: string[];
  /** True when the text looks like this provider's confirmation. */
  detect(text: string): boolean;
  parse(text: string): ParsedBooking;
}
