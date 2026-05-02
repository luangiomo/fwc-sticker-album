<script setup lang="ts">
const props = defineProps<{ sticker: Sticker }>();

const { getCount, increment, decrement } = useCollection();

const count = computed(() => getCount(props.sticker.code));
const owned = computed(() => count.value >= 1);
const duplicateCount = computed(() => Math.max(0, count.value - 1));
</script>

<template>
  <button
    @click="increment(sticker.code)"
    @contextmenu.prevent="decrement(sticker.code)"
    class="cursor-pointer"
  >
    <div
      :class="[
        'relative px-2 py-3 rounded-full',
        owned ? 'bg-green-500' : 'bg-white',
        // sticker.variant === 'chromo' && 'bg-amber-500/10',
      ]"
    >
      <div class="text-xs font-medium uppercase tracking-wide">
        {{ sticker.name }}
      </div>
      <span
        v-if="duplicateCount > 0"
        class="absolute top-0 right-0 text-xs translate-x-1 -translate-y-1 text-white bg-black rounded-full px-1 py-0.5"
      >
        +{{ duplicateCount }}
      </span>
    </div>
  </button>
</template>
