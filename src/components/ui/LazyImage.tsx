import { useState } from 'react';

/** Lazy, async-decoded image that fades in over a shimmer. Cached images show at once; failed ones disappear so the fallback shows. */
export function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  if (state === 'failed') return null;
  return <img src={src} alt={alt} loading="lazy" decoding="async" data-state={state}
    ref={(image) => { if (state === 'loading' && image?.complete && image.naturalWidth) setState('loaded'); }}
    onLoad={() => setState('loaded')} onError={() => setState('failed')} />;
}
