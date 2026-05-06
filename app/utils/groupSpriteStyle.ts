import type { Group } from "#shared/types/album";

/** CSS pixel size of the atlas image file (`collection.png`) as referenced in album data. */
export const SPRITE_ATLAS_WIDTH = 320;
export const SPRITE_ATLAS_HEIGHT = 160;

/**
 * CSS background sprite for a group crest. Matches the original layout: element size and
 * background-position use `scale`, while background-size stays at the atlas image’s
 * intrinsic dimensions (320×160) so crops align with album.json x/y offsets.
 */
export function groupSpriteStyle(
  group: Group,
  scale = 0.2666667,
): Record<string, string> {
  return {
    width: `${group.image.width * scale}px`,
    height: `${group.image.height * scale}px`,
    backgroundImage: `url(${group.image.sprite})`,
    backgroundSize: `${SPRITE_ATLAS_WIDTH}px ${SPRITE_ATLAS_HEIGHT}px`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${-group.image.x * scale}px ${-group.image.y * scale}px`,
  };
}
