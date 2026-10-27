import { beforeEach, describe, expect, it, vi } from "vitest";

const { contact, newsletter } = vi.hoisted(() => ({ contact: vi.fn(), newsletter: vi.fn() }));
vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ApiError: actual.ApiError, api: { contact, newsletter } };
});

import { ApiError } from "../api";
import { contactAction, newsletterAction } from "../contact-actions";
import { EMPTY_FORM } from "../forms";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

const message = { name: " Camille Martin ", email: " camille@example.com ", reference: " rab234 ", message: "  Ma voiture a-t-elle une place couverte ?  ", website: "" };

describe("contactAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the trimmed fields with the honeypot, then says the message is sent", async () => {
    contact.mockResolvedValue({ ok: true });
    const state = await contactAction(EMPTY_FORM, form(message));
    expect(contact).toHaveBeenCalledWith({
      name: "Camille Martin",
      email: "camille@example.com",
      reference: "RAB234",
      message: "Ma voiture a-t-elle une place couverte ?",
      website: "",
    });
    expect(state).toEqual({ values: {}, fields: {}, error: null, notice: "contact_sent" });
  });

  it("leaves out an empty reference and forwards a filled honeypot (the API answers 202 and sends nothing)", async () => {
    contact.mockResolvedValue({ ok: true });
    await contactAction(EMPTY_FORM, form({ ...message, reference: "", website: "http://spam" }));
    expect(contact).toHaveBeenCalledWith(expect.objectContaining({ reference: undefined, website: "http://spam" }));
  });

  it("checks the required fields and the message length before calling the API", async () => {
    const state = await contactAction(EMPTY_FORM, form({ name: "", email: "", message: "Bonjour" }));
    expect(contact).not.toHaveBeenCalled();
    expect(state.error).toBe("validation_failed");
    expect(state.fields).toEqual({ name: "required", email: "required", message: "message_too_short" });
    const long = await contactAction(EMPTY_FORM, form({ ...message, message: "x".repeat(2001) }));
    expect(long.fields).toEqual({ message: "message_too_long" });
  });

  it("words the API's field codes and keeps what was typed", async () => {
    contact.mockRejectedValue(new ApiError(400, "Validation failed", "validation_failed", { email: "invalid", message: "too_short" }));
    const state = await contactAction(EMPTY_FORM, form({ ...message, email: "camille@" }));
    expect(state).toMatchObject({ error: "validation_failed", fields: { email: "invalid_email", message: "message_too_short" } });
    expect(state.values).toMatchObject({ name: "Camille Martin", email: "camille@", reference: "RAB234" });
  });

  it("passes the API's codes on: not open yet, too many attempts", async () => {
    contact.mockRejectedValueOnce(new ApiError(409, "Contact form not available", "contact_unavailable"));
    expect((await contactAction(EMPTY_FORM, form(message))).error).toBe("contact_unavailable");
    contact.mockRejectedValueOnce(new ApiError(429, "Too many", "too_many_requests"));
    expect((await contactAction(EMPTY_FORM, form(message))).error).toBe("too_many_requests");
  });

  it("never logs what was typed on an unexpected error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    contact.mockRejectedValue(new TypeError(`boom ${message.email}`));
    const state = await contactAction(EMPTY_FORM, form(message));
    expect(state.error).toBe("unknown");
    expect(JSON.stringify(spy.mock.calls)).not.toContain("camille");
    spy.mockRestore();
  });
});

describe("newsletterAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes with the consent the form describes and the honeypot", async () => {
    newsletter.mockResolvedValue({ ok: true });
    const state = await newsletterAction(EMPTY_FORM, form({ email: " camille@example.com ", website: "" }));
    expect(newsletter).toHaveBeenCalledWith({ email: "camille@example.com", consent: true, website: "" });
    expect(state).toEqual({ values: {}, fields: {}, error: null, notice: "newsletter_sent" });
  });

  it("asks for an address, and passes the API's answers on", async () => {
    expect(await newsletterAction(EMPTY_FORM, form({ email: "" }))).toMatchObject({ fields: { email: "required" }, error: "validation_failed" });
    expect(newsletter).not.toHaveBeenCalled();
    newsletter.mockRejectedValueOnce(new ApiError(409, "Newsletter not available", "newsletter_unavailable"));
    expect((await newsletterAction(EMPTY_FORM, form({ email: "camille@example.com" }))).error).toBe("newsletter_unavailable");
    newsletter.mockRejectedValueOnce(new ApiError(400, "Validation failed", "validation_failed", { email: "invalid_email" }));
    expect(await newsletterAction(EMPTY_FORM, form({ email: "camille@" }))).toMatchObject({ fields: { email: "invalid_email" }, values: { email: "camille@" } });
  });
});

describe("quoteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the operator's details and the selection read again from its ids", async () => {
    const { quoteAction } = await import("../contact-actions");
    contact.mockResolvedValue({ ok: true });
    const data = form({ firstName: " Claire ", lastName: "Martin", parking: "Parking des Cèdres", email: "claire@example.com", phone: "", airport: "", plan: "complet", yearly: "0", marketplace: "1", website: "" });
    data.append("options", "setup");
    data.append("options", "evil<script>");
    const state = await quoteAction(EMPTY_FORM, data);
    expect(state.notice).toBe("quote_sent");
    const sent = contact.mock.calls[0][0];
    expect(sent.name).toBe("Claire Martin");
    expect(sent.message).toContain("Parking : Parking des Cèdres");
    expect(sent.message).toContain("Logiciel Complet");
    expect(sent.message).toContain("Mise en route sur place");
    expect(sent.message).not.toContain("evil");
  });

  it("asks for the required fields before calling the API", async () => {
    const { quoteAction } = await import("../contact-actions");
    const state = await quoteAction(EMPTY_FORM, form({ firstName: "", lastName: "Martin", parking: "", email: "" }));
    expect(state.error).toBe("validation_failed");
    expect(state.fields).toEqual({ firstName: "required", parking: "required", email: "required" });
    expect(contact).not.toHaveBeenCalled();
  });
});
