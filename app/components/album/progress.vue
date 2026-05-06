<script setup lang="ts">
const { allStickers } = useAlbum();
const { progress, stats } = useCollection();

const duplicatesModalOpen = ref(false);
</script>

<template>
  <div class="space-y-2 py-2 max-lg:space-y-1.5 max-lg:py-2 lg:space-y-2 lg:py-4">
    <UProgress v-model="progress" />
    <div class="flex flex-wrap items-center gap-2 text-xs max-lg:gap-1.5">
      <span class="text-xs font-regular font-secondary">{{ progress }}%</span>
      <span class="mx-px size-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
      <span class="text-xs font-regular font-secondary">
        {{ stats.owned }} / {{ allStickers.length }}
      </span>
      <span class="mx-px size-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-0.5 rounded-sm text-left text-xs font-regular font-secondary outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Ver lista de figurinhas repetidas"
        :aria-expanded="duplicatesModalOpen"
        @click="duplicatesModalOpen = true"
      >
        <span>{{ stats.duplicates }} repetidas</span>
        <UIcon
          name="i-lucide-chevron-down"
          class="size-3.5 shrink-0 opacity-80 transition-transform duration-200"
          :class="{ 'rotate-180': duplicatesModalOpen }"
        />
      </button>
    </div>

    <AlbumDuplicatesModal v-model:open="duplicatesModalOpen" />
  </div>
</template>
