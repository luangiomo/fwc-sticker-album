<script setup lang="ts">
import { scrollIntoViewBelowSticky } from "~/utils/scrollBelowSticky";
import { duplicateExtra } from "~/utils/duplicateDisplay";
import { groupSpriteStyle } from "~/utils/groupSpriteStyle";

const { groups } = useAlbum();
const collection = useCollection();
const {
  filter,
  getCount,
  increment,
  decrement,
  filterStickers,
  groupSort,
  clearCollection,
  clearGroup,
  stats,
} = collection;

/** When true, only group headers are shown (simple view); false = full sticker grid on home. */
const simpleHomeVisualization = collection.simpleHomeVisualization;

/** Reflete stickerEditLocked (banner travado comentado no template; ainda usado p/ desabilitar ações). */
const showLockedBanner = computed({
  get: () => collection.stickerEditLocked.value,
  set: (v: boolean) => {
    collection.stickerEditLocked.value = v;
  },
});

const clearCollectionModalOpen = ref(false);
const clearGroupModalOpen = ref(false);
const clearGroupTarget = ref<Group | null>(null);

const groupDetailOpen = ref(false);
const groupDetailGroup = ref<Group | null>(null);

watch(groupDetailOpen, (open) => {
  if (!open) {
    nextTick(() => {
      groupDetailGroup.value = null;
    });
  }
});

function confirmClearCollection() {
  clearCollection();
  clearCollectionModalOpen.value = false;
}

function openClearGroupConfirm() {
  const g = groupDetailGroup.value;
  if (!g) return;
  clearGroupTarget.value = g;
  clearGroupModalOpen.value = true;
}

function confirmClearGroup() {
  const g = clearGroupTarget.value;
  if (g) clearGroup(g);
  clearGroupModalOpen.value = false;
  clearGroupTarget.value = null;
  groupDetailOpen.value = false;
}

function formatTeamProgress(owned: number, total: number) {
  if (total <= 0) return "0/0 · 0%";
  const pct = Math.round((owned / total) * 100);
  return `${owned}/${total} · ${pct}%`;
}

function groupOwnedProgressLabel(group: Group | null) {
  if (!group) return "";
  const owned = group.stickers.filter((s) => getCount(s.code) >= 1).length;
  return formatTeamProgress(owned, group.stickers.length);
}

function sortDupStickers(stickers: Sticker[]) {
  return [...stickers].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return a.code.localeCompare(b.code);
  });
}

const renderedGroups = computed(() => {
  const rows = groups
    .map((g) => {
      const totalInGroup = g.stickers.length;
      const ownedInGroup = g.stickers.filter(
        (s) => getCount(s.code) >= 1,
      ).length;
      const filtered = filterStickers(g.stickers);
      const gridCells =
        filter.value === "duplicates"
          ? (() => {
              const cells: { key: string; sticker: Sticker }[] = [];
              for (const s of sortDupStickers(filtered)) {
                const extras = duplicateExtra(getCount(s.code));
                for (let i = 0; i < extras; i++) {
                  cells.push({ key: `${s.code}-${i}`, sticker: s });
                }
              }
              return cells;
            })()
          : filtered.map((s) => ({ key: s.id, sticker: s }));

      return {
        ...g,
        stickers: filtered,
        gridCells,
        ownedInGroup,
        totalInGroup,
      };
    })
    .filter((g) => g.gridCells.length > 0);

  if (groupSort.value === "alphabetic") {
    return [...rows].sort((a, b) =>
      a.slug.localeCompare(b.slug, "pt", { sensitivity: "base" }),
    );
  }

  if (groupSort.value === "owned") {
    return [...rows].sort((a, b) => {
      if (b.ownedInGroup !== a.ownedInGroup) {
        return b.ownedInGroup - a.ownedInGroup;
      }
      return a.slug.localeCompare(b.slug, "pt", { sensitivity: "base" });
    });
  }

  if (groupSort.value === "ownedAsc") {
    return [...rows].sort((a, b) => {
      if (a.ownedInGroup !== b.ownedInGroup) {
        return a.ownedInGroup - b.ownedInGroup;
      }
      return a.slug.localeCompare(b.slug, "pt", { sensitivity: "base" });
    });
  }

  const officials: typeof rows = [];
  const nonOfficials: typeof rows = [];
  for (const r of rows) {
    if (r.type === "official") officials.push(r);
    else nonOfficials.push(r);
  }
  return [...officials, ...nonOfficials];
});

