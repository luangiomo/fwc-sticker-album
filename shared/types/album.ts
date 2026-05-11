export type StickerVariant = "normal" | "chromo";

export type Sticker = {
  id: string;
  number: number;
  name: string;
  code: string;
  slug: string;
  variant: StickerVariant;
};

export type GroupType = "oficial" | "team" | "coca-cola";

export type Group = {
  id: string;
  name: string;
  slug: string;
  image: Image;
  type: GroupType;
  stickers: Sticker[];
};

export type Image = {
  sprite: string;
  width: number;
  height: number;
  x: number;
  y: number;
};

export type Album = {
  groups: Group[];
};

export type Collection = Record<string, number>;

export type FilterMode = "all" | "missing" | "duplicates";

export type GroupSortMode =
  | "default"
  | "alphabetic"
  | "owned"
  | "ownedAsc";

export type LocalAppConfig = {
  filter: FilterMode;
  groupSort: GroupSortMode;
  stickerEditLocked?: boolean;
  /**
   * True: simple layout (group rows only, no sticker grid on home).
   * False: wrapped/full layout with sticker grid on home (default).
   */
  simpleHomeVisualization?: boolean;
};
