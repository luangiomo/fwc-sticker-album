<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Quantidade total na coleção (ex.: 4 cópias → selo mostra 4, não +3). */
    count: number;
    title: string;
    /** Posicionamento sobre a célula (absoluto); padrão canto superior direito da grade. */
    positionClass?: string;
  }>(),
  {
    positionClass: "-right-0.5 -top-0.5",
  }
);
</script>

<template>
  <span
    class="pointer-events-none absolute z-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border border-amber-700/25 bg-amber-300 px-[5px] py-px text-[10px] font-bold tabular-nums leading-none tracking-tight text-amber-950 ring-2 ring-white/95 dark:border-amber-300/35 dark:bg-amber-200 dark:text-amber-950 dark:ring-green-950 lg:min-h-4 lg:min-w-4 lg:text-[9px]"
    :class="positionClass"
    :title="title"
    role="img"
    :aria-label="title"
  >
    {{ count }}
  </span>
</template>
