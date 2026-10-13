import { flushSync } from 'react-dom';

// The poster you click in an overview grows into the poster on the title page, and shrinks back on Back.
// Cards mark themselves with data-poster-key (a stable id) and their artwork with data-poster;
// the title page poster carries the same view-transition-name in CSS.
const NAME = 'title-poster';

type ClickedPoster = { element: HTMLElement; key: string; src: string };
let clicked: ClickedPoster | null = null;
let returnKey = '';

const supported = () => typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Capture-phase click listener: remembers which card's poster was clicked, before the click opens the title. */
export function rememberPosterClick(event: MouseEvent) {
  const card = (event.target as Element | null)?.closest<HTMLElement>('[data-poster-key]');
  const poster = card?.querySelector<HTMLElement>('[data-poster]');
  const image = poster?.querySelector('img');
  clicked = card && poster ? { element: poster, key: card.dataset.posterKey || '', src: image?.currentSrc || image?.src || '' } : null;
}

/** The poster behind the current click, once; null when the title was opened another way. */
export function takeClickedPoster() {
  const poster = clicked;
  clicked = null;
  return poster?.element.isConnected ? poster : null;
}

export function transitionToTitle(poster: ClickedPoster | null, update: () => void) {
  if (!poster || !supported()) { update(); return; }
  returnKey = poster.key;
  poster.element.style.viewTransitionName = NAME;
  const transition = document.startViewTransition(() => flushSync(update));
  transition.finished.finally(() => { poster.element.style.viewTransitionName = ''; });
}

/** Back from a title page: morph into the card it was opened from, when that card is on the page again.
 * afterRender runs once the previous page is on screen (e.g. to restore its scroll), before the target card is looked up. */
export function transitionFromTitle(update: () => void, afterRender: () => void = () => {}) {
  const leavingTitle = document.querySelector('.universal-media-poster');
  const key = returnKey;
  if (!leavingTitle || !key || !supported()) { flushSync(update); afterRender(); return; }
  let target: HTMLElement | null = null;
  const transition = document.startViewTransition(() => {
    flushSync(update);
    afterRender();
    target = document.querySelector<HTMLElement>(`[data-poster-key="${CSS.escape(key)}"] [data-poster]`);
    if (target) target.style.viewTransitionName = NAME;
  });
  transition.finished.finally(() => { if (target) target.style.viewTransitionName = ''; });
}
