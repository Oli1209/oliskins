import { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Transforms GitHub blob URLs to raw.githubusercontent.com equivalents.
 * https://github.com/user/repo/blob/branch/path → https://raw.githubusercontent.com/user/repo/branch/path
 */
function toRawUrl(src: string): string {
  return src.replace(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/,
    "https://raw.githubusercontent.com/$1/$2/$3"
  );
}

interface CaseImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string;
}

/**
 * Drop-in replacement for <img> when rendering case images.
 *
 * - Transforms GitHub blob URLs to raw.githubusercontent.com automatically.
 * - Falls back to a clean "Brak obrazka" placeholder when src is empty or fails.
 * - Guards against infinite error loops (only replaces src once per url).
 * - Resets automatically when the src prop changes (editor live-preview).
 * - Adds loading="lazy" + referrerPolicy="no-referrer" by default.
 */
export function CaseImg({ src, className, alt, ...rest }: CaseImgProps) {
  const [trackedSrc, setTrackedSrc] = useState<string | undefined>(src);
  const [errored, setErrored] = useState(false);

  if (trackedSrc !== src) {
    setTrackedSrc(src);
    setErrored(false);
  }

  const isEmpty = !src || !src.trim();
  const showFallback = isEmpty || errored;
  const effectiveSrc = isEmpty ? "" : toRawUrl(src.trim());

  if (showFallback) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-slate-950/60 ${className ?? ""}`}>
        <ImageOff className="w-8 h-8 text-slate-700" strokeWidth={1.5} />
        <span className="text-[11px] text-slate-600 font-medium tracking-wide">Brak obrazka</span>
      </div>
    );
  }

  return (
    <img
      {...rest}
      src={effectiveSrc}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (!errored) setErrored(true);
      }}
    />
  );
}
