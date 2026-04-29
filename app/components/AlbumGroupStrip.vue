<script setup lang="ts">
const { groups, selectedGroupId, selectGroup } = useAlbum()
</script>

<template>
  <div class="group-strip">
    <button
      v-for="group in groups"
      :key="group.id"
      :class="['group-btn', { active: selectedGroupId === group.id }]"
      @click="selectGroup(group.id)"
    >
      <span class="group-name">{{ group.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.group-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.75rem 0;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}

.group-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  background: #0f172a;
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.group-btn:hover {
  border-color: #60a5fa;
  color: #e2e8f0;
}

.group-btn.active {
  background: #1e3a5f;
  border-color: #3b82f6;
  color: #fff;
}

.group-name {
  font-weight: 600;
}
</style>
