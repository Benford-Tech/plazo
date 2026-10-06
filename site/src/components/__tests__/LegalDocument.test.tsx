import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalDocument } from "../LegalDocument";
import { termsDoc, legalNoticeDoc } from "@/lib/legal";

describe("LegalDocument", () => {
  it("shows the draft notice, the contents and every section", () => {
    const doc = termsDoc();
    render(<LegalDocument doc={doc} />);
    expect(screen.getByRole("heading", { level: 1, name: "Conditions générales" })).toBeInTheDocument();
    expect(screen.getByText("Projet, à valider avec un juriste")).toBeInTheDocument();
    expect(screen.getByText("Version du 6 octobre 2026")).toBeInTheDocument();
    const contents = screen.getByRole("navigation", { name: "Sommaire" });
    expect(contents.querySelectorAll("a")).toHaveLength(doc.sections.length);
    for (const s of doc.sections) expect(screen.getByRole("heading", { level: 2, name: s.title })).toBeInTheDocument();
  });

  it("turns [label](/path) into internal links", () => {
    render(<LegalDocument doc={termsDoc()} />);
    expect(screen.getAllByRole("link", { name: "mentions légales" })[0]).toHaveAttribute("href", "/mentions-legales");
    expect(screen.getByRole("link", { name: "politique de confidentialité" })).toHaveAttribute("href", "/confidentialite");
    expect(screen.queryByText(/\]\(\//)).not.toBeInTheDocument();
  });

  it("a short page has no contents", () => {
    const doc = legalNoticeDoc();
    render(<LegalDocument doc={{ ...doc, sections: doc.sections.slice(0, 2) }} />);
    expect(screen.queryByRole("navigation", { name: "Sommaire" })).not.toBeInTheDocument();
  });
});
