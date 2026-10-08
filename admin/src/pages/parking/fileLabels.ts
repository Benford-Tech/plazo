import { shortDay } from "@/lib/datetime";
import { fr } from "@/lib/fr";

/** "Gardée pour sam. 4", "Retours Aujourd'hui", "Libre": what a file is for, from its cars and days. */
export function fileDayLabel(
  f: { cars: number; plannedDay: string | null; day: string | null },
  today: string,
): string {
  const tf = fr.occupation.files;
  if (f.cars === 0)
    return f.plannedDay ? tf.keptFor(shortDay(f.plannedDay)) : tf.freeFile;
  if (!f.day) return "";
  return tf.returnsOf(f.day === today ? fr.planning.today : shortDay(f.day));
}
