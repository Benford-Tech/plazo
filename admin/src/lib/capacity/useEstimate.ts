import { useEffect, useRef, useState } from "react";
import { estimate, type Estimate, type EstimateInput } from "./estimate";

/**
 * Runs the layout search in a Web Worker whenever the inputs change (the latest request wins).
 * Falls back to the main thread where workers are unavailable (tests).
 */
export function useEstimate(input: EstimateInput, enabled: boolean) {
  const [result, setResult] = useState<Estimate | null>(null);
  const [computing, setComputing] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef(0);
  const key = JSON.stringify(input);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (!enabled) return;
    const id = ++requestRef.current;
    const parsed = JSON.parse(key) as EstimateInput;
    setComputing(true);
    setError(null);
    if (typeof Worker === "undefined") {
      try {
        setResult(estimate(parsed));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      setComputing(false);
      return;
    }
    // A new worker per request: a long search for stale inputs is simply dropped.
    workerRef.current?.terminate();
    const worker = new Worker(new URL("./estimate.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ id: number; result?: Estimate; error?: string }>) => {
      if (event.data.id !== requestRef.current) return;
      if (event.data.result) setResult(event.data.result);
      else setError(event.data.error ?? "error");
      setComputing(false);
    };
    worker.onerror = () => {
      if (id !== requestRef.current) return;
      setError("worker");
      setComputing(false);
    };
    worker.postMessage({ id, input: parsed });
  }, [key, enabled]);

  return { result, computing, error };
}
