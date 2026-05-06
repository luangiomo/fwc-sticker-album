<script setup lang="ts">
import type { FilterMode, GroupSortMode } from "#shared/types/album";

const { filter, groupSort } = useCollection();

const filters: { label: string; value: FilterMode }[] = [
  { label: "Todas", value: "all" },
  { label: "Faltantes", value: "missing" },
];

type SortModeItem = {
  value: GroupSortMode;
  label?: string;
  icon?: string;
  ariaLabel?: string;
};

const sortModes: SortModeItem[] = [
  { label: "Padrão", value: "default" },
  { label: "A-Z", value: "alphabetic" },
  {
    value: "owned",
    icon: "i-lucide-arrow-down-wide-narrow",
    ariaLabel: "Ordenar pelo que mais tenho",
  },
];
</script>

<template>
  <div
    class="flex flex-wrap gap-2 py-2 max-lg:gap-2 lg:gap-2 lg:py-2 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1"
  >
    <UFieldGroup size="sm" class="max-sm:shrink-0">
      <UButton
        v-for="f in filters"
        :key="f.value"
        color="neutral"
        :variant="filter === f.value ? 'solid' : 'outline'"
        :label="f.label"
        @click="filter = f.value"
      />
    </UFieldGroup>
    <UFieldGroup size="sm" class="max-sm:shrink-0">
      <UButton
        v-for="s in sortModes"
        :key="s.value"
        color="neutral"
        :variant="groupSort === s.value ? 'solid' : 'outline'"
        :label="s.label"
        :icon="s.icon"
        :aria-label="s.ariaLabel"
        @click="groupSort = s.value"
      />
    </UFieldGroup>
  </div>
</template>
