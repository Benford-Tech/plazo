/// <reference lib="webworker" />
import { estimate, type EstimateInput } from "./estimate";

// Runs the layout search off the main thread: the map stays responsive while it searches.
self.onmessage = (event: MessageEvent<{ id: number; input: EstimateInput }>) => {
  const { id, input } = event.data;
  try {
    self.postMessage({ id, result: estimate(input) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
