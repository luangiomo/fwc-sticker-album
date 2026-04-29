import type { Album, Group } from '~/types/album'
import albumData from '~/data/album.json'

const album: Album = albumData as Album

export const useAlbum = () => {
  const groups = album.groups
  const selectedGroupId = useState<string>('selected-group', () => groups[0]?.id ?? '')

  const selectedGroup = computed<Group | undefined>(() =>
    groups.find(g => g.id === selectedGroupId.value),
  )

  const allStickers = computed(() => groups.flatMap(g => g.stickers))

  function selectGroup(id: string) {
    selectedGroupId.value = id
  }

  return { album, groups, selectedGroupId, selectedGroup, allStickers, selectGroup }
}
