<script setup lang="ts">
const { allStickers } = useAlbum();
const { progress, stats } = useCollection();
</script>

<template>
  <div
    class="flex min-w-0 flex-nowrap items-center gap-2 py-2 lg:gap-3 lg:py-4"
    role="group"
    aria-label="Progresso da coleção"
  >
    <span
      class="shrink-0 tabular-nums text-xs leading-none font-secondary text-muted"
    >
      {{ stats.owned }}/{{ allStickers.length }}
    </span>
    <UProgress :model-value="progress" />
    <span
      class="shrink-0 tabular-nums text-xs leading-none font-secondary text-muted"
    >
      {{ progress }}%
    </span>
  </div>
</template>
