import type { Collection, FilterMode, Sticker } from '~/types/album'

export const useCollection = () => {
  const collection = useState<Collection>('fwc-collection', () => ({}))
  const filter = useState<FilterMode>('fwc-filter', () => 'all')

  function getCount(stickerId: string): number {
    return collection.value[stickerId] ?? 0
  }

  function increment(stickerId: string) {
    collection.value = {
      ...collection.value,
      [stickerId]: getCount(stickerId) + 1,
    }
  }

  function decrement(stickerId: string) {
    const current = getCount(stickerId)
    if (current <= 0) return
    collection.value = {
      ...collection.value,
      [stickerId]: current - 1,
    }
  }

  const { allStickers } = useAlbum()

  const stats = computed(() => {
    let owned = 0
    let missing = 0
    let duplicates = 0

    for (const s of allStickers.value) {
      const count = getCount(s.id)
      if (count === 0) missing++
      else {
        owned++
        duplicates += count - 1
      }
    }

    return { owned, missing, duplicates }
  })

  function filterStickers(stickers: Sticker[]): Sticker[] {
    switch (filter.value) {
      case 'missing':
        return stickers.filter(s => getCount(s.id) === 0)
      case 'duplicates':
        return stickers.filter(s => getCount(s.id) > 1)
      default:
        return stickers
    }
  }

  return { collection, filter, getCount, increment, decrement, stats, filterStickers }
}
