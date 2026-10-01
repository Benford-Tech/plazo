/** A number plate drawn as a French plate: blue "F" band, white background, dark border. */
export function Plate({ plate, size = "md" }: { plate: string; size?: "sm" | "md" }) {
  const small = size === "sm";
  return (
    <span
      className={`inline-flex items-stretch overflow-hidden rounded-md border-[1.5px] border-ink align-middle ${small ? "h-[30px]" : "h-[34px]"}`}
    >
      <span aria-hidden="true" className="flex w-4 items-end justify-center bg-plate-blue pb-1 text-[10px] font-bold text-white">
        F
      </span>
      <span
        className={`flex items-center bg-white px-2.5 font-extrabold tracking-[.03em] whitespace-nowrap text-plate-ink ${small ? "text-[15px]" : "text-[17px]"}`}
      >
        {plate}
      </span>
    </span>
  );
}
