<script setup lang="ts">
const { selectedGroup } = useAlbum()
const { filterStickers } = useCollection()

const visibleStickers = computed(() => {
  if (!selectedGroup.value) return []
  return filterStickers(selectedGroup.value.stickers)
})
</script>

<template>
  <div class="album-page">
    <header class="album-header">
      <h1>FWC Sticker Album</h1>
      <p class="subtitle">Clique para adicionar · Clique com botão direito para remover</p>
    </header>

    <AlbumStats />
    <AlbumGroupStrip />
    <AlbumFilters />

    <section v-if="selectedGroup" class="sticker-grid">
      <StickerCard
        v-for="sticker in visibleStickers"
        :key="sticker.id"
        :sticker="sticker"
      />
      <p v-if="visibleStickers.length === 0" class="empty-msg">
        Nenhuma figurinha neste filtro.
      </p>
    </section>
  </div>
</template>

<style scoped>
.album-page {
  max-width: 36rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.album-header {
  text-align: center;
  margin-bottom: 0.75rem;
}

.album-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.subtitle {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  padding-top: 0.75rem;
}

.empty-msg {
  grid-column: 1 / -1;
  text-align: center;
  color: #64748b;
  padding: 2rem 0;
  font-size: 0.85rem;
}
</style>
