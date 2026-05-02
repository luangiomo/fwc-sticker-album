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
      container:
        'flex w-full flex-row py-1 -ms-2 max-lg:py-1.5 max-lg:-ms-1 lg:py-1',
      item: 'shrink-0 basis-auto ps-0',
    }"
  >
    <template #default="{ item }">
      <div
        class="flex min-w-13 max-w-18 flex-col items-center gap-1 rounded-md px-2.5 py-2 select-none hover:bg-neutral-200/60 active:bg-neutral-200/80 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800/80 cursor-pointer max-lg:min-h-14 max-lg:justify-center lg:min-w-0 lg:max-w-none lg:gap-1 lg:px-3 lg:py-2"
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
          class="max-w-full text-center text-[11px] font-secondary leading-tight truncate pointer-events-none max-lg:text-xs lg:text-xs"
        >
          {{ item.slug }}
        </span>
      </div>
    </template>
  </UCarousel>
</template>
