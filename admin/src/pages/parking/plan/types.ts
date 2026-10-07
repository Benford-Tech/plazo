/** The editor's tools (R-A, 07/10/2026), in toolbar order. */
export type Tool =
  | "contour"
  | "parking"
  | "passage"
  | "obstacle"
  | "landmark"
  | "spots";
export const TOOLS: Tool[] = [
  "contour",
  "parking",
  "passage",
  "obstacle",
  "landmark",
  "spots",
];
export type ResetScope = "all" | "zones" | "spots";
