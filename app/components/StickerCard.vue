<script setup lang="ts">
const props = defineProps<{ sticker: Sticker }>();

const isLg = useLgUp();
const stickerLongPress = useMobileStickerLongPress(() => !isLg.value);
const stickerDoubleTap = useStickerDoubleTap();

const { openStickerQuantity } = useStickerQuantityModal();

const { getCount, decrement } = useCollection();

const count = computed(() => getCount(props.sticker.code));
const owned = computed(() => count.value >= 1);

function onCardClick() {
  if (isLg.value) return;
  if (stickerDoubleTap.recordTap(props.sticker)) {
    openStickerQuantity(props.sticker);
  }
}

function onCardDblClick() {
  stickerDoubleTap.reset();
  openStickerQuantity(props.sticker);
}

function onPointerDown(e: PointerEvent) {
  stickerLongPress.pointerDown(e, () => {
    decrement(props.sticker.code);
  });
}

function onPointerUp(e: PointerEvent) {
  stickerLongPress.pointerUp(e);
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
  <div class="inline-block">
    <button
      type="button"
      @click="onCardClick"
      @dblclick.prevent.stop="onCardDblClick"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="stickerLongPress.pointerCancel()"
      @contextmenu.prevent="onCardContextMenu"
      class="cursor-pointer"
    >
      <div
        :class="[
          'relative px-2 py-3 rounded-full',
          owned
            ? 'bg-green-600 text-white dark:bg-green-600 dark:text-white'
            : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
        ]"
      >
        <div class="text-xs font-medium uppercase tracking-wide">
          {{ sticker.name }}
        </div>
        <AlbumDuplicateExtrasBadge
          v-if="count > 1"
          position-class="right-0 top-0 translate-x-1 -translate-y-1"
          :count="count"
          :title="`${count} na coleção`"
        />
      </div>
    </button>
  </div>
</template>
