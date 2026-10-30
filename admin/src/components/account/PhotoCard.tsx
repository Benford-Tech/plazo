import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

const t = fr.photo;
/** The cropping square on screen, and the square sent (512 px JPEG, ~100 KB). */
const VIEW = 260;
const OUTPUT = 512;

function photoError(err: unknown): string {
  const field = err instanceof ApiError ? err.fields?.photo : undefined;
  return (field && t.errors[field]) || describeError(err, t.errors);
}

/** The image under the round window: its scale and top-left corner, kept so that it always covers the window. */
interface Frame {
  zoom: number;
  x: number;
  y: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export function clampFrame(frame: Frame, width: number, height: number): Frame {
  const scale = Math.max(VIEW / width, VIEW / height) * frame.zoom;
  const clamp = (v: number, size: number) => Math.min(0, Math.max(VIEW - size * scale, v));
  return { zoom: frame.zoom, x: clamp(frame.x, width), y: clamp(frame.y, height) };
}

function Cropper({ image, onCancel, onSave, saving }: { image: HTMLImageElement; onCancel: () => void; onSave: (blob: Blob) => void; saving: boolean }) {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const base = Math.max(VIEW / w, VIEW / h);
  const [frame, setFrame] = useState<Frame>(() =>
    clampFrame({ zoom: 1, x: (VIEW - w * base) / 2, y: (VIEW - h * base) / 2 }, w, h),
  );
  const drag = useRef<{ x: number; y: number; frame: Frame } | null>(null);
  const scale = base * frame.zoom;

  const setZoom = (zoom: number) =>
    setFrame((f) => {
      // Zoom around the window's centre.
      const k = zoom / f.zoom;
      return clampFrame({ zoom, x: VIEW / 2 - (VIEW / 2 - f.x) * k, y: VIEW / 2 - (VIEW / 2 - f.y) * k }, w, h);
    });
  const down = (e: ReactPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, frame };
  };
  const move = (e: ReactPointerEvent) => {
    const start = drag.current;
    if (!start) return;
    setFrame(clampFrame({ ...start.frame, x: start.frame.x + e.clientX - start.x, y: start.frame.y + e.clientY - start.y }, w, h));
  };
  const save = () => {
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, -frame.x / scale, -frame.y / scale, VIEW / scale, VIEW / scale, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob((blob) => blob && onSave(blob), "image/jpeg", 0.88);
  };

  return (
    <div className="flex flex-col gap-4" data-testid="photo-cropper">
      <p className="text-sm font-semibold">{t.cropTitle}</p>
      <div
        className="relative cursor-grab touch-none select-none overflow-hidden rounded-xl bg-panel-2 active:cursor-grabbing"
        style={{ width: VIEW, height: VIEW, maxWidth: "100%" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <img
          src={image.src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
          style={{ width: w * scale, height: h * scale, transform: `translate(${frame.x}px, ${frame.y}px)` }}
        />
        {/* The round window: what is kept. */}
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.45)]" />
      </div>
      <p className="text-sm text-muted-foreground">{t.cropHint}</p>
      <label className="flex items-center gap-3 text-sm" htmlFor="photo-zoom">
        {t.zoom}
        <input
          id="photo-zoom"
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={frame.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-44 accent-lime-deep"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={saving} data-testid="photo-save">
          {t.save}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          {t.cancel}
        </Button>
      </div>
    </div>
  );
}

/**
 * « Ma photo » (30/10/2026, « pouvoir mettre sa photo »): choose an image, frame it in the round window, save it as a
 * 512 px square; or remove it. Seen by the team (menu, Équipe). Read-only in the demo.
 */
export function PhotoCard() {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const { hash } = useLocation();
  const card = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // « Changer ma photo » of the menu lands here.
  useEffect(() => {
    if (hash === "#photo") card.current?.scrollIntoView?.({ block: "start" });
  }, [hash]);
  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.src);
  }, [image]);

  const done = async (message: string) => {
    await refresh();
    queryClient.invalidateQueries({ queryKey: ["team"] });
    toast.success(message);
  };
  const upload = useMutation({
    mutationFn: (blob: Blob) => adminApi.setMyPhoto(blob),
    onSuccess: async () => {
      setImage(null);
      await done(t.saved);
    },
    onError: (err: Error) => toast.error(photoError(err)),
  });
  const remove = useMutation({
    mutationFn: () => adminApi.removeMyPhoto(),
    onSuccess: () => done(t.removed),
    onError: (err: Error) => toast.error(photoError(err)),
  });

  const pick = (file: File | undefined) => {
    if (!file) return;
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      toast.error(t.unreadable);
    };
    img.src = URL.createObjectURL(file);
  };

  if (!user) return null;
  const readOnly = !!user.demo;
  const has = !!user.photoUpdatedAt;
  return (
    <Card ref={card} id="photo" data-testid="photo-card" className="scroll-mt-6">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{readOnly ? t.errors.demo_read_only : t.intro}</p>
        </div>
        {image ? (
          <Cropper image={image} saving={upload.isPending} onCancel={() => setImage(null)} onSave={(blob) => upload.mutate(blob)} />
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            <Avatar staff={user} size={96} />
            {!readOnly && (
              <div className="flex flex-col gap-2">
                <Button type="button" onClick={() => input.current?.click()} data-testid="photo-choose">
                  {has ? t.change : t.choose}
                </Button>
                {has && (
                  <Button type="button" variant="outline" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="photo-remove">
                    {t.remove}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">{t.hint}</p>
              </div>
            )}
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          data-testid="photo-input"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </CardContent>
    </Card>
  );
}
