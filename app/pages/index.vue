<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { scrollIntoViewBelowSticky } from "~/utils/scrollBelowSticky";
import { duplicateBadgeCount, duplicateExtra } from "~/utils/duplicateDisplay";
import { groupSpriteStyle } from "~/utils/groupSpriteStyle";

const isLg = useMediaQuery("(min-width: 1024px)");

const { groups } = useAlbum();
const collection = useCollection();
const {
  getCount,
  increment,
  decrement,
  filterStickers,
  filter,
  groupSort,
  clearCollection,
  clearGroup,
  stats,
} = collection;

/** When true, the per-group sticker grid is hidden on the home page (Opções). */
const hideHomeStickerGrid = collection.hideHomeStickerGrid;

/** Explicit banner + template binding so lock state stays reactive (avoid destructuring the computed alone). */
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

const renderedGroups = computed(() => {
  const rows = groups
    .map((g) => {
      const totalInGroup = g.stickers.length;
      const ownedInGroup = g.stickers.filter(
        (s) => getCount(s.code) >= 1
      ).length;
      return {
        ...g,
        stickers: filterStickers(g.stickers),
        ownedInGroup,
        totalInGroup,
      };
    })
    .filter((g) => g.stickers.length > 0);

  if (groupSort.value === "alphabetic") {
    return [...rows].sort((a, b) =>
      a.slug.localeCompare(b.slug, "pt", { sensitivity: "base" })
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

function openGroupDetail(row: { id: string }) {
  const g = groups.find((x) => x.id === row.id) ?? null;
  if (!g) return;
  groupDetailGroup.value = g;
  groupDetailOpen.value = true;
}

function onTeamSelect(groupId: string) {
  nextTick(() => {
    const el = document.getElementById(groupId);
    if (el)
      scrollIntoViewBelowSticky(el, { behavior: "smooth", block: "center" });
    const idx = renderedGroups.value.findIndex((g) => g.id === groupId);
    if (idx >= 0 && isLg.value) goToGroup(idx, 0);
  });
}

/** Selo +N; no filtro Repetidas só mostra a partir de 3 no total (evita +1 só). */
function showDuplicateCountLabel(code: string) {
  const n = getCount(code);
  if (duplicateBadgeCount(n) <= 0) return false;
  if (filter.value === "duplicates") return duplicateExtra(n) > 1;
  return true;
}

const mobileStickerGestures = useMobileTapHoldDecrement(() => !isLg.value);
const mobileGroupDetailGestures = useMobileTapHoldDecrement(() => !isLg.value);

function onStickerCellClick(sticker: Sticker, gIdx: number, sIdx: number) {
  if (isLg.value) {
    increment(sticker.code);
    setFocus(gIdx, sIdx);
    afterIncrementSticker();
    return;
  }
  if (mobileStickerGestures.consumeSkipFollowingClick()) return;
  increment(sticker.code);
  setFocus(gIdx, sIdx);
  afterIncrementSticker();
}

function onStickerContextMenu(
  code: string,
  gIdx: number,
  sIdx: number,
  e: MouseEvent
) {
  if (isLg.value) {
    decrement(code);
    setFocus(gIdx, sIdx);
    return;
  }
  if (e.button !== 2) return;
  decrement(code);
  setFocus(gIdx, sIdx);
}

function onGroupDetailStickerClick(sticker: Sticker) {
  if (isLg.value) {
    increment(sticker.code);
    afterIncrementSticker();
    return;
  }
  if (mobileGroupDetailGestures.consumeSkipFollowingClick()) return;
  increment(sticker.code);
  afterIncrementSticker();
}

function onGroupDetailStickerContextMenu(sticker: Sticker, e: MouseEvent) {
  if (isLg.value) {
    decrement(sticker.code);
    return;
  }
  if (e.button !== 2) return;
  decrement(sticker.code);
}

const mobileClearMenuGroups = computed(() => [
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
</script>

<template>
  <UContainer class="p-0">
    <div
      data-sticky-page-header
      class="sticky top-0 z-20 border-b border-neutral-200/90 bg-neutral-50/95 px-3 py-2 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95 md:px-5 md:pt-5 lg:px-4 lg:pt-8"
    >
      <div class="flex flex-col lg:gap-1">
        <div
          v-if="showLockedBanner"
          class="my-2 flex items-center gap-2 rounded-md border border-amber-200/90 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <UIcon
            name="i-lucide-lock"
            class="size-3.5 shrink-0 text-amber-700 dark:text-amber-400"
          />
          <span class="min-w-0 flex-1">Álbum travado — edição desativada.</span>
          <UButton
            color="warning"
            variant="link"
            size="xs"
            label="Desbloquear"
            @click="showLockedBanner = false"
          />
        </div>
        <div
          class="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
        >
          <div
            v-if="!isLg && !stickerFindOpen"
            class="flex w-full min-w-0 items-center gap-2"
          >
            <AlbumFilters class="min-w-0 flex-1" />
            <AlbumCollectionBackup
              :append-items="mobileClearMenuGroups"
              class="shrink-0"
            />
          </div>
          <AlbumFilters v-else-if="isLg" class="min-w-0 lg:flex-1" />
          <div
            v-if="stickerFindOpen"
            data-sticker-find
            class="flex w-full min-w-0 items-center gap-2 lg:max-w-md lg:gap-2"
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
          <div
            v-else-if="isLg"
            class="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 lg:max-w-md lg:gap-2"
          >
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
            <AlbumCollectionBackup class="shrink-0" />
            <UButton
              color="error"
              variant="outline"
              size="sm"
              icon="i-lucide-trash-2"
              label="Limpar coleção"
              class="shrink-0"
              :disabled="showLockedBanner || stats.owned === 0"
              @click="clearCollectionModalOpen = true"
            />
          </div>
        </div>

        <AlbumProgress />
        <p
          v-if="stickerFindOpen && isLg"
          class="hidden text-[11px] leading-snug text-muted lg:block lg:text-right"
        >
          Esc encerra a busca · Ctrl/Cmd+Shift+K busca por equipe
        </p>

        <div
          class="hidden max-lg:border-0 lg:block lg:border-t lg:border-neutral-200/90 lg:pt-2 dark:lg:border-neutral-800"
        >
          <AlbumGroupStrip @navigate="onTeamSelect" />
        </div>
      </div>
    </div>

    <div
      class="flex flex-col px-3 pb-4 md:px-5 md:pb-5 lg:px-4 lg:pb-8"
      role="grid"
    >
      <div
        v-for="(item, gIdx) in renderedGroups"
        :key="item.id"
        :id="item.id"
        role="row"
        class="flex flex-col gap-3 border-t border-neutral-200 py-4 dark:border-neutral-800 max-lg:gap-3 max-lg:py-4 lg:flex-row lg:items-start lg:gap-4 lg:py-4"
      >
        <div
          class="flex w-full min-w-0 flex-row items-center gap-3 lg:w-auto lg:max-w-none lg:shrink-0 lg:flex-col lg:items-center lg:gap-2"
        >
          <div
            role="button"
            tabindex="0"
            class="shrink-0 cursor-pointer rounded-sm bg-cover bg-center outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
            :style="groupSpriteStyle(item)"
            :aria-label="`Ver figurinhas de ${item.name}`"
            @click="openGroupDetail(item)"
            @keydown.enter.prevent="openGroupDetail(item)"
            @keydown.space.prevent="openGroupDetail(item)"
          />
          <button
            type="button"
            class="flex min-h-0 min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-sm text-left outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
            :aria-label="`Abrir figurinhas de ${item.name}`"
            @click="openGroupDetail(item)"
          >
            <div class="flex flex-1 items-center gap-2">
              <h3 class="min-w-0 truncate text-sm font-medium leading-tight">
                {{ item.slug }}
              </h3>
              <span class="text-xs text-muted">·</span>
              <h3 class="min-w-0 truncate text-sm font-medium leading-tight">
                {{ item.name }}
              </h3>
              <span class="text-xs text-muted">·</span>
              <span
                class="shrink-0 tabular-nums text-[11px] leading-tight text-muted"
              >
                {{ formatTeamProgress(item.ownedInGroup, item.totalInGroup) }}
              </span>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-3.5 shrink-0 text-muted"
            />
          </button>
        </div>
        <div
          v-if="hideHomeStickerGrid"
          class="grid w-full min-w-0 grid-cols-5 gap-1.5 lg:grid-cols-20 lg:gap-1 lg:flex-1"
        >
          <div
            v-for="(sticker, sIdx) in item.stickers"
            :key="sticker.id"
            role="gridcell"
            :tabindex="cellTabindex(gIdx, sIdx)"
            :data-grid-pos="cellGridPos(gIdx, sIdx)"
            @click="onStickerCellClick(sticker, gIdx, sIdx)"
            @pointerdown="
              mobileStickerGestures.onPointerDown($event, () => {
                decrement(sticker.code);
                setFocus(gIdx, sIdx);
              })
            "
            @pointerup="
              mobileStickerGestures.onPointerUp($event, () => {
                increment(sticker.code);
                setFocus(gIdx, sIdx);
                afterIncrementSticker();
              })
            "
            @pointercancel="mobileStickerGestures.onPointerCancel()"
            @contextmenu.prevent="
              onStickerContextMenu(sticker.code, gIdx, sIdx, $event)
            "
            :class="[
              'relative flex min-h-11 cursor-pointer items-center justify-center overflow-visible rounded-md px-0.5 text-xs leading-none outline-none transition-colors lg:h-8 lg:min-h-0 lg:rounded-sm lg:px-0',
              getCount(sticker.code) >= 1
                ? 'bg-green-600 text-white dark:bg-green-500 dark:text-green-800'
                : 'bg-neutral-200/80 text-neutral-900 dark:bg-neutral-800/90 dark:text-neutral-100',
              isLg &&
                gIdx === focusGroupIndex &&
                sIdx === focusStickerIndex &&
                'ring-2 ring-primary ring-offset-1 ring-offset-neutral-50 dark:ring-offset-neutral-950',
            ]"
          >
            <span class="text-xs leading-none">
              {{ sticker.name }}
            </span>
            <span
              v-if="showDuplicateCountLabel(sticker.code)"
              class="pointer-events-none absolute -right-1 -top-1 z-1 min-w-4 rounded px-0.5 py-px text-center text-[9px] font-semibold leading-none tabular-nums bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900"
              :title="`${getCount(sticker.code)} na coleção · +${duplicateBadgeCount(getCount(sticker.code))} no selo`"
            >
              +{{ duplicateBadgeCount(getCount(sticker.code)) }}
            </span>
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
          <div
            class="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 max-lg:gap-1.5 lg:gap-1.5"
          >
            <button
              v-for="sticker in groupDetailGroup.stickers"
              :key="sticker.id"
              type="button"
              class="relative flex min-h-11 cursor-pointer items-center justify-center overflow-visible rounded-md px-0.5 text-xs leading-none outline-none transition-colors lg:h-9 lg:min-h-0 lg:rounded-sm"
              :class="[
                getCount(sticker.code) >= 1
                  ? 'bg-green-600 text-white dark:bg-green-500 dark:text-green-800'
                  : 'bg-neutral-200/80 text-neutral-900 dark:bg-neutral-800/90 dark:text-neutral-100',
              ]"
              @click="onGroupDetailStickerClick(sticker)"
              @pointerdown="
                mobileGroupDetailGestures.onPointerDown($event, () => {
                  decrement(sticker.code);
                })
              "
              @pointerup="
                mobileGroupDetailGestures.onPointerUp($event, () => {
                  increment(sticker.code);
                  afterIncrementSticker();
                })
              "
              @pointercancel="mobileGroupDetailGestures.onPointerCancel()"
              @contextmenu.prevent="
                onGroupDetailStickerContextMenu(sticker, $event)
              "
            >
              <span class="px-0.5">{{ sticker.name }}</span>
              <span
                v-if="showDuplicateCountLabel(sticker.code)"
                class="pointer-events-none absolute -right-1 -top-1 z-1 min-w-4 rounded px-0.5 py-px text-center text-[9px] font-semibold leading-none tabular-nums bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900"
                :title="`${getCount(sticker.code)} na coleção · +${duplicateBadgeCount(getCount(sticker.code))} no selo`"
              >
                +{{ duplicateBadgeCount(getCount(sticker.code)) }}
              </span>
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
