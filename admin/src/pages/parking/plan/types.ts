/** The editor's tools (R-A, 07/10/2026), in toolbar order. */
export type Tool =
  | "contour"
  | "parking"
  | "passage"
  | "obstacle"
  | "landmark"
  | "files"
  | "spots";
// S-C (07/10/2026): "files" is the unit of storage of a valet parking; "spots" stays for self-park plans.
export const TOOLS: Tool[] = [
  "contour",
  "parking",
  "passage",
  "obstacle",
  "landmark",
  "files",
  "spots",
];
export type ResetScope = "all" | "zones" | "spots";
