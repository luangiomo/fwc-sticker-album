export type StickerVariant = "normal" | "chromo";

export type Sticker = {
  id: string;
  number: number;
  name: string;
  variant: StickerVariant;
};

export type GroupType = "oficial" | "team" | "coca-cola";

export type Group = {
  id: string;
  name: string;
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
