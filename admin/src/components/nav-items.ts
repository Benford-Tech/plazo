import {
  BarChart3,
  BusFront,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Euro,
  FileCheck,
  FileSignature,
  Globe,
  LayoutDashboard,
  SquareParking,
  Users,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { matchPath } from "react-router-dom";
import { fr } from "@/lib/fr";
import type { Permission } from "@/lib/roles";

export type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Direction A (30/10/2026, « réorganise le menu sur le web »): four groups by daily use, each page of the pro space
 * reachable from the rail; an entry with pages of its own unfolds on them (open while one of them is shown), with a
 * counter where something waits. The account (photo, name, role) sits at the bottom of the rail.
 */
export type NavSection = "today" | "reservations" | "parking" | "manager";
export const SECTIONS: NavSection[] = ["today", "reservations", "parking", "manager"];
export type Counter = "inbox" | "extras" | "whatsapp";
export type NavChild = {
  label: string;
  to: string;
  permission?: Permission;
  /** Active on this exact path only (the group's first page shares its prefix with the others). */
  end?: boolean;
  counter?: Counter;
};
export type NavItem = {
  label: string;
  to: string;
  icon: Icon;
  permission?: Permission;
  section: NavSection;
  /** The paths that belong to the entry (its children's, and the detail pages under it). */
  match?: string;
  children?: NavChild[];
};
const sub = fr.nav.sub;
export const NAV: NavItem[] = [
  { label: fr.nav.dashboard, to: "/", icon: LayoutDashboard, permission: "reservations:view", section: "today" },
  {
    label: fr.nav.planning,
    to: "/planning",
    icon: CalendarDays,
    permission: "reservations:view",
    section: "today",
    match: "/planning/*",
    children: [
      { label: sub.planningDay, to: "/planning", end: true },
      { label: sub.forecast, to: "/planning/previsionnel" },
    ],
  },
  { label: fr.nav.shuttles, to: "/navettes", icon: BusFront, permission: "reservations:view", section: "today" },
  {
    label: fr.nav.reservations,
    to: "/reservations",
    icon: ClipboardList,
    permission: "reservations:view",
    section: "reservations",
    match: "/reservations/*",
    children: [
      { label: sub.allReservations, to: "/reservations", end: true },
      { label: sub.inbox, to: "/reservations/a-verifier", permission: "reservations:manage", counter: "inbox" },
      { label: sub.whatsapp, to: "/reservations/whatsapp", permission: "reservations:status", counter: "whatsapp" },
      { label: sub.extras, to: "/reservations/services", permission: "reservations:manage", counter: "extras" },
      { label: sub.reminders, to: "/reservations/sms-veille", permission: "reservations:manage" },
      { label: sub.importFile, to: "/reservations/importer", permission: "parking:manage" },
    ],
  },
  {
    label: fr.nav.parking,
    to: "/parking",
    icon: SquareParking,
    permission: "reservations:view",
    section: "parking",
    match: "/parking/*",
    children: [
      { label: sub.occupation, to: "/parking/occupation" },
      { label: sub.plan, to: "/parking/plan", permission: "parking:manage" },
      { label: sub.spotPlanning, to: "/parking/planning" },
      { label: sub.settings, to: "/parking/reglages", permission: "parking:manage" },
    ],
  },
  // CA-B (09/10/2026): managers only.
  { label: fr.nav.revenue, to: "/chiffre-affaires", icon: Euro, permission: "revenue:view", section: "manager" },
  // 12/11/2026 (statistics B): which channels pay.
  { label: fr.nav.stats, to: "/statistiques", icon: BarChart3, permission: "revenue:view", section: "manager" },
  {
    label: fr.nav.plazo,
    to: "/plazo",
    icon: Globe,
    permission: "parking:manage",
    section: "manager",
    match: "/plazo/*",
    children: [
      { label: sub.listing, to: "/plazo/fiche" },
      { label: sub.pricing, to: "/plazo/tarifs" },
    ],
  },
  { label: fr.nav.team, to: "/equipe", icon: Users, permission: "team:manage", section: "manager" },
  // 26/10/2026 (R-A): the register of the travellers' signed contracts, managers only.
  { label: sub.signedContracts, to: "/contrats", icon: FileCheck, permission: "parking:manage", section: "manager" },
  { label: sub.plazoContract, to: "/mon-contrat", icon: FileSignature, permission: "parking:manage", section: "manager" },
];

/** Whether the page shown belongs to the entry (its own path, its children's, its detail pages). */
export function isInItem(item: NavItem, pathname: string): boolean {
  return item.to === "/"
    ? pathname === "/"
    : !!matchPath({ path: item.match ?? item.to, end: !item.match }, pathname) || pathname === item.to;
}

/** A section's pages one after the other (10/11/2026, the phone's pills and « Plus »): a group's first page takes its name. */
export type FlatPage = { label: string; to: string; end?: boolean; counter?: Counter; icon: Icon; group?: string; page?: string };
export function flatPages(items: NavItem[]): FlatPage[] {
  if (items.length === 1 && (items[0].children?.length ?? 0) > 0) {
    const only = items[0];
    return only.children!.map((c) => ({ label: c.label, to: c.to, end: c.end, counter: c.counter, icon: only.icon }));
  }
  return items.flatMap((item): FlatPage[] => {
    const kids = item.children ?? [];
    if (kids.length === 0) return [{ label: item.label, to: item.to, end: item.to === "/", icon: item.icon }];
    return kids.map((c, i) => ({ label: i === 0 ? item.label : c.label, to: c.to, end: c.end, counter: c.counter, icon: item.icon, group: item.label, page: c.label }));
  });
}
