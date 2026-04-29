<script setup lang="ts">
import type { Sticker } from '~/types/album'

const props = defineProps<{ sticker: Sticker }>()

const { getCount, increment, decrement } = useCollection()

const count = computed(() => getCount(props.sticker.id))
const owned = computed(() => count.value >= 1)
const duplicateCount = computed(() => Math.max(0, count.value - 1))
</script>

<template>
  <button
    :class="[
      'sticker-card',
      owned ? 'owned' : 'missing',
      sticker.variant === 'chromo' && 'chromo',
    ]"
    @click="increment(sticker.id)"
    @contextmenu.prevent="decrement(sticker.id)"
  >
    <span class="sticker-number">{{ sticker.number }}</span>
    <span class="sticker-name">{{ sticker.name }}</span>
    <span v-if="duplicateCount > 0" class="badge">+{{ duplicateCount }}</span>
  </button>
</template>

<style scoped>
.sticker-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  aspect-ratio: 3 / 4;
  border: 2px dashed #334155;
  border-radius: 0.5rem;
  background: #0f172a;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem;
  font-family: inherit;
}

.sticker-card:hover {
  border-color: #60a5fa;
}

.sticker-card.owned {
  border-style: solid;
  border-color: #22c55e;
  background: #14532d;
  color: #f0fdf4;
}

.sticker-card.owned.chromo {
  border-color: #facc15;
  background: linear-gradient(135deg, #713f12 0%, #854d0e 50%, #a16207 100%);
  color: #fef9c3;
}

.sticker-card.missing.chromo {
  border-color: #854d0e;
}

.sticker-number {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

.sticker-name {
  font-size: 0.65rem;
  text-align: center;
  line-height: 1.15;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.badge {
  position: absolute;
  top: -0.4rem;
  right: -0.4rem;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 9999px;
  line-height: 1.2;
}
</style>
