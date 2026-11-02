import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ParkingLogo } from "@/components/ParkingLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

const t = fr.parkingLogo;
/** The square sent: the image fitted whole inside it, on a transparent ground. */
const OUTPUT = 512;

function logoError(err: unknown): string {
  const field = err instanceof ApiError ? err.fields?.logo : undefined;
  return (field && t.errors[field]) || describeError(err, t.errors);
}

/** Fits an image whole into a transparent 512 px square PNG (an SVG is drawn too: the server takes no SVG). */
// eslint-disable-next-line react-refresh/only-export-components
export function squareLogo(image: HTMLImageElement): Promise<Blob | null> {
  const w = image.naturalWidth || OUTPUT;
  const h = image.naturalHeight || OUTPUT;
  const scale = Math.min(OUTPUT / w, OUTPUT / h);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(image, (OUTPUT - w * scale) / 2, (OUTPUT - h * scale) / 2, w * scale, h * scale);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

/**
 * « Logo du parking » (02/11/2026, « pouvoir personnaliser Plazo avec l'icône du parking », direction B): a manager adds,
 * changes or removes the logo shown next to the Plazo Pro sign for the team. Preview of the bar. Read-only in the demo.
 */
export function ParkingLogoCard() {
  const { user, refresh } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const upload = useMutation({
    mutationFn: (blob: Blob) => adminApi.setOperatorLogo(blob),
    onSuccess: async () => {
      await refresh();
      toast.success(t.saved);
    },
    onError: (err: Error) => toast.error(logoError(err)),
  });
  const remove = useMutation({
    mutationFn: () => adminApi.removeOperatorLogo(),
    onSuccess: async () => {
      await refresh();
      toast.success(t.removed);
    },
    onError: (err: Error) => toast.error(logoError(err)),
  });

  const pick = (file: File | undefined) => {
    if (!file) return;
    const img = new Image();
    img.onload = async () => {
      const blob = await squareLogo(img);
      URL.revokeObjectURL(img.src);
      if (blob) upload.mutate(blob);
      else toast.error(t.unreadable);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      toast.error(t.unreadable);
    };
    img.src = URL.createObjectURL(file);
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    pick(e.dataTransfer.files?.[0]);
  };

  if (!user) return null;
  const readOnly = !!user.demo;
  const version = user.operatorLogoUpdatedAt ?? null;
  const busy = upload.isPending || remove.isPending;
  return (
    <Card data-testid="parking-logo-card">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{readOnly ? t.errors.demo_read_only : t.intro}</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {version ? (
            <ParkingLogo version={version} name={user.operatorName} size={96} className="rounded-xl ring-1 ring-panel-line" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-panel-line text-center text-xs text-muted-foreground">
              {t.title}
            </span>
          )}
          {!readOnly && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => input.current?.click()} disabled={busy} data-testid="parking-logo-choose">
                  {version ? t.change : t.choose}
                </Button>
                {version && (
                  <Button type="button" variant="outline" onClick={() => remove.mutate()} disabled={busy} data-testid="parking-logo-remove">
                    {t.remove}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t.hint}</p>
            </div>
          )}
        </div>
        {!readOnly && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={drop}
            className={`rounded-xl border-2 border-dashed p-4 text-center text-sm text-muted-foreground ${over ? "border-lime-deep bg-panel-2" : "border-panel-line"}`}
          >
            {t.drop}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-xl border border-panel-line bg-panel-shell px-3 py-2" data-testid="parking-logo-preview">
            <Logo height={24} suffix="Pro" className="shrink-0" />
            {version ? (
              <>
                <span aria-hidden="true" className="h-6 w-px bg-panel-line" />
                <ParkingLogo version={version} name={user.operatorName} size={24} />
                <span className="truncate text-sm font-semibold">{user.operatorName}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{t.none}</span>
            )}
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          data-testid="parking-logo-input"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </CardContent>
    </Card>
  );
}
