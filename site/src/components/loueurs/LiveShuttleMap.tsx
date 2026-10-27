import { fr } from "@/lib/fr";
import { SHUTTLE_PATH } from "@/lib/shuttle-icon";

const t = fr.proHome;

export type ProMessage = (typeof t.messages)[number];

const toneClass: Record<ProMessage["tone"], string> = {
  info: "bg-[#e8effd] text-[#4338ca]",
  ok: "bg-[#e8f7ec] text-[#15803d]",
  warn: "bg-[#fff4e0] text-[#b45309]",
};

/** One customer's message as the team receives it (« Dupont · J'arrive dans 10 min »). */
export function MessageCard({ message }: { message: ProMessage }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-[12px] border border-pro-line bg-white px-3 py-2.5 text-[13px] text-pro-ink shadow-[0_6px_18px_rgba(15,42,20,0.10)]">
      <span className={`grid size-[30px] place-items-center rounded-[9px] text-[13px] font-extrabold ${toneClass[message.tone]}`}>{message.icon}</span>
      <span className="min-w-0">
        <b className="block truncate text-[13px]">{message.title}</b>
        <span className="block truncate text-[12px] text-pro-soft">{message.text}</span>
      </span>
      <span className="font-mono text-[11.5px] text-pro-soft">{message.at}</span>
    </div>
  );
}

/**
 * The drawn map of Plazo Pro's home page (27/10/2026, choice « A et B »): the parking with its lime halo, the road to
 * Terminal 1, the shuttle driving on it (still when motion is reduced) and the « En direct » pill. A drawing, not map
 * tiles: it shows what the team and the customers see, never how. `hero` adds the driver's pill, the terminal's ETA and
 * two customers' messages over the map.
 */
export function LiveShuttleMap({ variant }: { variant: "hero" | "section" }) {
  const hero = variant === "hero";
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[14px] border border-white/10 bg-[#dfe7d8]">
      <svg viewBox="0 0 420 260" role="img" aria-label={t.map.label} className="block h-auto w-full">
        {/* Fields and a few blocks, for a map feel. */}
        <rect x="18" y="20" width="120" height="70" rx="6" fill="#d2dcc9" />
        <rect x="250" y="170" width="150" height="70" rx="6" fill="#d2dcc9" />
        <rect x="170" y="200" width="56" height="40" rx="4" fill="#cfd6cb" />
        <path d="M20 220 C120 200 170 150 250 120 S380 60 410 40" stroke="#f7f8f5" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M70 205 C140 185 175 150 250 120" stroke="var(--color-lime-deep)" strokeWidth="3.5" fill="none" />
        <path d="M250 120 C310 98 360 70 395 48" stroke="var(--color-lime-deep)" strokeWidth="3.5" fill="none" strokeDasharray="6 6" />
        {/* The parking. */}
        <circle cx="70" cy="205" r="30" fill="var(--color-lime)" opacity=".35" />
        <circle cx="70" cy="205" r="19" fill="var(--color-lime-ink)" stroke="var(--color-lime)" strokeWidth="3" />
        <text x="70" y="211" textAnchor="middle" fontWeight="800" fontSize="16" fill="#fff">
          P
        </text>
        {/* Terminal 1. */}
        <circle cx="395" cy="48" r="15" fill="#fff" stroke="var(--color-pro-line)" />
        <g transform="translate(385 38) scale(0.84)" fill="var(--color-lime-deep)">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </g>
        {hero && (
          <g>
            <rect x="290" y="68" width="112" height="22" rx="11" fill="var(--color-lime)" />
            <text x="346" y="83" textAnchor="middle" fontWeight="700" fontSize="11" fill="var(--color-lime-ink)">
              {t.map.terminal}
            </text>
          </g>
        )}
        {/* The shuttle, on the solid part of the route. */}
        <g className="pro-bus">
          <circle cx="150" cy="168" r="17" fill="#fff" stroke="#16a34a" strokeWidth="3" />
          <g transform="translate(140 158) scale(0.84)" fill="#15803d">
            <path d={SHUTTLE_PATH} />
          </g>
          {hero && (
            <g>
              <rect x="106" y="132" width="88" height="20" rx="10" fill="#fff" />
              <text x="150" y="146" textAnchor="middle" fontWeight="700" fontSize="10.5" fill="var(--color-pro-ink)">
                {t.map.driver}
              </text>
            </g>
          )}
        </g>
      </svg>
      <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-pro-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
        <span className="pro-live-dot" aria-hidden="true" />
        {hero ? t.map.live : t.map.liveSection}
      </span>
      {/* Two customers' messages: over the map from tablets on, under it on phones. */}
      {hero && (
        <div className="flex flex-col gap-1.5 p-2.5 sm:absolute sm:right-0 sm:bottom-0 sm:w-[72%] sm:max-w-[340px]">
          <MessageCard message={t.messages[1]} />
          <MessageCard message={t.messages[3]} />
        </div>
      )}
    </div>
  );
}
