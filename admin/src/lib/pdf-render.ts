import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface LoadedPdf {
  numPages: number;
  /** Draws a page at this CSS width; resolves with its height ÷ width. */
  render: (pageIndex: number, canvas: HTMLCanvasElement, cssWidth: number) => Promise<number>;
  destroy: () => void;
}

/**
 * The parking's PDF drawn in the browser (30/10/2026, « Placer les informations »), so the manager places the fields
 * on the page as it prints. Loaded lazily with the editor only.
 */
export async function loadPdf(blob: Blob): Promise<LoadedPdf> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  return {
    numPages: doc.numPages,
    render: async (pageIndex, canvas, cssWidth) => {
      const page = await doc.getPage(pageIndex + 1);
      const base = page.getViewport({ scale: 1 });
      const ratio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: (cssWidth / base.width) * ratio });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${(cssWidth * base.height) / base.width}px`;
      const context = canvas.getContext("2d");
      if (context) await page.render({ canvasContext: context, viewport }).promise;
      return base.height / base.width;
    },
    destroy: () => void doc.destroy(),
  };
}
