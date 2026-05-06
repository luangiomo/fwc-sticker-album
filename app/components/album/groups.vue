<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import { groupSpriteStyle } from "~/utils/groupSpriteStyle";

const { groups } = useAlbum();
const targetIndex = ref(0);

const scrollArea = useTemplateRef("scrollArea");

function scrollToTop() {
  scrollArea.value?.virtualizer?.scrollToIndex(0, {
    align: "start",
    behavior: "smooth",
  });
}

function scrollToBottom() {
  scrollArea.value?.virtualizer?.scrollToIndex(groups.length - 1, {
    align: "end",
    behavior: "smooth",
  });
}

function scrollToItem(index: number) {
  scrollArea.value?.virtualizer?.scrollToIndex(index - 1, {
    align: "start",
    behavior: "smooth",
  });
}

</script>

<template>
  <div class="w-full">
    <UScrollArea
      ref="scrollArea"
      :items="groups"
      v-slot="{ item, index }"
      :virtualize="{
        estimateSize: 140,
        skipMeasurement: true,
      }"
      class="h-120 w-full"
    >
      <div :key="item.id" :id="item.id" class="space-y-2 mb-2">
        <div class="flex items-center gap-2">
          <div
            class="rounded-full shrink-0 aspect-square"
            :style="groupSpriteStyle(item)"
          />
          <span class="text-sm font-medium">{{ item.name }}</span>
          <span class="text-xs font-secondary text-muted leading-none mt-1">
            0/{{ item.stickers.length }}
          </span>
        </div>
        <div
          class="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
        >
          <StickerCard
            v-for="sticker in item.stickers"
            :key="sticker.id"
            :sticker="sticker"
          />
        </div>
      </div>
    </UScrollArea>

    <UFieldGroup size="sm" class="px-4 py-3 border-t border-muted w-full">
      <UButton
        icon="i-lucide-arrow-up-to-line"
        color="neutral"
        variant="outline"
        @click="scrollToTop"
      >
        Top
      </UButton>
      <UButton
        icon="i-lucide-arrow-down-to-line"
        color="neutral"
        variant="outline"
        @click="scrollToBottom"
      >
        Bottom
      </UButton>
      <UButton
        icon="i-lucide-navigation"
        color="neutral"
        variant="outline"
        @click="scrollToItem(targetIndex || 0)"
      >
        Go to {{ targetIndex || 0 }}
      </UButton>
    </UFieldGroup>
  </div>
</template>
