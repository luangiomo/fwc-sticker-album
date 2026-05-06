<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { duplicateBadgeCount } from "~/utils/duplicateDisplay";

const props = defineProps<{ sticker: Sticker }>();

const isLg = useMediaQuery("(min-width: 1024px)");
const mobilePress = useMobileTapHoldDecrement(() => !isLg.value);

const { getCount, increment, decrement } = useCollection();

const count = computed(() => getCount(props.sticker.code));
const owned = computed(() => count.value >= 1);
const badgeCount = computed(() => duplicateBadgeCount(count.value));

function onCardClick() {
  if (isLg.value) {
    increment(props.sticker.code);
    return;
  }
  if (mobilePress.consumeSkipFollowingClick()) return;
  increment(props.sticker.code);
}

function onCardContextMenu(e: MouseEvent) {
  if (isLg.value) {
    decrement(props.sticker.code);
    return;
  }
  if (e.button !== 2) return;
  decrement(props.sticker.code);
}
</script>

<template>
  <button
    type="button"
    @click="onCardClick"
    @pointerdown="
      mobilePress.onPointerDown($event, () => decrement(sticker.code))
    "
    @pointerup="
      mobilePress.onPointerUp($event, () => increment(sticker.code))
    "
    @pointercancel="mobilePress.onPointerCancel()"
    @contextmenu.prevent="onCardContextMenu"
    class="cursor-pointer"
  >
    <div
      :class="[
        'relative px-2 py-3 rounded-full',
        owned
          ? 'bg-green-600 text-white dark:bg-green-500'
          : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
        // sticker.variant === 'chromo' && 'bg-amber-500/10',
      ]"
    >
      <div class="text-xs font-medium uppercase tracking-wide">
        {{ sticker.name }}
      </div>
      <span
        v-if="badgeCount > 0"
        class="absolute top-0 right-0 translate-x-1 -translate-y-1 rounded-full bg-neutral-900 px-1 py-0.5 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900"
        :title="`${count} na coleção`"
      >
        +{{ badgeCount }}
      </span>
    </div>
  </button>
</template>
