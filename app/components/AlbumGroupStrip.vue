<script setup lang="ts">
const { groups } = useAlbum();

defineEmits<{
  navigate: [groupId: string];
}>();
</script>

<template>
  <UCarousel
    :items="groups"
    wheel-gestures
    drag-free
    :ui="{
      container: 'flex w-full flex-row py-1 -ms-2',
      item: 'shrink-0 basis-auto ps-0',
    }"
  >
    <template #default="{ item }">
      <div
        class="flex flex-col items-center gap-1 py-2 px-3 rounded-sm select-none cursor-pointer"
        @click="$emit('navigate', item.id)"
      >
        <div
          class="rounded-full size-full aspect-square bg-cover bg-center"
          :style="{
            width: `${item.image.width * 0.2666667}px`,
            height: `${item.image.height * 0.2666667}px`,
            backgroundImage: `url(${item.image.sprite})`,
            backgroundSize: `320px 160px`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `${-item.image.x * 0.2666667}px ${-item.image.y * 0.2666667}px`,
          }"
        />
        <span
          class="text-xs text-center font-secondary truncate pointer-events-none"
        >
          {{ item.slug }}
        </span>
      </div>
    </template>
  </UCarousel>
</template>