/** Em "Padrão (Álbum)", primeira grelha só com grupos official; depois equipas/outros. */
const groupGridSections = computed(() => {
  const list = renderedGroups.value;
  if (groupSort.value !== "default") {
    return [list];
  }
  const officials = list.filter((g) => g.type === "official");
  const others = list.filter((g) => g.type !== "official");
  const sections: (typeof list)[] = [];
  if (officials.length) sections.push(officials);
  if (others.length) sections.push(others);
  return sections.length ? sections : [list];
});

const { openStickerQuantity } = useStickerQuantityModal();

const stickerLongPress = useMobileStickerLongPress(() => true);

const openStickerQuantityModal = (sticker: Sticker) => {
  gridNav.closeStickerFind();
  openStickerQuantity(sticker);
};

const gridNav = useAlbumGridNav(renderedGroups);

const {
  searchOpen,
  stickerFindOpen,
  stickerFindQuery,
  findMatchSummary,
  exitSearchMode,
  enterStickerSearchMode,
  STICKER_FIND_INPUT_ID,
} = gridNav;

const backupPrependMenu = computed(() => [
  [
    {
      label: "Ir para equipe…",
      icon: "i-lucide-navigation",
      onSelect: () => {
        searchOpen.value = true;
      },
    },
  ],
]);

const clearCollectionMenuGroups = computed(() => [
  [
    {
      label: "Limpar coleção",
      icon: "i-lucide-trash-2",
      color: "error" as const,
      disabled: collection.stickerEditLocked.value || stats.value.owned === 0,
      onSelect: () => {
        clearCollectionModalOpen.value = true;
      },
    },
  ],
]);

function openGroupDetail(row: { id: string }) {
  const g = groups.find((x) => x.id === row.id) ?? null;
  if (!g) return;
  groupDetailGroup.value = g;
  groupDetailOpen.value = true;
}

/** Cabeçalho da equipa abre o modal só fora da aba Repetidas. */
function tryOpenGroupDetail(row: { id: string }) {
  if (filter.value === "duplicates") return;
  openGroupDetail(row);
}

/** Figurinhas visíveis no modal da equipa (respeita Todas / Faltantes). */
const groupDetailVisibleStickers = computed(() => {
  const g = groupDetailGroup.value;
  if (!g) return [];
  return filterStickers(g.stickers);
});

function onTeamSelect(groupId: string) {
  nextTick(() => {
    const el = document.getElementById(groupId);
    if (el)
      scrollIntoViewBelowSticky(el, { behavior: "smooth", block: "center" });
  });
}

/** Selo com quantidade total nas células quando há mais de uma cópia. */
function showDuplicateCountLabel(code: string) {
  return getCount(code) > 1;
}

function onStickerCellClick(sticker: Sticker) {
  if (filter.value === "duplicates") {
    decrement(sticker.code, { bypassStickerLock: true });
    return;
  }

  if (getCount(sticker.code) < 1) {
    increment(sticker.code);
    return;
  }
  openStickerQuantityModal(sticker);
}

function onStickerPointerDown(e: PointerEvent, sticker: Sticker) {
  if (filter.value === "duplicates") return;
  stickerLongPress.pointerDown(e, () => {
    decrement(sticker.code);
  });
}

function onStickerPointerUp(e: PointerEvent) {
  if (filter.value === "duplicates") return;
  stickerLongPress.pointerUp(e);
}

