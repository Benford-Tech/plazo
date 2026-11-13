import type { Dict } from "../../fr-dict";
import { fr } from "../../fr-dict";
import type { Locale } from "../locales";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { pl } from "./pl";
import { pt } from "./pt";
import { ro } from "./ro";
import { ru } from "./ru";
import { uk } from "./uk";

/** Every language's texts, for the server (the browser loads only its own: LocaleProvider). */
export const DICTS: Record<Locale, Dict> = { fr, en, de, es, pt, pl, ro, ru, uk };
