<script setup lang="ts">
import type { Group, Sticker } from "#shared/types/album";
import { groupSpriteStyle } from "~/utils/groupSpriteStyle";

const open = defineModel<boolean>("open", { default: false });

const { groups } = useAlbum();
const { getCount } = useCollection();

const duplicateRows = computed(() => {
  const out: { group: Group; dupStickers: Sticker[] }[] = [];
  for (const g of groups) {
    const dupStickers = g.stickers.filter((s) => getCount(s.code) > 1);
    if (dupStickers.length) out.push({ group: g, dupStickers });
  }
  return out;
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Figurinhas repetidas"
    description="Por equipa — só figurinhas com mais de uma cópia na coleção."
    :ui="{ content: 'w-[calc(100vw-1.5rem)] max-w-lg max-h-[min(90vh,40rem)] flex flex-col' }"
  >
    <template #body>
      <div
        v-if="duplicateRows.length === 0"
        class="text-sm text-muted"
      >
        Nenhuma figurinha repetida.
      </div>
      <div
        v-else
        class="max-h-[min(65vh,28rem)] space-y-5 overflow-y-auto pr-1 -mr-1"
      >
        <section
          v-for="row in duplicateRows"
          :key="row.group.id"
          class="border-b border-neutral-200 pb-4 last:border-0 last:pb-0 dark:border-neutral-800"
        >
          <div class="flex items-start gap-3">
            <div
              class="shrink-0 rounded-md border border-neutral-200 bg-cover bg-center dark:border-neutral-700"
              :style="groupSpriteStyle(row.group)"
            />
            <div class="min-w-0 flex-1">
              <p class="text-[11px] font-medium text-muted">
                {{ row.group.slug }}
              </p>
              <p class="truncate text-sm font-medium leading-snug">
                {{ row.group.name }}
              </p>
            </div>
          </div>
          <ul
            class="mt-3 flex flex-wrap gap-1.5"
            aria-label="Figurinhas repetidas desta equipa"
          >
            <li
              v-for="s in row.dupStickers"
              :key="s.id"
              class="rounded-md bg-neutral-100 px-2 py-1 text-xs tabular-nums text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
            >
              {{ s.name }}
            </li>
          </ul>
        </section>
      </div>
    </template>
  </UModal>
</template>