function onStickerPointerCancel() {
  stickerLongPress.pointerCancel();
}

function onStickerContextMenu(code: string, e: MouseEvent) {
  const dupBypass =
    filter.value === "duplicates"
      ? { bypassStickerLock: true as const }
      : undefined;
  if (e.button !== 2) return;
  decrement(code, dupBypass);
}

function onGroupDetailStickerClick(sticker: Sticker) {
  if (getCount(sticker.code) < 1) {
    increment(sticker.code);
    return;
  }
  openStickerQuantityModal(sticker);
}

function onGroupDetailPointerDown(e: PointerEvent, sticker: Sticker) {
  stickerLongPress.pointerDown(e, () => {
    decrement(sticker.code);
  });
}

function onGroupDetailPointerUp(e: PointerEvent) {
  stickerLongPress.pointerUp(e);
}

function onGroupDetailPointerCancel() {
  stickerLongPress.pointerCancel();
}

function onGroupDetailStickerContextMenu(sticker: Sticker, e: MouseEvent) {
  if (e.button !== 2) return;
  decrement(sticker.code);
}
</script>

<template>
  <UContainer class="p-0">
    <div
      data-sticky-page-header
      class="sticky top-0 z-20 border-b border-neutral-200/90 bg-neutral-50/95 px-3 py-2 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95 md:px-5 md:pt-4"
    >
      <div class="flex flex-col gap-1.5 max-w-7xl mx-auto">
        <div
          v-if="!stickerFindOpen"
          class="flex w-full min-w-0 items-center gap-2"
        >
          <AlbumFilters class="min-w-0 flex-1" />
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            square
            icon="i-lucide-search"
            aria-label="Buscar figurinha"
            @click="enterStickerSearchMode"
          />
          <AlbumCollectionBackup
            :prepend-items="backupPrependMenu"
            :append-items="clearCollectionMenuGroups"
            class="shrink-0"
          />
        </div>
        <div
          v-else
          data-sticker-find
          class="flex w-full min-w-0 items-center gap-2"
        >
          <UInput
            :id="STICKER_FIND_INPUT_ID"
            v-model="stickerFindQuery"
            placeholder="Código ou nome…"
            autocomplete="off"
            size="sm"
            class="min-w-0 flex-1"
            icon="i-lucide-search"
            aria-label="Buscar figurinha por código ou nome"
            @keydown.enter.prevent
          />
          <span
            class="hidden max-w-28 shrink-0 truncate text-xs text-muted sm:block"
            :title="findMatchSummary"
          >
            {{ findMatchSummary }}
          </span>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            square
            icon="i-lucide-x"
            aria-label="Sair da busca (Esc)"
            @click="exitSearchMode"
          />
        </div>

        <AlbumProgress />
        <p
          v-if="simpleHomeVisualization"
          class="text-[11px] leading-snug text-muted md:text-xs"
        >
          Visualização simples: a grade de figurinhas está oculta aqui. Toque ou
          clique numa equipe para abrir a lista com verde (já tenho) e cinza
          (falta).
        </p>
        <p
          v-if="stickerFindOpen"
          class="text-[11px] leading-snug text-muted md:text-xs"
        >
          Esc encerra a busca · Ctrl/Cmd+Shift+K abre a busca por equipe
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto space-y-6 px-3 pb-4 md:px-5 lg:px-4 lg:pb-8">
      <div
        v-for="(section, si) in groupGridSections"
        :key="si"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-1 gap-x-4 gap-y-6"
        :class="{ 'pt-4': si === 0 }"
      >
        <div
          v-for="item in section"
          :key="item.id"
          :id="item.id"
          class="min-w-0 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-950/40"
        >
          <div class="flex w-full min-w-0 flex-row items-center gap-3">
            <div
              :role="filter === 'duplicates' ? undefined : 'button'"
              :tabindex="filter === 'duplicates' ? -1 : 0"
              class="shrink-0 rounded-sm bg-cover bg-center outline-none"
              :class="
                filter === 'duplicates'
                  ? 'cursor-default'
                  : 'cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary'
              "
              :style="groupSpriteStyle(item)"
              :aria-label="
                filter === 'duplicates'
                  ? `${item.slug}, ${item.name}`
                  : `Ver figurinhas de ${item.name}`
              "
              @click="tryOpenGroupDetail(item)"
              @keydown.enter.prevent="tryOpenGroupDetail(item)"
              @keydown.space.prevent="tryOpenGroupDetail(item)"
            />
            <component
              :is="filter === 'duplicates' ? 'div' : 'button'"
              :type="filter === 'duplicates' ? undefined : 'button'"
              class="flex min-h-0 min-w-0 flex-1 items-center justify-between gap-2 rounded-sm text-left outline-none"
              :class="
                filter === 'duplicates'
                  ? 'cursor-default'
                  : 'cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary'
              "
              :aria-label="
                filter === 'duplicates'
                  ? `${item.slug}, ${item.name}`
                  : `Abrir figurinhas de ${item.name}`
              "
              @click="tryOpenGroupDetail(item)"
            >
              <div class="flex min-w-0 flex-1 items-center gap-1.5">
                <h3 class="min-w-0 truncate text-sm font-medium leading-tight">
                  {{ item.slug }}
                </h3>
                <span
                  class="mx-px size-0.5 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500"
                />
                <h3 class="min-w-0 truncate text-sm font-medium leading-tight">
                  {{ item.name }}
                </h3>
                <template v-if="filter !== 'duplicates'">
                  <span
                    class="mx-px size-0.5 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500"
                  />
                  <span
                    class="shrink-0 tabular-nums text-xs leading-tight text-muted"
                  >
                    {{
                      formatTeamProgress(item.ownedInGroup, item.totalInGroup)
                    }}
                  </span>
                </template>
              </div>
              <UIcon
                v-if="filter !== 'duplicates'"
                name="i-lucide-chevron-right"
                class="size-3.5 shrink-0 text-muted"
              />
            </component>
          </div>
          <div
            v-if="!simpleHomeVisualization"
            class="grid w-full min-w-0 grid-cols-4 gap-1 sm:grid-cols-5"
          >
            <div
              v-for="cell in item.gridCells"
              :key="cell.key"
              :data-sticker-cell-key="cell.key"
              class="relative flex min-h-10 items-center justify-center overflow-visible rounded-md px-0.5 leading-none outline-none transition-colors sm:min-h-11 text-xs"
              :class="[
                filter === 'duplicates'
                  ? [
                      'cursor-pointer bg-blue-600 text-white hover:bg-blue-700 hover:text-white active:scale-95 dark:bg-blue-500 dark:text-blue-50 dark:hover:bg-blue-600 dark:hover:text-blue-50',
                    ]
                  : [
                      getCount(cell.sticker.code) >= 1
                        ? 'cursor-pointer bg-green-600 text-white dark:bg-green-600 dark:text-white'
                        : 'cursor-pointer bg-neutral-200/80 text-neutral-900 dark:bg-neutral-800/90 dark:text-neutral-100',
                    ],
              ]"
              @click="onStickerCellClick(cell.sticker)"
              @pointerdown="onStickerPointerDown($event, cell.sticker)"
              @pointerup="onStickerPointerUp($event)"
              @pointercancel="onStickerPointerCancel()"
              @contextmenu.prevent="
                onStickerContextMenu(cell.sticker.code, $event)
              "
            >
              <span class="leading-none">
                {{ cell.sticker.name }}
              </span>
              <AlbumDuplicateExtrasBadge
                v-if="
                  filter !== 'duplicates' &&
                  showDuplicateCountLabel(cell.sticker.code)
                "
                :count="getCount(cell.sticker.code)"
                :title="`${getCount(cell.sticker.code)} na coleção`"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <AlbumTeamSearch v-model:open="searchOpen" @select="onTeamSelect" />

    <UModal
      v-model:open="groupDetailOpen"
      :ui="{
        content: 'w-[calc(100vw-1.5rem)] max-w-xl max-h-[90vh] flex flex-col',
      }"
    >
      <template #header="{ close }">
        <div class="flex w-full items-center gap-3">
          <div
            v-if="groupDetailGroup"
            class="rounded-md shrink-0 border border-neutral-200 dark:border-neutral-700"
            :style="groupSpriteStyle(groupDetailGroup)"
          />
          <div class="min-w-0 flex-1 pt-0.5">
            <h3 class="min-w-0 truncate text-sm font-medium leading-tight">
              {{ groupDetailGroup?.name }} ({{ groupDetailGroup?.slug }})
            </h3>

            <p class="mt-0.5 text-xs text-muted tabular-nums">
              {{ groupOwnedProgressLabel(groupDetailGroup) }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-0.5">
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              square
              class="shrink-0"
              :disabled="
                showLockedBanner ||
                !groupDetailGroup ||
                !groupDetailGroup.stickers.some((s) => getCount(s.code) >= 1)
              "
              aria-label="Limpar todas as figurinhas desta equipe"
              @click="openClearGroupConfirm"
            />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              square
              class="shrink-0"
              aria-label="Fechar"
              @click="close"
            />
          </div>
        </div>
      </template>
      <template #body>
        <div
          v-if="groupDetailGroup"
          class="max-h-[min(65vh,32rem)] overflow-y-auto pr-1 -mr-1"
        >
          <p
            v-if="groupDetailVisibleStickers.length === 0"
            class="text-sm text-muted"
          >
            Nenhuma figurinha neste filtro.
          </p>
          <div
            v-else
            class="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8"
          >
            <button
              v-for="sticker in groupDetailVisibleStickers"
              :key="sticker.id"
              type="button"
              class="relative flex min-h-11 cursor-pointer items-center justify-center overflow-visible rounded-md px-0.5 text-xs leading-none outline-none transition-colors"
              :class="[
                getCount(sticker.code) >= 1
                  ? 'bg-green-600 text-white dark:bg-green-600 dark:text-white'
                  : 'bg-neutral-200/80 text-neutral-900 dark:bg-neutral-800/90 dark:text-neutral-100',
              ]"
              @click="onGroupDetailStickerClick(sticker)"
              @pointerdown="onGroupDetailPointerDown($event, sticker)"
              @pointerup="onGroupDetailPointerUp($event)"
              @pointercancel="onGroupDetailPointerCancel()"
              @contextmenu.prevent="
                onGroupDetailStickerContextMenu(sticker, $event)
              "
            >
              <span class="px-0.5">{{ sticker.name }}</span>
              <AlbumDuplicateExtrasBadge
                v-if="showDuplicateCountLabel(sticker.code)"
                :count="getCount(sticker.code)"
                :title="`${getCount(sticker.code)} na coleção`"
              />
            </button>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="clearCollectionModalOpen"
      title="Limpar toda a coleção?"
      description="Todas as figurinhas marcadas serão removidas. Esta ação não pode ser desfeita."
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #footer>
        <div class="flex w-full flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancelar"
            @click="clearCollectionModalOpen = false"
          />
          <UButton
            color="error"
            label="Limpar tudo"
            @click="confirmClearCollection"
          />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="clearGroupModalOpen"
      :title="
        clearGroupTarget ? `Limpar ${clearGroupTarget.name}?` : 'Limpar equipe?'
      "
      description="Todas as figurinhas desta equipe serão removidas da coleção. Esta ação não pode ser desfeita."
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #footer>
        <div class="flex w-full flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancelar"
            @click="clearGroupModalOpen = false"
          />
          <UButton
            color="error"
            label="Limpar equipe"
            @click="confirmClearGroup"
          />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
