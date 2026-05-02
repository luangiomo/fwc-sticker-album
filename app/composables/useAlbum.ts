import albumData from "~/data/album.json";

const album: Album = albumData as Album;

export const useAlbum = () => {
  const groups = album.groups;

  const allStickers = computed(() => groups.flatMap((g) => g.stickers));

  return {
    album,
    groups,
    allStickers,
  };
};
