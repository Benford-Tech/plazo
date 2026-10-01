import type { ComponentProps, ReactNode } from "react";
import { errorMessage } from "@/i18n/fr";

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {title && <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({
  label,
  name,
  error,
  help,
  ...input
}: { label: string; name: string; error?: string; help?: string } & ComponentProps<"input">) {
  const id = `field-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30 aria-[invalid=true]:border-red-500"
        {...input}
      />
      {help && !error && <p className="text-sm text-slate-500">{help}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {errorMessage(error)}
        </p>
      )}
    </div>
  );
}

export function Button({ variant = "primary", className = "", ...props }: { variant?: "primary" | "secondary" | "danger" } & ComponentProps<"button">) {
  const styles = {
    primary: "bg-sky-700 text-white hover:bg-sky-800",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-base font-medium disabled:opacity-60 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}
