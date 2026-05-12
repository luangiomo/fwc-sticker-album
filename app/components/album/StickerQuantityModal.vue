<script setup lang="ts">
const {
  stickerQuantityModalOpen,
  stickerQuantityModalSticker,
  closeStickerQuantity,
} = useStickerQuantityModal();

const sticker = computed(() => stickerQuantityModalSticker.value);

const { getCount, increment, decrement, stickerEditLocked } = useCollection();

const qty = computed(() =>
  sticker.value ? getCount(sticker.value.code) : 0,
);

const locked = computed(() => stickerEditLocked.value);

function resetStickerAfterClose() {
  if (!stickerQuantityModalOpen.value) {
    stickerQuantityModalSticker.value = null;
  }
}

function bump(delta: 1 | -1) {
  const s = sticker.value;
  if (!s || locked.value) return;
  if (delta > 0) increment(s.code);
  else decrement(s.code);
}
</script>

<template>
  <UModal
    v-model:open="stickerQuantityModalOpen"
    @after:leave="resetStickerAfterClose"
    :ui="{
      overlay: 'z-[100]',
      content:
        'z-[101] w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-neutral-200 shadow-xl dark:border-neutral-800 sm:max-w-sm',
      header: 'hidden',
      body: 'p-0',
    }"
  >
    <template #body>
      <div class="relative px-5 pb-6 pt-3">
        <UButton
          color="neutral"
          variant="ghost"
          square
          size="sm"
          icon="i-lucide-x"
          class="absolute top-2 right-2 z-10 sm:right-3"
          aria-label="Fechar"
          @click="closeStickerQuantity"
        />

        <h2
          class="mx-auto max-w-[16rem] pt-8 text-center text-2xl font-semibold leading-snug tracking-tight text-neutral-950 dark:text-neutral-50 sm:text-[1.65rem] sm:leading-tight"
        >
          {{ sticker?.name ?? "Figurinha" }}
        </h2>
        <p
          v-if="sticker"
          class="mt-2 text-center text-sm tabular-nums text-muted"
        >
          {{ sticker.code }} · {{ sticker.slug }}
        </p>

        <p
          v-if="locked"
          class="mt-4 rounded-md border border-amber-200/90 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
        >
          Álbum travado — desbloqueie nos filtros para alterar quantidades.
        </p>

        <div class="mt-8 flex items-center justify-center gap-5">
          <UButton
            color="neutral"
            variant="outline"
            size="xl"
            square
            icon="i-lucide-minus"
            class="size-12 shrink-0"
            :disabled="locked || !sticker || qty <= 0"
            aria-label="Diminuir quantidade"
            @click="bump(-1)"
          />
          <span
            class="min-w-16 text-center text-4xl font-semibold tabular-nums leading-none tracking-tight text-neutral-900 dark:text-neutral-50"
          >
            {{ qty }}
          </span>
          <UButton
            color="neutral"
            variant="outline"
            size="xl"
            square
            icon="i-lucide-plus"
            class="size-12 shrink-0"
            :disabled="locked || !sticker"
            aria-label="Aumentar quantidade"
            @click="bump(1)"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
