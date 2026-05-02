<script setup lang="ts">
import type { FilterMode, GroupSortMode } from "#shared/types/album";

const { filter, groupSort } = useCollection();

const filters: { label: string; value: FilterMode }[] = [
  { label: "Todas", value: "all" },
  { label: "Faltantes", value: "missing" },
  { label: "Repetidas", value: "duplicates" },
];

const sortModes: { label: string; value: GroupSortMode }[] = [
  { label: "Padrão", value: "default" },
  { label: "Mais tenho", value: "owned" },
  { label: "A-Z", value: "alphabetic" },
];
</script>

<template>
  <div class="flex flex-wrap gap-2 py-2 max-lg:gap-2 lg:gap-2 lg:py-2">
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
    <UFieldGroup size="sm">
      <UButton
        v-for="s in sortModes"
        :key="s.value"
        color="neutral"
        :variant="groupSort === s.value ? 'solid' : 'outline'"
        :label="s.label"
        @click="groupSort = s.value"
      />
    </UFieldGroup>
  </div>
</template>
