import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SitePreview, type SiteDraft } from "./SitePreview";

// 24/11/2026 (« Il faut un aperçu du site en cours d'édition », choix A côte à côte, en direct). Fictional data only.

const draft: SiteDraft = {
  theme: "park",
  accent: "#0E5FA8",
  accent2: null,
  blocks: [{ id: "booking", kind: "booking", enabled: true, title: null, text: null }],
  showLogo: false,
  rating: null,
  pages: false,
  heroPhotoUrl: null,
  teamPhotoUrl: null,
};

describe("l'aperçu du site", () => {
  it("encadre le site avec la clé d'aperçu et lui envoie le brouillon quand il est prêt", () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 640 });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 800 });
    const url = "https://www.plazo.fr/s/cedres?apercu=0123456789abcdef0123";
    const onClose = vi.fn();
    render(<SitePreview url={url} draft={draft} onClose={onClose} />);
    const frame = screen.getByTestId("site-live-frame") as HTMLIFrameElement;
    expect(frame).toHaveAttribute("src", url);
    // Drawn at a computer's width, scaled to the frame.
    expect(frame.style.width).toBe("1280px");
    expect(frame.style.transform).toBe("scale(0.5)");

    const post = vi.fn();
    Object.defineProperty(frame, "contentWindow", { configurable: true, value: { postMessage: post } });
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { origin: "https://www.plazo.fr", source: frame.contentWindow as Window, data: { type: "plazo-site-ready" } }));
    });
    expect(post).toHaveBeenCalledWith({ type: "plazo-site-draft", draft }, "https://www.plazo.fr");
    // Another origin is not answered.
    post.mockClear();
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { origin: "https://ailleurs.example", source: frame.contentWindow as Window, data: { type: "plazo-site-ready" } }));
    });
    expect(post).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Téléphone" }));
    expect((screen.getByTestId("site-live-frame") as HTMLIFrameElement).style.width).toBe("390px");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
