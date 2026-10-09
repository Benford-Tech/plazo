import { nameParts, splitName } from "./names";

describe("prénom et nom", () => {
  it("coupe un nom affiché au premier espace", () => {
    expect(splitName("Jean Dupont")).toEqual({ firstName: "Jean", lastName: "Dupont" });
    expect(splitName("  Jean   de La Tour ")).toEqual({ firstName: "Jean", lastName: "de La Tour" });
    expect(splitName("Madonna")).toEqual({ firstName: "Madonna", lastName: "" });
    expect(splitName("")).toEqual({ firstName: "", lastName: "" });
    expect(splitName(undefined)).toEqual({ firstName: "", lastName: "" });
  });

  it("garde le prénom et le nom enregistrés, sinon coupe le nom affiché", () => {
    expect(nameParts("Camille", "Martin", "Camille Martin")).toEqual({ firstName: "Camille", lastName: "Martin" });
    expect(nameParts("", "Martin", "Camille Martin")).toEqual({ firstName: "", lastName: "Martin" });
    expect(nameParts("", "", "Camille Martin")).toEqual({ firstName: "Camille", lastName: "Martin" });
    expect(nameParts(undefined, null, "Jean Dupont")).toEqual({ firstName: "Jean", lastName: "Dupont" });
  });
});
