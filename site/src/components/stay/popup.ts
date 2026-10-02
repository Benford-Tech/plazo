"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Keeps Tab and Shift+Tab inside a dialog. */
export function trapTab(event: React.KeyboardEvent | KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== "Tab" || !container) return;
  const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => !el.closest("[inert]"));
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Behaviour of an open picker: Escape and Tab (focus stays inside), and a click outside it (or
 * outside its trigger) closes it.
 */
export function usePopupBehaviour(open: boolean, container: RefObject<HTMLElement | null>, trigger: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else trapTab(event, container.current);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (container.current?.contains(target) || trigger.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, container, trigger, onClose]);
}

/**
 * Page position (absolute, in document coordinates) of a popover of `width` px under its trigger,
 * kept inside the viewport with a 16 px margin.
 */
export function useAnchoredPosition(open: boolean, trigger: RefObject<HTMLElement | null>, width: number) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = trigger.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      const left = Math.max(16, Math.min(rect.left, viewport - width - 16));
      setPosition({ top: rect.bottom + window.scrollY + 10, left: left + window.scrollX });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, trigger, width]);
  return position;
}

/** Phones get bottom sheets, larger screens popovers (read when a picker opens). */
export function isPhone(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 639px)").matches;
}

/** Whether the popover has room for two months side by side. */
export function hasRoomForTwoMonths(): boolean {
  return typeof window !== "undefined" && window.innerWidth >= 768;
}
