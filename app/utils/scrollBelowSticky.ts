/** Use on the page sticky toolbar so scroll math can subtract its footprint. */
export const STICKY_PAGE_HEADER_SELECTOR = "[data-sticky-page-header]";

const EDGE_PX = 8;

function stickyBottomPx(): number {
  const sticky = document.querySelector(
    STICKY_PAGE_HEADER_SELECTOR,
  ) as HTMLElement | null;
  if (!sticky) return EDGE_PX;
  return sticky.getBoundingClientRect().bottom + EDGE_PX;
}

/** Minimal scroll so the element stays in the viewport below the sticky header. */
export function ensureVisibleBelowSticky(
  el: HTMLElement,
  behavior: ScrollBehavior = "smooth",
) {
  const safeTop = stickyBottomPx();
  const safeBottom = window.innerHeight - EDGE_PX;
  const rect = el.getBoundingClientRect();
  let delta = 0;
  if (rect.top < safeTop) delta = rect.top - safeTop;
  else if (rect.bottom > safeBottom) delta = rect.bottom - safeBottom;
  if (delta !== 0) window.scrollBy({ top: delta, behavior });
}

export function scrollIntoViewBelowSticky(
  el: HTMLElement,
  opts: {
    behavior?: ScrollBehavior;
    block: "start" | "center";
  },
) {
  const behavior = opts.behavior ?? "smooth";
  const topInset = stickyBottomPx();
  const rect = el.getBoundingClientRect();
  const elTop = rect.top + window.scrollY;
  const elH = rect.height;

  let targetY: number;
  if (opts.block === "center") {
    const visibleH = window.innerHeight - topInset;
    targetY = elTop + elH / 2 - topInset - visibleH / 2;
  } else {
    targetY = elTop - topInset;
  }

  window.scrollTo({ top: Math.max(0, targetY), behavior });
}
