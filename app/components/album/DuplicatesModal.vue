<script setup lang="ts">
import type { Group, Sticker } from "#shared/types/album";
import { duplicateExtra } from "~/utils/duplicateDisplay";
import { groupSpriteStyle } from "~/utils/groupSpriteStyle";

const open = defineModel<boolean>("open", { default: false });

type DupGroupSortMode = "default" | "alphabetic" | "mostDuplicates";

const dupGroupSort = ref<DupGroupSortMode>("default");

const sortOptions: { label: string; value: DupGroupSortMode }[] = [
  { label: "Padrão", value: "default" },
  { label: "A-Z", value: "alphabetic" },
  { label: "Mais repetidas", value: "mostDuplicates" },
];

const { groups } = useAlbum();
const { getCount, stats } = useCollection();

function extrasInGroup(dupStickers: Sticker[]) {
  return dupStickers.reduce(
    (acc, s) => acc + duplicateExtra(getCount(s.code)),
    0
  );
}

/** Ordem do álbum (número da figurinha), não ordem lexicográfica do texto "9" vs "11". */
function sortDupStickers(stickers: Sticker[]) {
  return [...stickers].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return a.code.localeCompare(b.code);
  });
}

const duplicateRows = computed(() => {
  const rows: { group: Group; dupStickers: Sticker[] }[] = [];
  for (const g of groups) {
    const rawDup = g.stickers.filter((s) => getCount(s.code) > 1);
    if (rawDup.length) {
      rows.push({ group: g, dupStickers: sortDupStickers(rawDup) });
    }
  }

  const mode = dupGroupSort.value;
  if (mode === "default") return rows;

  const copy = [...rows];
  if (mode === "alphabetic") {
    copy.sort((a, b) =>
      a.group.slug.localeCompare(b.group.slug, "pt", { sensitivity: "base" })
    );
  } else {
    copy.sort((a, b) => {
      const wa = extrasInGroup(a.dupStickers);
      const wb = extrasInGroup(b.dupStickers);
      if (wb !== wa) return wb - wa;
      return a.group.slug.localeCompare(b.group.slug, "pt", {
        sensitivity: "base",
      });
    });
  }
  return copy;
});

/** Uma célula por cópia repetida (ex.: 5 na coleção → 4 repetidas, não 5). */
function expandedDuplicateCells(dupStickers: Sticker[]) {
  const cells: { key: string; sticker: Sticker }[] = [];
  for (const s of dupStickers) {
    const extras = duplicateExtra(getCount(s.code));
    for (let i = 0; i < extras; i++) {
      cells.push({ key: `${s.code}-${i}`, sticker: s });
    }
  }
  return cells;
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Figurinhas repetidas (${stats.duplicates})`"
    :ui="{
      content:
        'w-[calc(100vw-1.5rem)] max-w-xl max-h-[min(90vh,44rem)] flex flex-col',
    }"
  >
    <template #body>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <!-- <span class="text-[11px] text-muted">Ordenar equipas</span> -->
        <UFieldGroup size="sm" class="min-w-0 flex-1">
          <UButton
            v-for="opt in sortOptions"
            :key="opt.value"
            color="neutral"
            :variant="dupGroupSort === opt.value ? 'solid' : 'outline'"
            :label="opt.label"
            @click="dupGroupSort = opt.value"
          />
        </UFieldGroup>
      </div>

      <div v-if="duplicateRows.length === 0" class="text-sm text-muted">
        Nenhuma figurinha repetida.
      </div>
      <div
        v-else
        class="max-h-[min(62vh,34rem)] space-y-6 overflow-y-auto overflow-x-hidden pr-1 -mr-1"
      >
        <div
          v-for="row in duplicateRows"
          :key="row.group.id"
          class="border-t border-neutral-200 pt-6 first:border-t-0 first:pt-0 dark:border-neutral-800"
        >
          <div class="flex w-full items-center gap-3">
            <div
              class="rounded-md shrink-0 border border-neutral-200 dark:border-neutral-700"
              :style="groupSpriteStyle(row.group)"
            />
            <div class="min-w-0 flex-1 pt-0.5">
              <h3 class="min-w-0 truncate text-sm font-medium leading-tight">
                {{ row.group.name }} ({{ row.group.slug }})
              </h3>
              <p class="mt-0.5 text-xs text-muted tabular-nums">
                {{ extrasInGroup(row.dupStickers) }} repetidas
              </p>
            </div>
          </div>

          <div
            class="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 max-lg:gap-1.5 lg:gap-1.5"
          >
            <div
              v-for="cell in expandedDuplicateCells(row.dupStickers)"
              :key="cell.key"
              class="relative flex min-h-11 cursor-default items-center justify-center overflow-visible rounded-md px-0.5 text-xs leading-none lg:h-9 lg:min-h-0 lg:rounded-sm bg-blue-600 text-white dark:bg-blue-500 dark:text-blue-50"
            >
              <span class="px-0.5">{{ cell.sticker.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
