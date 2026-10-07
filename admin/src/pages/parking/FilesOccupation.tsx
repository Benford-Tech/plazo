import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Aside, PanelLabel, ToolButton } from "@/components/capacity/ui";
import { ParkingTabs } from "@/components/parking/ParkingTabs";
import { Plate } from "@/components/Plate";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { adminApi, ApiError } from "@/lib/api";
import { dateTimeShort, shortDay } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type {
  FileArrival,
  FileBoard,
  FileCar,
  FileChoice,
  FileView,
} from "@/lib/plan/parkingFiles";
import { cn } from "@/lib/utils";

const t = fr.occupation;
const tf = fr.occupation.files;

function reasonOf(c: FileChoice): string {
  return c.reason === "moves" ? tf.reason.moves(c.moves) : tf.reason[c.reason];
}

/**
 * S-C "Des files, pas des places" (07/10/2026): the occupation read in files. Each file is a stack
 * from the aisle to the back; the arrivals to place get the file the rule picks; the figure on top
 * is the cars to take out today, which should read 0.
 */
export function FilesOccupation({
  parkingId,
  board,
  focus,
  canManage,
}: {
  parkingId: string;
  board: FileBoard;
  /** "?focus=<reservation>" from a booking's card: that arrival is highlighted. */
  focus: string | null;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const card = useQuickCard();
  const [placing, setPlacing] = useState<{
    reservationId: string;
    plate: string;
    choice: FileChoice;
  } | null>(null);
  const [keys, setKeys] = useState("");
  const [choosing, setChoosing] = useState<string | null>(null);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["files", parkingId] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const assign = useMutation({
    mutationFn: (v: {
      reservationId: string;
      fileId: string | null;
      keyHook?: string | null;
      plate: string;
      code?: string;
    }) =>
      adminApi.assignFile(v.reservationId, {
        fileId: v.fileId,
        keyHook: v.keyHook,
      }),
    onSuccess: (_res, v) => {
      toast.success(
        v.fileId ? tf.placed(v.plate, v.code ?? "") : tf.removed(v.plate),
      );
      setPlacing(null);
      setKeys("");
      refresh();
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiError && e.code === "file_full"
          ? tf.reason.full
          : describeError(e),
      ),
  });
  const prepare = useMutation({
    mutationFn: () => adminApi.prepareFiles(parkingId),
    onSuccess: ({ data }) => {
      toast.success(tf.prepared(data.planned, data.free));
      refresh();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  useEffect(() => {
    if (!focus) return;
    const el = document.querySelector(`[data-reservation="${focus}"]`);
    el?.scrollIntoView({ block: "center" });
  }, [focus, board]);

  const s = board.stats;
  return (
    <>
      <ParkingTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{tf.intro}</p>
      </div>
      <div className="-mx-4 flex flex-col border-y border-border sm:-mx-6 lg:h-[calc(100vh-280px)] lg:min-h-[600px]">
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 border-b border-border px-6 py-2 text-sm">
          <span
            className={cn(
              "flex items-baseline gap-2 font-mono text-2xl font-bold",
              s.movesToday === 0 ? "text-ok" : "text-bad",
            )}
            data-testid="moves-today"
            title={tf.movesHelp}
          >
            {s.movesToday}
            <span className="font-sans text-sm font-semibold uppercase tracking-[0.5px]">
              {tf.movesToday}
            </span>
          </span>
          <span className="font-mono font-bold" data-testid="files-stats">
            {tf.cars(s.onSite, s.capacity)} ·{" "}
            {tf.filesCount(s.files - s.unsound, s.files)}
          </span>
          <span className="ml-auto flex items-center gap-3">
            <ToolButton
              className="min-h-8"
              disabled={prepare.isPending}
              onClick={() => prepare.mutate()}
            >
              {tf.prepare}
            </ToolButton>
            {canManage && (
              <Link
                to="/parking/plan/files"
                className="text-lime-deep underline-offset-2 hover:underline"
              >
                {tf.plan}
              </Link>
            )}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <main className="min-h-[50vh] min-w-0 flex-1 overflow-auto p-4 lg:min-h-0">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
              {board.files.map((f) => (
                <FileColumn
                  key={f.id}
                  file={f}
                  date={board.date}
                  highlight={choosing !== null}
                  focus={focus}
                  onOpen={(id) => card.open(id)}
                  onRemove={(c) =>
                    assign.mutate({
                      reservationId: c.id,
                      fileId: null,
                      plate: c.plate,
                    })
                  }
                  onPick={
                    choosing
                      ? () => {
                          const a = board.arrivals.find(
                            (x) => x.id === choosing,
                          );
                          const choice = a?.choices.find(
                            (c) => c.fileId === f.id,
                          );
                          if (a && choice)
                            setPlacing({
                              reservationId: a.id,
                              plate: a.plate,
                              choice,
                            });
                          setChoosing(null);
                        }
                      : null
                  }
                />
              ))}
            </div>
          </main>
          <Aside wide>
            <PanelLabel>{tf.arrivals(board.arrivals.length)}</PanelLabel>
            {board.arrivals.length === 0 && (
              <p className="text-sm text-muted-foreground">{tf.noArrival}</p>
            )}
            <ul className="flex flex-col divide-y divide-border">
              {board.arrivals.map((a) => (
                <ArrivalRow
                  key={a.id}
                  arrival={a}
                  focused={focus === a.id}
                  choosing={choosing === a.id}
                  placing={placing?.reservationId === a.id ? placing : null}
                  keys={keys}
                  busy={assign.isPending}
                  onKeys={setKeys}
                  onPlace={(choice) =>
                    setPlacing({ reservationId: a.id, plate: a.plate, choice })
                  }
                  onCancel={() => {
                    setPlacing(null);
                    setKeys("");
                  }}
                  onConfirm={(choice) =>
                    assign.mutate({
                      reservationId: a.id,
                      fileId: choice.fileId,
                      keyHook: keys.trim() || null,
                      plate: a.plate,
                      code: choice.code,
                    })
                  }
                  onChoose={() => setChoosing(choosing === a.id ? null : a.id)}
                  onOpen={() => card.open(a.id)}
                />
              ))}
            </ul>
          </Aside>
        </div>
      </div>
    </>
  );
}

function dayLabel(f: FileView, today: string): string {
  if (f.cars.length === 0)
    return f.plannedDay ? tf.keptFor(shortDay(f.plannedDay)) : tf.freeFile;
  if (!f.day) return "";
  return tf.returnsOf(f.day === today ? fr.planning.today : shortDay(f.day));
}

function FileColumn({
  file,
  date,
  highlight,
  focus,
  onOpen,
  onRemove,
  onPick,
}: {
  file: FileView;
  date: string;
  highlight: boolean;
  focus: string | null;
  onOpen: (id: string) => void;
  onRemove: (car: FileCar) => void;
  onPick: (() => void) | null;
}) {
  const full = file.cars.length >= file.capacity;
  return (
    <section
      data-testid={`file-${file.code}`}
      className={cn(
        "flex flex-col border bg-card",
        file.sound ? "border-border" : "border-bad",
        highlight && onPick && "cursor-pointer ring-2 ring-primary",
        !file.active && "opacity-50",
      )}
      onClick={onPick ?? undefined}
    >
      <header className="flex items-baseline gap-2 border-b border-border px-3 py-2">
        <b className="font-mono text-lg">{file.code}</b>
        <span className="truncate text-xs text-muted-foreground">
          {file.name ?? dayLabel(file, date)}
        </span>
        <span
          className={cn(
            "ml-auto font-mono text-xs",
            full ? "text-bad" : "text-muted-foreground",
          )}
        >
          {file.cars.length}/{file.capacity}
        </span>
      </header>
      <div className="px-3 pt-1 text-[10px] uppercase tracking-[0.5px] text-muted-foreground">
        {tf.aisle}
      </div>
      <ol className="flex flex-col gap-1 px-2 pb-2">
        {file.cars.map((c) => (
          <li
            key={c.id}
            data-reservation={c.id}
            className={cn(
              "group flex items-center gap-2 border px-2 py-1 text-xs",
              c.blockedBy.length
                ? "border-bad bg-bad/10"
                : c.leavesToday
                  ? "border-info bg-info/10"
                  : "border-border",
              focus === c.id && "ring-2 ring-primary",
            )}
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              onClick={() => onOpen(c.id)}
            >
              <Plate value={c.plate} size="sm" />
              <span className="min-w-0 flex-1 truncate">
                <span className="block truncate font-semibold">
                  {c.customerName}
                </span>
                <span className="block font-mono text-muted-foreground">
                  {dateTimeShort(c.returnAt)}
                </span>
                {c.blockedBy.length > 0 && (
                  <span className="flex items-center gap-1 text-bad">
                    <AlertTriangle className="h-3 w-3" />
                    {tf.toTakeOut(c.blockedBy.length)}
                  </span>
                )}
              </span>
            </button>
            <button
              type="button"
              aria-label={`${tf.takeOut} ${c.plate}`}
              className="p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(c);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {Array.from({
          length: Math.max(0, file.capacity - file.cars.length),
        }).map((_, i) => (
          <li
            key={`free-${i}`}
            className="h-6 border border-dashed border-border/70"
          />
        ))}
      </ol>
      <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.5px] text-muted-foreground">
        {tf.back}
      </div>
    </section>
  );
}

function ArrivalRow({
  arrival,
  focused,
  choosing,
  placing,
  keys,
  busy,
  onKeys,
  onPlace,
  onCancel,
  onConfirm,
  onChoose,
  onOpen,
}: {
  arrival: FileArrival;
  focused: boolean;
  choosing: boolean;
  placing: { choice: FileChoice } | null;
  keys: string;
  busy: boolean;
  onKeys: (v: string) => void;
  onPlace: (choice: FileChoice) => void;
  onCancel: () => void;
  onConfirm: (choice: FileChoice) => void;
  onChoose: () => void;
  onOpen: () => void;
}) {
  const best = arrival.suggested;
  return (
    <li
      data-testid={`arrival-${arrival.reference}`}
      data-reservation={arrival.id}
      className={cn("flex flex-col gap-2 py-3", focused && "bg-primary/10")}
    >
      <button
        type="button"
        className="flex items-center gap-2 text-left"
        onClick={onOpen}
      >
        <Plate value={arrival.plate} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {arrival.customerName}
          </span>
          <span className="block font-mono text-xs text-muted-foreground">
            {t.returnOn(dateTimeShort(arrival.returnAt))}
          </span>
        </span>
        {arrival.onSite && (
          <span className="rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-semibold text-ok">
            {fr.status.arrived}
          </span>
        )}
      </button>
      {best ? (
        <p className="text-sm" data-testid="suggested">
          <b className="font-mono text-lime-deep">{best.code}</b>{" "}
          <span className="text-muted-foreground">
            · {best.cars}/{best.capacity} · {reasonOf(best)}
          </span>
        </p>
      ) : (
        <p className="text-sm text-bad">{tf.noFile}</p>
      )}
      {placing ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(placing.choice);
          }}
        >
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs">
            <span className="whitespace-nowrap">{tf.keysPrompt}</span>
            <input
              autoFocus
              value={keys}
              onChange={(e) => onKeys(e.target.value)}
              maxLength={12}
              className="h-8 w-20 border border-border bg-background px-2 font-mono text-sm"
              aria-label={tf.keysPrompt}
            />
          </label>
          <ToolButton
            variant="primary"
            className="min-h-8"
            type="submit"
            disabled={busy}
          >
            <Check className="mr-1 h-4 w-4" />
            {tf.placeIn(placing.choice.code)}
          </ToolButton>
          <ToolButton className="min-h-8" type="button" onClick={onCancel}>
            {tf.cancel}
          </ToolButton>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {best && (
            <ToolButton
              variant="primary"
              className="min-h-8"
              disabled={busy}
              onClick={() => onPlace(best)}
            >
              {tf.placeIn(best.code)}
            </ToolButton>
          )}
          <ToolButton
            className="min-h-8"
            active={choosing}
            aria-pressed={choosing}
            onClick={onChoose}
          >
            {tf.otherFile}
          </ToolButton>
        </div>
      )}
      {choosing && (
        <ul className="flex flex-col gap-1 text-xs">
          {arrival.choices.map((c) => (
            <li key={c.fileId}>
              <button
                type="button"
                className={cn(
                  "w-full border px-2 py-1 text-left hover:bg-accent",
                  c.moves ? "border-bad/50" : "border-border",
                )}
                onClick={() => {
                  onPlace(c);
                  onChoose();
                }}
              >
                {tf.choiceLine(c.code, c.cars, c.capacity, reasonOf(c))}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
