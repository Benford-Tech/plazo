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
 * The same form serves the filters panel (a column of fieldsets) and the row of quick filter chips
 * (`className="contents"`, the chips being labels around checkboxes; its "Apply" button is a chip too).
 */
export function FiltersForm({
  action,
  children,
  className = "flex flex-col gap-[22px]",
  applyClassName = "btn-secondary h-11 px-4 text-[15px]",
}: {
  action: string;
  children: React.ReactNode;
  className?: string;
  /** Look of the "Apply" button shown before hydration (without JavaScript). */
  applyClassName?: string;
}) {
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
      className={className}
    >
      {children}
      {!hydrated && (
        <button type="submit" className={applyClassName}>
          {fr.results.apply}
        </button>
      )}
    </Form>
  );
}
