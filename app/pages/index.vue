<script setup lang="ts">
import { scrollIntoViewBelowSticky } from "~/utils/scrollBelowSticky";

const { groups } = useAlbum();
const {
  getCount,
  increment,
  decrement,
  filterStickers,
  groupSort,
  clearCollection,
  stats,
} = useCollection();

const clearCollectionModalOpen = ref(false);

function confirmClearCollection() {
  clearCollection();
  clearCollectionModalOpen.value = false;
}

const renderedGroups = computed(() => {
  const rows = groups
    .map((g) => ({ ...g, stickers: filterStickers(g.stickers) }))
    .filter((g) => g.stickers.length > 0);
  if (groupSort.value === "alphabetic") {
    return [...rows].sort((a, b) =>
      a.slug.localeCompare(b.slug, "pt", { sensitivity: "base" }),
    );
  }
  return rows;
});

const {
  focusGroupIndex,
  focusStickerIndex,
  searchOpen,
  goToGroup,
  setFocus,
  cellTabindex,
  cellGridPos,
  stickerFindOpen,
  stickerFindQuery,
  findMatchSummary,
  exitSearchMode,
  enterStickerSearchMode,
  afterIncrementSticker,
  STICKER_FIND_INPUT_ID,
} = useAlbumGridNav(renderedGroups);

function onStickerCellClick(code: string, gIdx: number, sIdx: number) {
  increment(code);
  setFocus(gIdx, sIdx);
  afterIncrementSticker();
}

function groupSpriteStyle(group: Group) {
  const scale = 0.2666667;
  return {
    width: `${group.image.width * scale}px`,
    height: `${group.image.height * scale}px`,
    backgroundImage: `url(${group.image.sprite})`,
    backgroundSize: `320px 160px`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${-group.image.x * scale}px ${-group.image.y * scale}px`,
  };
}

function onTeamSelect(groupId: string) {
  nextTick(() => {
    const el = document.getElementById(groupId);
    if (el)
      scrollIntoViewBelowSticky(el, { behavior: "smooth", block: "center" });
    const idx = renderedGroups.value.findIndex((g) => g.id === groupId);
    if (idx >= 0) goToGroup(idx, 0);
  });
}
</script>

<template>
  <UContainer class="py-8 px-4">
    <div
      data-sticky-page-header
      class="sticky top-0 z-20 bg-[#f7f7f7] pb-2 pt-0"
    >
      <div class="flex flex-col gap-1">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
        >
          <AlbumFilters class="min-w-0 lg:flex-1" />
          <div
            class="flex w-full shrink-0 items-center lg:max-w-md lg:justify-end"
          >
            <template v-if="!stickerFindOpen">
              <div class="flex w-full flex-wrap items-center justify-end gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-search"
                  label="Buscar figurinha"
                  class="min-w-0 flex-1 sm:flex-initial"
                  @click="enterStickerSearchMode"
                >
                  <template #trailing>
                    <div class="flex items-center gap-1">
                      <UKbd size="sm">Ctrl</UKbd>
                      <span class="text-xs">+</span>
                      <UKbd size="sm">K</UKbd>
                    </div>
                  </template>
                </UButton>
                <UButton
                  color="error"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-trash-2"
                  label="Limpar coleção"
                  class="shrink-0"
                  :disabled="stats.owned === 0"
                  @click="clearCollectionModalOpen = true"
                />
              </div>
            </template>
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
          </div>
        </div>
        <p
          v-if="stickerFindOpen"
          class="text-[11px] leading-snug text-muted lg:text-right"
        >
          Esc encerra a busca · Ctrl/Cmd+Shift+K busca por equipe
        </p>
        <AlbumProgress />
      </div>
    </div>

    <div class="flex flex-col" role="grid">
      <div
        v-for="(item, gIdx) in renderedGroups"
        :key="item.id"
        :id="item.id"
        role="row"
        class="flex lg:flex-col flex-row gap-4 border-t border-gray-200 py-4"
      >
        <div class="flex lg:flex-row flex-col items-center gap-2 h-8 lg:h-full">
          <div
            class="rounded-sm size-full aspect-square bg-cover bg-center"
            :style="groupSpriteStyle(item)"
          />
          <div class="grid lg:grid-cols-20 grid-cols-5 w-full gap-1">
            <div
              v-for="(sticker, sIdx) in item.stickers"
              :key="sticker.id"
              role="gridcell"
              :tabindex="cellTabindex(gIdx, sIdx)"
              :data-grid-pos="cellGridPos(gIdx, sIdx)"
              @click="onStickerCellClick(sticker.code, gIdx, sIdx)"
              @contextmenu.prevent="
                decrement(sticker.code);
                setFocus(gIdx, sIdx);
              "
              :class="[
                'flex items-center justify-center cursor-pointer rounded-sm h-8 outline-none transition-colors',
                getCount(sticker.code) >= 1
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600/10',
                gIdx === focusGroupIndex &&
                  sIdx === focusStickerIndex &&
                  'ring-2 ring-primary ring-offset-1',
              ]"
            >
              <span class="text-xs leading-none">
                {{ sticker.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AlbumTeamSearch v-model:open="searchOpen" @select="onTeamSelect" />

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
  </UContainer>
</template>
