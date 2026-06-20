import { toPng } from 'html-to-image';

/** Render a DOM node to a PNG and trigger a download. */
export async function downloadNodeAsPng(node: HTMLElement, filename = 'terminal-wrapped.png'): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
