<script setup lang="ts">
import type { DropdownMenuItem, TabsItem } from "@nuxt/ui";
import type { GroupSortMode } from "#shared/types/album";

const { filter, groupSort, stickerEditLocked } = useCollection();

const filterTabItems: TabsItem[] = [
  { label: "Todas", value: "all" },
  { label: "Faltantes", value: "missing" },
  { label: "Repetidas", value: "duplicates" },
];

function setSort(mode: GroupSortMode) {
  groupSort.value = mode;
}

const sortMenuItems = computed<DropdownMenuItem[][]>(() => [
  [{ type: "label", label: "Ordenar equipes" }],
  [
    {
      type: "checkbox",
      label: "Padrão (Álbum)",
      checked: groupSort.value === "default",
      onUpdateChecked: (v: boolean) => {
        if (v) setSort("default");
      },
    },
    {
      type: "checkbox",
      label: "Alfabética (A-Z)",
      checked: groupSort.value === "alphabetic",
      onUpdateChecked: (v: boolean) => {
        if (v) setSort("alphabetic");
      },
    },
    {
      type: "checkbox",
      label: "Quantidade",
      checked: groupSort.value === "owned",
      onUpdateChecked: (v: boolean) => {
        if (v) setSort("owned");
      },
    },
  ],
]);
</script>

<template>
  <div
    class="flex min-w-0 flex-1 flex-nowrap items-center gap-2 max-sm:overflow-x-auto max-sm:pb-px"
  >
    <UTabs
      v-model="filter"
      color="neutral"
      variant="pill"
      size="sm"
      :content="false"
      :items="filterTabItems"
      class="min-w-0 shrink"
      :ui="{ root: 'min-w-0 shrink', list: 'min-w-0 flex-nowrap' }"
    />
    <div class="ms-auto flex shrink-0 items-center gap-1.5">
      <UButton
        size="sm"
        square
        :color="stickerEditLocked ? 'warning' : 'neutral'"
        :variant="stickerEditLocked ? 'solid' : 'outline'"
        :icon="stickerEditLocked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
        :aria-pressed="stickerEditLocked"
        :aria-label="
          stickerEditLocked
            ? 'Desbloquear edição das figurinhas'
            : 'Travar edição das figurinhas'
        "
        @click="stickerEditLocked = !stickerEditLocked"
      />
      <UDropdownMenu :items="sortMenuItems" :content="{ align: 'end' }">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          square
          icon="i-lucide-arrow-up-down"
          aria-label="Ordenação das equipes"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
