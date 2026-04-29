<script setup lang="ts">
import type { FilterMode } from '~/types/album'

const { filter } = useCollection()

const filters: { label: string; value: FilterMode }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Faltantes', value: 'missing' },
  { label: 'Repetidas', value: 'duplicates' },
]
</script>

<template>
  <div class="album-filters">
    <button
      v-for="f in filters"
      :key="f.value"
      :class="['filter-btn', { active: filter === f.value }]"
      @click="filter = f.value"
    >
      {{ f.label }}
    </button>
  </div>
</template>

<style scoped>
.album-filters {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  padding: 0.5rem 0;
}

.filter-btn {
  padding: 0.4rem 1rem;
  border: 1px solid #334155;
  border-radius: 9999px;
  background: transparent;
  color: #94a3b8;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  border-color: #60a5fa;
  color: #e2e8f0;
}

.filter-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
</style>
