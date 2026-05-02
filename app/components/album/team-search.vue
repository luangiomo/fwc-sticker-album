<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  select: [groupId: string];
}>();

const { groups } = useAlbum();

type TeamItem = {
  id: string;
  label: string;
  slug: string;
  suffix: string;
  onSelect: () => void;
};

const paletteGroups = computed<CommandPaletteGroup<TeamItem>[]>(() => [
  {
    id: "teams",
    label: "Teams",
    items: groups.map((g) => ({
      id: g.id,
      label: g.name,
      slug: g.slug,
      suffix: g.slug,
      onSelect: () => {
        emit("select", g.id);
        emit("update:open", false);
      },
    })),
  },
]);
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #content>
      <UCommandPalette
        :groups="paletteGroups"
        placeholder="Search teams by name or code..."
        :fuse="{ fuseOptions: { keys: ['label', 'slug'], threshold: 0.3 } }"
        close
        @update:open="emit('update:open', $event)"
      />
    </template>
  </UModal>
</template>
