import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { VARIABLES } from "@/lib/prospecting";
import type { ProspectLanguage, ProspectingSettings, ProspectingStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Modal } from "./Modal";

const t = fr.platform.prospecting;
const LANGUAGES: ProspectLanguage[] = ["fr", "de", "en"];
type Texts = { subject: string; body: string }[];

/**
 * « Modifier les mails »: the three steps (subject, message, delay, on / off) and the daily cap. 13/11/2026: the same mails
 * in German and in English (subject and message only: the French delays and switches are theirs); only a language whose
 * texts were changed is saved, so the others keep following Plazo's own texts.
 */
export function StepsEditor({ settings, onClose }: { settings: ProspectingSettings; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<ProspectingStep[]>(() => settings.steps.map(s => ({ ...s })));
  const [texts, setTexts] = useState<Record<"de" | "en", Texts>>(() => ({
    de: (settings.sequences?.de ?? settings.steps).map(s => ({ subject: s.subject, body: s.body })),
    en: (settings.sequences?.en ?? settings.steps).map(s => ({ subject: s.subject, body: s.body })),
  }));
  const [touched, setTouched] = useState<Set<"de" | "en">>(new Set());
  const [language, setLanguage] = useState<ProspectLanguage>("fr");
  const [cap, setCap] = useState(String(settings.dailyCap));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const change = (n: number, patch: Partial<ProspectingStep>) => setSteps(list => list.map(s => (s.step === n ? { ...s, ...patch } : s)));
  const changeText = (lang: "de" | "en", n: number, patch: Partial<Texts[number]>) => {
    setTexts(all => ({ ...all, [lang]: all[lang].map((s, i) => (i === n - 1 ? { ...s, ...patch } : s)) }));
    setTouched(set => new Set(set).add(lang));
  };
  // The steps shown: the French ones, or their German / English texts on the French delays.
  const shown: ProspectingStep[] = language === "fr" ? steps : steps.map((s, i) => ({ ...s, ...texts[language][i] }));
  const prefix = (n: number, field: string) => (language === "fr" ? `steps.${n}.${field}` : `translations.${language}.${n}.${field}`);
  const errorIn = (lang: ProspectLanguage) =>
    Object.keys(errors).some(k => (lang === "fr" ? k.startsWith("steps.") || k === "dailyCap" : k.startsWith(`translations.${lang}.`)));

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateProspectingSettings({
        steps,
        dailyCap: Number(cap),
        ...(touched.size ? { translations: Object.fromEntries([...touched].map(l => [l, texts[l]])) } : {}),
      }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(["platform", "prospects", "settings"], { data });
      queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
      toast.success(t.saved);
      onClose();
    },
    onError: (err: Error) => {
      setErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      toast.error(describeError(err));
    },
  });
  const test = useMutation({
    mutationFn: (s: ProspectingStep) => adminApi.sendProspectTest({ step: s.step, subject: s.subject, body: s.body, language }),
    onSuccess: ({ sentTo }) => toast.success(t.testSent(sentTo)),
    onError: (err: Error) => toast.error(describeError(err)),
  });

  return (
    <Modal title={t.editorTitle} onClose={onClose} wide>
      <p className="text-sm text-muted-foreground">
        {t.editorHelp} {t.variables} {VARIABLES.join(" ")}
      </p>
      <div role="group" aria-label={t.editorLanguage} className="flex flex-wrap gap-2">
        {LANGUAGES.map(l => (
          <button
            key={l}
            type="button"
            aria-pressed={language === l}
            data-testid={`steps-language-${l}`}
            onClick={() => setLanguage(l)}
            className={cn(
              "min-h-11 rounded-full px-3.5 text-sm",
              language === l ? "bg-lime-deep font-semibold text-white" : "border border-panel-line bg-white hover:bg-panel-2",
              errorIn(l) && language !== l && "border-destructive text-destructive",
            )}
          >
            {t.languages[l]}
          </button>
        ))}
      </div>
      {language !== "fr" && <p className="text-sm text-muted-foreground">{t.editorTranslationNote}</p>}
      <form
        className="space-y-4"
        onSubmit={e => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {shown.map(s => (
          <fieldset key={`${language}-${s.step}`} className="space-y-3 rounded-[12px] border border-panel-line p-4">
            <legend className="px-1 font-bold">
              {t.stepTitle[s.step]}
              {language !== "fr" && s.step > 1 && (
                <span className="ml-2 font-mono text-xs font-normal text-lime-deep">{s.enabled ? t.stepWhen(s.delayDays) : t.stepOff}</span>
              )}
            </legend>
            {language === "fr" && s.step > 1 && (
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#1E5E2E]"
                    checked={s.enabled}
                    onChange={e => change(s.step, { enabled: e.target.checked })}
                  />
                  {t.enabled}
                </label>
                <div className="w-48">
                  <FormField
                    id={`step-${s.step}-delay`}
                    label={t.delay}
                    type="number"
                    min={1}
                    max={90}
                    value={String(s.delayDays)}
                    error={errors[`steps.${s.step}.delayDays`]}
                    onChange={e => change(s.step, { delayDays: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
            <FormField
              id={`step-${s.step}-subject`}
              label={t.subject}
              maxLength={150}
              value={s.subject}
              error={errors[prefix(s.step, "subject")]}
              onChange={e => (language === "fr" ? change(s.step, { subject: e.target.value }) : changeText(language, s.step, { subject: e.target.value }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor={`step-${s.step}-body`}>{t.body}</Label>
              <textarea
                id={`step-${s.step}-body`}
                className="flex min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                maxLength={5000}
                value={s.body}
                aria-invalid={!!errors[prefix(s.step, "body")]}
                onChange={e => (language === "fr" ? change(s.step, { body: e.target.value }) : changeText(language, s.step, { body: e.target.value }))}
              />
              {errors[prefix(s.step, "body")] && <p className="text-sm text-destructive">{errorMessage(errors[prefix(s.step, "body")])}</p>}
            </div>
            <Button type="button" variant="outline" className="h-11" disabled={test.isPending || !settings.configured} onClick={() => test.mutate(s)}>
              {t.testStep}
            </Button>
          </fieldset>
        ))}
        <div className="w-56">
          <FormField id="prospect-cap" label={t.dailyCap} type="number" min={1} max={300} value={cap} error={errors.dailyCap} onChange={e => setCap(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" className="h-11" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" className="h-11" disabled={save.isPending}>
            {t.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
