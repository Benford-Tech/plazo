/** A number plate drawn as a French plate: blue "F" band, white background, dark border, 5 px corners. */
export function Plate({ plate, size = "md" }: { plate: string; size?: "sm" | "md" }) {
  const small = size === "sm";
  return (
    <span
      className={`inline-flex items-stretch overflow-hidden rounded-[5px] border-[1.5px] border-plate-ink bg-white align-middle ${small ? "h-7" : "h-8"}`}
    >
      <span aria-hidden="true" className="flex w-[15px] items-end justify-center bg-plate-blue pb-[3px] text-[8.5px] leading-none font-bold text-white">
        F
      </span>
      <span
        className={`flex items-center px-2 font-extrabold tracking-[.06em] whitespace-nowrap text-plate-ink tabular-nums ${small ? "text-[14px]" : "text-[16px]"}`}
      >
        {plate}
      </span>
    </span>
  );
}
