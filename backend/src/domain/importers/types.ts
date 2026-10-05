/** What an importer could read from a pasted confirmation; anything missing is completed by staff. */
export interface ParsedBooking {
  provider: string; // display name, stored as channelDetail
  externalReference?: string;
  arrivalAt?: string; // local to the parking, "YYYY-MM-DDTHH:mm"
  returnAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  plate?: string;
  returnFlight?: string;
  departureFlight?: string;
  passengers?: number;
  priceCents?: number;
}

export interface EmailImporter {
  provider: string;
  /** True when the text looks like this provider's confirmation. */
  detect(text: string): boolean;
  parse(text: string): ParsedBooking;
}
