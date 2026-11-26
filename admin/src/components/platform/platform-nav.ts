import { Building2, LayoutDashboard, Send } from "lucide-react";
import { fr } from "@/lib/fr";

type Item = { to: string; label: string; end?: boolean; badge?: "listings" };

export const PLATFORM_GROUPS: { label: string; items: Item[] }[] = [
  {
    label: fr.platform.nav.groups.steer,
    items: [
      { to: "/plateforme", label: fr.platform.nav.overview, end: true },
      { to: "/plateforme/loueurs", label: fr.platform.tabs.operators },
      {
        to: "/plateforme/annonces",
        label: fr.platform.tabs.listings,
        badge: "listings",
      },
      { to: "/plateforme/reservations", label: fr.platform.tabs.reservations },
      { to: "/plateforme/paiements", label: fr.platform.tabs.payments },
      { to: "/plateforme/invitations", label: fr.platform.tabs.invitations },
    ],
  },
  {
    label: fr.platform.nav.groups.grow,
    items: [
      { to: "/plateforme/prospection", label: fr.platform.tabs.prospecting },
      { to: "/plateforme/referencement", label: fr.platform.tabs.seo },
      { to: "/plateforme/articles", label: fr.platform.tabs.articles },
      { to: "/plateforme/applications", label: fr.platform.tabs.apps },
      { to: "/plateforme/mails-accueil", label: fr.platform.tabs.welcome },
      {
        to: "/plateforme/notifications",
        label: fr.platform.tabs.notifications,
      },
    ],
  },
  {
    label: fr.platform.nav.groups.tools,
    items: [{ to: "/plateforme/capacite", label: fr.platform.tabs.capacity }],
  },
];

/** 22/11/2026 (direction A, téléphone) : the three pages with a tab of their own; the rest is under « Plus ». */
export const TABS = [
  { key: "overview", to: "/plateforme", icon: LayoutDashboard },
  { key: "operators", to: "/plateforme/loueurs", icon: Building2 },
  { key: "prospecting", to: "/plateforme/prospection", icon: Send },
] as const;
export const PLATFORM_MORE_PATH = "/plateforme/plus";
export const PLATFORM_TAB_PATHS: string[] = TABS.map((t) => t.to);
