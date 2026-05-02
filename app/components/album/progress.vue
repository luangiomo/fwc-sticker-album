<script setup lang="ts">
const { allStickers } = useAlbum();
const { progress, stats } = useCollection();
</script>

<template>
  <div class="space-y-2 py-4">
    <UProgress v-model="progress" />
    <div class="flex items-center gap-1">
      <span class="text-xs font-regular font-secondary">{{ progress }}%</span>
      <span class="mx-px size-0.5 bg-neutral-700 rounded-full" />
      <span class="text-xs font-regular font-secondary">
        {{ stats.owned }} / {{ allStickers.length }}
      </span>
      <span class="mx-px size-0.5 bg-neutral-700 rounded-full" />
      <span class="text-xs font-regular font-secondary">
        {{ stats.duplicates }} repetidas
      </span>
    </div>
  </div>
</template>
