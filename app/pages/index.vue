<script setup lang="ts">
const { groups } = useAlbum();
const { getCount, increment, decrement, filterStickers } = useCollection();

const renderedGroups = computed(() =>
  groups
    .map((g) => ({ ...g, stickers: filterStickers(g.stickers) }))
    .filter((g) => g.stickers.length > 0),
);

const {
  focusGroupIndex,
  focusStickerIndex,
  searchOpen,
  goToGroup,
  setFocus,
  cellTabindex,
  cellGridPos,
} = useAlbumGridNav(renderedGroups);

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
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    const idx = renderedGroups.value.findIndex((g) => g.id === groupId);
    if (idx >= 0) goToGroup(idx, 0);
  });
}
</script>

<template>
  <UContainer class="py-8 px-4">
    <AlbumStats />
    <div class="bg-[#f7f7f7]">
      <AlbumFilters />
      <AlbumProgress />
    </div>

    <div class="flex flex-col" role="grid">
      <div
        v-for="(item, gIdx) in renderedGroups"
        :key="item.id"
        :id="item.id"
        role="row"
        class="flex flex-col gap-4 border-t border-gray-200 py-4"
      >
        <div class="flex items-center gap-2 h-8">
          <div
            class="rounded-sm size-full aspect-square bg-cover bg-center"
            :style="groupSpriteStyle(item)"
          />
          <div class="grid grid-cols-20 w-full gap-1">
            <div
              v-for="(sticker, sIdx) in item.stickers"
              :key="sticker.id"
              role="gridcell"
              :tabindex="cellTabindex(gIdx, sIdx)"
              :data-grid-pos="cellGridPos(gIdx, sIdx)"
              @click="increment(sticker.code); setFocus(gIdx, sIdx)"
              @contextmenu.prevent="decrement(sticker.code); setFocus(gIdx, sIdx)"
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
              <span class="text-xs font-secondary leading-none">
                {{ sticker.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AlbumTeamSearch v-model:open="searchOpen" @select="onTeamSelect" />
  </UContainer>
</template>
