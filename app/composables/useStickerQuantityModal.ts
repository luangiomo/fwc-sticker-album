/** Estado partilhado: uma única instância do modal de quantidade na app. */
const stickerQuantityModalOpen = ref(false);
const stickerQuantityModalSticker = ref<Sticker | null>(null);

export function useStickerQuantityModal() {
  function openStickerQuantity(sticker: Sticker) {
    stickerQuantityModalSticker.value = sticker;
    stickerQuantityModalOpen.value = true;
  }

  function closeStickerQuantity() {
    stickerQuantityModalOpen.value = false;
  }

  return {
    stickerQuantityModalOpen,
    stickerQuantityModalSticker,
    openStickerQuantity,
    closeStickerQuantity,
  };
}
