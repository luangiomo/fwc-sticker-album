<script setup lang="ts">
const { stats } = useCollection();

const statCards = computed(() => [
  { label: "Preenchidas", value: stats.value.owned },
  { label: "Faltantes", value: stats.value.missing },
  { label: "Repetidas", value: stats.value.duplicates },
]);
</script>

<template>
  <div class="grid grid-cols-3 gap-3 py-4">
    <UCard v-for="card in statCards" :key="card.label" :ui="{ body: 'p-4' }">
      <div class="flex flex-col gap-1">
        <span class="text-xs text-muted">{{ card.label }}</span>
        <span class="text-xl font-semibold tabular-nums tracking-tight">
          {{ card.value }}
        </span>
      </div>
    </UCard>
  </div>
</template>
