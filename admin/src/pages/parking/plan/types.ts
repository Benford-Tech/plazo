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
/**
 * "The plan is made at once: one line per file and a capacity" (07/10/2026): the toolbar shows the
 * three tools of that gesture; the zone brushes, obstacles and spots of the estimator sit behind an
 * "Avancé" toggle.
 */
export const PRIMARY_TOOLS: Tool[] = ["contour", "files", "landmark"];
export const ADVANCED_TOOLS: Tool[] = [
  "parking",
  "passage",
  "obstacle",
  "spots",
];
export type ResetScope = "all" | "zones" | "spots" | "files";
