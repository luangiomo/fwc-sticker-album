<script setup lang="ts">
const { allStickers } = useAlbum();
const { progress, stats } = useCollection();
</script>

<template>
  <div class="space-y-2 py-3 max-lg:space-y-2 max-lg:py-3 lg:space-y-2 lg:py-4">
    <UProgress v-model="progress" />
    <div class="flex flex-wrap items-center gap-2 text-xs max-lg:gap-1.5">
      <span class="text-xs font-regular font-secondary">{{ progress }}%</span>
      <span class="mx-px size-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
      <span class="text-xs font-regular font-secondary">
        {{ stats.owned }} / {{ allStickers.length }}
      </span>
      <span class="mx-px size-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
      <span class="text-xs font-regular font-secondary">
        {{ stats.duplicates }} repetidas
      </span>
    </div>
  </div>
</template>
