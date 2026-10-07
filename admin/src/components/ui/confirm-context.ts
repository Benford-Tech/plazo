import { createContext, useContext, useMemo } from "react";

export interface ConfirmOptions {
  title?: string;
  /** Label of the button that says yes; the other one always says "Annuler". */
  confirmLabel?: string;
  /** A destructive action: the yes button turns red. */
  destructive?: boolean;
}
export type ConfirmFn = (
  message: string,
  options?: ConfirmOptions,
) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * In-app replacement of window.confirm (07/10/2026, "plus d'alerte native") : a small modal in the
 * pro space's own style, resolved as a promise. Without a provider (tests of one component), the
 * native dialog is used so nothing silently passes.
 */
export function useConfirm(): ConfirmFn {
  const fromContext = useContext(ConfirmContext);
  return useMemo(
    () => fromContext ?? (async (message) => window.confirm(message)),
    [fromContext],
  );
}
