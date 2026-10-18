import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";

/** A dialog of the Prospection page: white card on a dimmed page, Escape closes, scrolls inside on a small screen. */
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cn("w-full space-y-4 rounded-[14px] border border-panel-line bg-white p-5", wide ? "max-w-3xl" : "max-w-lg")}
      >
        <h2 id={id} className="text-lg font-bold text-lime-deep">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
