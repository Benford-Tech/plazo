import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Home, Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { pushRecent, readRecent, samePageIn } from "@/lib/parking-switcher";
import { describeError, fr } from "@/lib/fr";
import type { PlatformOperator } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.switcher;
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function initials(name: string) {
  const words = name.replace(/\(.*?\)/g, "").split(/[\s-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "P";
}

function pillOf(o: PlatformOperator): { label: string; tone: string } | null {
  if (o.archivedAt) return { label: t.archivedPill, tone: "bg-muted text-muted-foreground" };
  if (o.status === "suspended") return { label: t.suspended, tone: "bg-bad-soft text-bad-text" };
  if (o.invitation && !o.manager) return { label: t.invited, tone: "bg-warn-soft text-warn-text" };
  if (o.isDemo) return { label: t.demo, tone: "bg-info-soft text-info-text" };
  if (o.isPlatform) return { label: t.tests, tone: "bg-info-soft text-info-text" };
  return null;
}

type Entry =
  | { kind: "operator"; operator: PlatformOperator }
  | { kind: "platform" }
  | { kind: "own" };

/**
 * Direction A (10/11/2026, « naviguer entre les parkings en tant que super admin »): the parking's name in the
 * top bar opens a list of every operator (search, recents, state), with the whole platform and the admin's own
 * space at the bottom; Ctrl K (⌘K) opens it too. Choosing a parking opens its space on the same page.
 */
export function ParkingSwitcher({
  current,
  className,
  compact = false,
}: {
  current: "platform" | "operator";
  className?: string;
  compact?: boolean;
}) {
  const { user, startViewAs, stopViewAs } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const ownId = user?.viewAs?.realOperatorId ?? (user?.viewAs ? undefined : user?.operatorId);
  const ownName = user?.viewAs ? user.viewAs.realOperatorName ?? "" : user?.operatorName ?? "";
  const openId = current === "platform" ? null : user?.operatorId;

  const list = useQuery({
    queryKey: ["platform", "operators", "switcher"],
    queryFn: () => adminApi.getPlatformOperators(),
    enabled: open,
    staleTime: 60_000,
  });
  const archived = useQuery({
    queryKey: ["platform", "operators", "switcher", "archived"],
    queryFn: () => adminApi.getPlatformOperators("archived"),
    enabled: open && query.trim() !== "",
    staleTime: 60_000,
  });

  // Ctrl K / ⌘K from anywhere in the space.
  useEffect(() => {
    if (compact) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compact]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const sections = useMemo(() => {
    const operators = list.data?.operators ?? [];
    const q = normalize(query.trim());
    if (q) {
      const match = (o: PlatformOperator) => normalize(o.name).includes(q);
      const found = operators.filter(match);
      const old = (archived.data?.operators ?? []).filter(match);
      return [
        { key: "found", title: t.all(found.length), items: found },
        ...(old.length ? [{ key: "archived", title: t.archived, items: old }] : []),
      ];
    }
    const byId = new Map(operators.map((o) => [o.id, o]));
    const recent = readRecent()
      .map((id) => byId.get(id))
      .filter((o): o is PlatformOperator => !!o);
    const others = operators.filter((o) => !recent.includes(o));
    return [
      ...(recent.length ? [{ key: "recent", title: t.recent, items: recent }] : []),
      { key: "all", title: t.all(operators.length), items: others },
    ];
  }, [list.data, archived.data, query]);

  const entries: Entry[] = useMemo(
    () => [
      ...sections.flatMap((s) => s.items.map((operator) => ({ kind: "operator" as const, operator }))),
      ...(query.trim() ? [] : [{ kind: "platform" as const }, ...(ownId ? [{ kind: "own" as const }] : [])]),
    ],
    [sections, query, ownId],
  );

  const choose = async (entry: Entry) => {
    if (busy) return;
    setOpen(false);
    const target = entry.kind === "operator" ? entry.operator.id : entry.kind === "own" ? ownId : null;
    if (entry.kind === "platform") {
      if (current === "platform") return;
      setBusy(true);
      try {
        if (user?.viewAs) await stopViewAs();
        queryClient.clear();
        navigate("/plateforme");
      } catch (err) {
        toast.error(describeError(err));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!target || target === openId) return;
    setBusy(true);
    try {
      if (target === ownId) await stopViewAs();
      else await startViewAs(target);
      if (entry.kind === "operator") pushRecent(target);
      // Nothing cached from the previous parking may show in the next one: every query is emptied and what is on
      // screen is read again with the new session (the page itself is remounted by AdminLayout's key).
      void queryClient.resetQueries();
      navigate(samePageIn(pathname), { replace: true });
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = entries.length;
      if (n) setActive((a) => (a + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    }
    if (e.key === "Enter" && entries[active]) {
      e.preventDefault();
      void choose(entries[active]);
    }
  };

  const label = current === "platform" ? t.platform : user?.operatorName ?? "";
  let index = -1;
  const rowClass = (i: number, selected: boolean) =>
    cn(
      "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm",
      i === active ? "bg-accent" : "hover:bg-accent",
      selected && "font-bold text-lime-deep",
    );

  return (
    <div
      className={cn("relative min-w-0", className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t.label} : ${label}`}
        disabled={busy}
        onClick={() => setOpen(!open)}
        data-testid="parking-switcher"
        className={cn(
          "flex min-h-9 max-w-full items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-sm font-bold text-foreground hover:bg-accent disabled:opacity-60",
          open && "border-lime-deep",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-lime-deep" aria-hidden="true" />
        {!compact && (
          <kbd className="ml-1 hidden rounded border border-border px-1 font-mono text-[11px] font-medium text-muted-foreground xl:inline">
            {t.shortcut}
          </kbd>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t.label}
          onKeyDown={onListKey}
          className={cn(
            "z-40 rounded-2xl border border-border bg-card p-2 shadow-xl",
            compact ? "fixed inset-x-3 top-16 max-h-[75vh]" : "absolute left-0 top-full mt-1 w-[22rem] max-w-[calc(100vw-2rem)]",
          )}
        >
          <label className="flex items-center gap-2 rounded-lg border border-border px-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={searchRef}
              id="parking-switcher-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder={t.search}
              aria-label={t.search}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <div role="listbox" aria-label={t.label} className="mt-1 max-h-[22rem] overflow-y-auto">
            {list.isLoading && <p className="px-2 py-3 text-sm text-muted-foreground">{t.loading}</p>}
            {list.isError && <p className="px-2 py-3 text-sm text-bad-text">{t.failed}</p>}
            {list.data &&
              sections.map((section) => (
                <div key={section.key}>
                  <p className="px-2 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                  {section.items.map((o) => {
                    index += 1;
                    const i = index;
                    const pill = pillOf(o);
                    const selected = o.id === openId;
                    return (
                      <button
                        key={`${section.key}-${o.id}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => void choose({ kind: "operator", operator: o })}
                        className={rowClass(i, selected)}
                      >
                        <span
                          aria-hidden="true"
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-lime-deep text-[10px] font-extrabold text-white"
                        >
                          {initials(o.name)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{o.name}</span>
                        {pill && <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", pill.tone)}>{pill.label}</span>}
                        {selected && <Check className="h-4 w-4 shrink-0 text-lime-deep" aria-label={t.current} />}
                      </button>
                    );
                  })}
                </div>
              ))}
            {list.data && query.trim() !== "" && sections.every((s) => s.items.length === 0) && !archived.isLoading && (
              <p className="px-2 py-3 text-sm text-muted-foreground">{t.none}</p>
            )}
            {!query.trim() && (
              <>
                <div className="mx-1 my-1.5 h-px bg-border" />
                {(() => {
                  index += 1;
                  const i = index;
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={current === "platform"}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => void choose({ kind: "platform" })}
                      className={rowClass(i, current === "platform")}
                    >
                      <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{t.platform}</span>
                      {current === "platform" && <Check className="h-4 w-4 shrink-0 text-lime-deep" aria-label={t.current} />}
                    </button>
                  );
                })()}
                {ownId &&
                  (() => {
                    index += 1;
                    const i = index;
                    const selected = current !== "platform" && openId === ownId;
                    return (
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => void choose({ kind: "own" })}
                        className={rowClass(i, selected)}
                      >
                        <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{t.own(ownName)}</span>
                        {selected && <Check className="h-4 w-4 shrink-0 text-lime-deep" aria-label={t.current} />}
                      </button>
                    );
                  })()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
