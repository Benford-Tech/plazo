import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import type { ChannelSet, NotificationChannels, NotificationEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BrowserPushState, browserPushState, disableBrowserPush, enableBrowserPush } from "@/lib/web-push";

const t = fr.notifChannels;
export const CHANNELS_KEY = ["notifications", "channels"] as const;

const GROUPS: { key: keyof typeof t.groups; events: NotificationEvent[] }[] = [
  { key: "bookings", events: ["booking_new", "booking_change", "inbox", "whatsapp", "extra"] },
  { key: "clients", events: ["arrival", "return", "shuttle", "valet"] },
  { key: "team", events: ["team", "platform"] },
];

const date = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * « Mes notifications » (02/11/2026): per event, the phone, this browser and the bell; the browser of the pro space
 * switched on here; the member's devices and a test notification.
 */
export function NotificationChannelsCard() {
  const { user } = useAuth();
  const readOnly = !!user?.demo || !!user?.viewAs;
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: CHANNELS_KEY, queryFn: adminApi.notificationChannels });
  const [browser, setBrowser] = useState<BrowserPushState | null>(null);

  useEffect(() => {
    browserPushState().then(setBrowser, () => setBrowser("unsupported"));
  }, []);

  const save = (data: NotificationChannels) => queryClient.setQueryData(CHANNELS_KEY, data);
  const toggle = useMutation({
    mutationFn: ({ event, channel, value }: { event: NotificationEvent; channel: keyof ChannelSet; value: boolean }) =>
      adminApi.setNotificationChannels({ [event]: { [channel]: value } }),
    onSuccess: (data) => {
      save(data);
      toast.success(t.saved);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const bookings = useMutation({
    mutationFn: (value: "immediate" | "hourly" | "never") => adminApi.setBookingNotify(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_KEY });
      toast.success(t.saved);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const turnOn = useMutation({
    mutationFn: () => enableBrowserPush(query.data?.webPush.publicKey ?? ""),
    onSuccess: (data) => {
      save(data);
      setBrowser("on");
      toast.success(t.enabled);
    },
    onError: (err: Error) => {
      if (err.message === "denied") setBrowser("denied");
      else if (err.message !== "dismissed") toast.error(describeError(err));
    },
  });
  const turnOff = useMutation({
    mutationFn: disableBrowserPush,
    onSuccess: (data) => {
      if (data) save(data);
      setBrowser("off");
      toast.success(t.disabled);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const test = useMutation({
    mutationFn: adminApi.testNotification,
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["bell"] });
      toast.success(t.testSent(r));
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const data = query.data;
  return (
    <Card id="notifications">
      <CardContent className="space-y-4 pt-5">
        <div className="space-y-1">
          <p className="text-base font-semibold">{t.title}</p>
          {data && <p className="text-sm text-muted-foreground">{t.intro(t.roles[data.role])}</p>}
          {readOnly && <p className="text-sm text-muted-foreground">{t.readOnly}</p>}
        </div>
        {query.isLoading ? (
          <Skeleton className="h-40" />
        ) : query.error || !data ? (
          <p className="text-destructive">{describeError(query.error)}</p>
        ) : (
          <>
            <BrowserBanner
              state={browser}
              available={data.webPush.available}
              busy={turnOn.isPending || turnOff.isPending}
              readOnly={readOnly}
              onEnable={() => turnOn.mutate()}
              onDisable={() => turnOff.mutate()}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm" data-testid="channels-table">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2 pr-2 font-medium">
                      &nbsp;
                    </th>
                    {(["phone", "browser", "bell"] as const).map((c) => (
                      <th key={c} scope="col" className="w-28 py-2 text-center font-medium">
                        {t.columns[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                {GROUPS.map((group) => {
                  const events = group.events.filter((e) => data.channels[e]);
                  if (!events.length) return null;
                  return (
                    <tbody key={group.key}>
                      <tr>
                        <th colSpan={4} scope="colgroup" className="pb-1 pt-4 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-lime-deep">
                          {t.groups[group.key]}
                        </th>
                      </tr>
                      {events.map((event) => {
                        const set = data.channels[event]!;
                        const [label, hint] = t.events[event];
                        return (
                          <tr key={event} className="border-t border-panel-line" data-testid={`channels-${event}`}>
                            <th scope="row" className="py-2.5 pr-2 text-left font-normal">
                              <span className="block font-semibold">{label}</span>
                              {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                            </th>
                            <td className="text-center">
                              {event === "booking_new" ? (
                                <select
                                  aria-label={`${label} · ${t.columns.phone}`}
                                  value={data.bookings}
                                  disabled={readOnly || bookings.isPending}
                                  onChange={(e) => bookings.mutate(e.target.value as "immediate" | "hourly" | "never")}
                                  className="h-9 rounded-full border border-panel-line bg-white px-2 text-xs"
                                >
                                  {(["immediate", "hourly", "never"] as const).map((v) => (
                                    <option key={v} value={v}>
                                      {t.bookings[v]}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Check label={`${label} · ${t.columns.phone}`} on={set.phone} disabled={readOnly} onChange={(v) => toggle.mutate({ event, channel: "phone", value: v })} />
                              )}
                            </td>
                            <td className="text-center">
                              <Check
                                label={`${label} · ${t.columns.browser}`}
                                on={set.browser}
                                disabled={readOnly || !data.webPush.available}
                                onChange={(v) => toggle.mutate({ event, channel: "browser", value: v })}
                              />
                            </td>
                            <td className="text-center">
                              <Check label={`${label} · ${t.columns.bell}`} on={set.bell} disabled={readOnly} onChange={(v) => toggle.mutate({ event, channel: "bell", value: v })} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}
              </table>
            </div>
            <div className="space-y-2 border-t border-panel-line pt-4">
              <p className="text-sm font-semibold">{t.devices}</p>
              {data.devices.phones.length === 0 && data.devices.browsers.length === 0 && <p className="text-sm text-muted-foreground">{t.noDevice}</p>}
              <ul className="space-y-1 text-sm" data-testid="channels-devices">
                {data.devices.phones.map((p, i) => (
                  <li key={`p${i}`} className="flex justify-between gap-3">
                    <span>{t.phone(p.platform)}</span>
                    <span className="text-muted-foreground">{t.since(date(p.updatedAt))}</span>
                  </li>
                ))}
                {data.devices.browsers.map((b) => (
                  <li key={b.id} className="flex justify-between gap-3">
                    <span>{b.label ?? t.columns.browser}</span>
                    <span className="text-muted-foreground">{b.lastSentAt ? t.lastSent(date(b.lastSentAt)) : t.since(date(b.createdAt))}</span>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="outline" disabled={readOnly || test.isPending} onClick={() => test.mutate()}>
                {t.test}
              </Button>
              <p className="text-xs text-muted-foreground">{t.testHelp}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Check({ label, on, disabled, onChange }: { label: string; on: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={on}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="size-5 cursor-pointer accent-[#1E5E2E] disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function BrowserBanner(props: {
  state: BrowserPushState | null;
  available: boolean;
  busy: boolean;
  readOnly: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  const { state, available } = props;
  if (!state) return null;
  const text = !available
    ? t.browserUnavailable
    : state === "unsupported"
      ? t.browserUnsupported
      : state === "denied"
        ? t.browserDenied
        : state === "on"
          ? t.browserOn
          : t.browserOff;
  const tone = state === "on" && available ? "bg-ok-soft" : "bg-warn-soft";
  return (
    <div data-testid="browser-push" className={cn("flex flex-wrap items-center gap-3 rounded-xl px-3.5 py-3 text-sm", tone)}>
      <span className="min-w-0 flex-1">{text}</span>
      {available && state === "off" && (
        <Button type="button" disabled={props.busy || props.readOnly} onClick={props.onEnable}>
          {t.enable}
        </Button>
      )}
      {available && state === "on" && (
        <Button type="button" variant="outline" disabled={props.busy || props.readOnly} onClick={props.onDisable}>
          {t.disable}
        </Button>
      )}
    </div>
  );
}
