"use client";

import Form from "next/form";
import { useEffect, useSyncExternalStore } from "react";
import { fr } from "@/lib/fr";

// The form remounts after each navigation (its key is the query string), so the field the traveller
// just used gets its focus back.
let focusAfterNavigation: string | null = null;

const subscribe = () => () => {};

/**
 * Filters of the results page: a GET form on the results page itself. With JavaScript, every change
 * applies at once (client-side navigation); without it, an "Apply" button submits the form.
 */
export function FiltersForm({ action, children }: { action: string; children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!focusAfterNavigation) return;
    document.getElementById(focusAfterNavigation)?.focus();
    focusAfterNavigation = null;
  }, []);

  return (
    <Form
      action={action}
      replace
      scroll={false}
      onChange={event => {
        const target = event.target as HTMLElement;
        focusAfterNavigation = target.id || null;
        event.currentTarget.requestSubmit();
      }}
      className="flex flex-col gap-[22px]"
    >
      {children}
      {!hydrated && (
        <button type="submit" className="btn-secondary h-11 px-4 text-[15px]">
          {fr.results.apply}
        </button>
      )}
    </Form>
  );
}
