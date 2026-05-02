<script setup lang="ts">
const { filter } = useCollection();

const filters: { label: string; value: FilterMode }[] = [
  { label: "Todas", value: "all" },
  { label: "Faltantes", value: "missing" },
  { label: "Repetidas", value: "duplicates" },
];
</script>

<template>
  <div class="grid grid-cols-3 py-2">
    <UFieldGroup size="sm">
      <UButton
        v-for="f in filters"
        :key="f.value"
        color="neutral"
        :variant="filter === f.value ? 'solid' : 'outline'"
        :label="f.label"
        @click="filter = f.value"
      />
    </UFieldGroup>
  </div>
</template>
