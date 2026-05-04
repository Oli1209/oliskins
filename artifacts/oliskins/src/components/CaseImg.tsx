import { useState } from "react";

/**
 * Fallback shown when src is empty or fails to load.
 * A minimal dark SVG with a question-mark box — keeps layout intact.
 */
const FALLBACK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 6"><rect width="8" height="6" fill="#0f172a"/><rect x="0.5" y="0.5" width="7" height="5" rx="0.4" fill="none" stroke="#1e293b" stroke-width="0.5"/><text x="4" y="3.3" dominant-baseline="middle" text-anchor="middle" fill="#334155" font-family="sans-serif" font-size="2" font-weight="bold">?</text></svg>'
)}`;

interface CaseImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string;
}

/**
 * Drop-in replacement for <img> when rendering case images.
 *
 * - Falls back to a placeholder SVG when src is empty or fails to load.
 * - Guards against infinite error loops (only replaces src once per url).
 * - Resets automatically when the src prop changes (editor live-preview).
 */
export function CaseImg({ src, ...rest }: CaseImgProps) {
  const [trackedSrc, setTrackedSrc] = useState<string | undefined>(src);
  const [errored, setErrored] = useState(false);

  if (trackedSrc !== src) {
    setTrackedSrc(src);
    setErrored(false);
  }

  const effectiveSrc = !src || !src.trim() || errored ? FALLBACK_SRC : src;

  return (
    <img
      {...rest}
      src={effectiveSrc}
      onError={() => {
        if (!errored) setErrored(true);
      }}
    />
  );
}
