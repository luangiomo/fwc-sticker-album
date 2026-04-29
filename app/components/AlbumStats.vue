<script setup lang="ts">
const { stats } = useCollection()
</script>

<template>
  <div class="album-stats">
    <div class="stat">
      <span class="stat-value">{{ stats.owned }}</span>
      <span class="stat-label">Preenchidas</span>
    </div>
    <div class="stat">
      <span class="stat-value">{{ stats.missing }}</span>
      <span class="stat-label">Faltantes</span>
    </div>
    <div class="stat">
      <span class="stat-value">{{ stats.duplicates }}</span>
      <span class="stat-label">Repetidas</span>
    </div>
  </div>
</template>

<style scoped>
.album-stats {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  padding: 1rem 0;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: #1e293b;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-top: 0.15rem;
}
</style>
