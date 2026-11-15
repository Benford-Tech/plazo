import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContractSignedIcon } from "./ContractSignedIcon";

describe("ContractSignedIcon", () => {
  it("dit quand le contrat a été signé", () => {
    render(<ContractSignedIcon signedAt="2026-11-15T07:32:00.000Z" />);
    const icon = screen.getByTestId("contract-signed-icon");
    expect(icon.getAttribute("title")).toMatch(/^Contrat signé le 15 nov\./);
  });

  it("ne montre rien tant qu'il n'est pas signé", () => {
    const { container } = render(<ContractSignedIcon signedAt={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
