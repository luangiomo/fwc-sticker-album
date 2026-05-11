/**
 * `min-width: 1024px`, aligned with Tailwind `lg`.
 * Stays `false` during SSR and the hydration pass, then syncs to `matchMedia` after mount
 * so layout gated on this ref does not mismatch Nuxt SSR HTML (@nuxt/hints hydration).
 */
export function useLgUp() {
  const matches = ref(false);

  onMounted(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    matches.value = mql.matches;
    const onChange = () => {
      matches.value = mql.matches;
    };
    mql.addEventListener("change", onChange);
    onUnmounted(() => mql.removeEventListener("change", onChange));
  });

  return computed(() => matches.value);
}
