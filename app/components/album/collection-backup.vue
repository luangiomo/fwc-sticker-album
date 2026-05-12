<script setup lang="ts">
import type { Collection } from "#shared/types/album";
import {
  downloadTextFile,
  openCollectionPrintWindow,
  parseCollectionBackup,
  serializeCollectionCsv,
  serializeCollectionTxt,
  type PrintRow,
} from "~/utils/collectionBackup";

type ExtraMenuGroups = {
  label: string;
  icon?: string;
  onSelect?: () => void;
  color?:
    | "error"
    | "neutral"
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning";
}[][];

const props = defineProps<{
  /** Itens extra no topo do menu (ex.: ir para equipe). */
  prependItems?: ExtraMenuGroups;
  /** Itens extra após export/import (ex.: limpar coleção). */
  appendItems?: ExtraMenuGroups;
}>();

const {
  collection,
  getCount,
  replaceCollection,
  stats,
  stickerEditLocked,
  simpleHomeVisualization,
} = useCollection();
const { groups } = useAlbum();

const fileInputRef = ref<HTMLInputElement | null>(null);

const importOpen = ref(false);
const importError = ref<string | null>(null);
const importPending = ref<{
  collection: Collection;
  warnings: string[];
} | null>(null);

const validCodes = computed(() => {
  const s = new Set<string>();
  for (const g of groups) {
    for (const st of g.stickers) s.add(st.code);
  }
  return s;
});

function filenameFor(ext: "csv" | "txt") {
  const day = new Date().toISOString().slice(0, 10);
  return `fwc-colecao-${day}.${ext}`;
}

function exportCsv() {
  const raw = collection.value ?? {};
  downloadTextFile(
    filenameFor("csv"),
    serializeCollectionCsv(raw),
    "text/csv;charset=utf-8"
  );
}

function exportTxt() {
  const raw = collection.value ?? {};
  downloadTextFile(
    filenameFor("txt"),
    serializeCollectionTxt(raw),
    "text/plain;charset=utf-8"
  );
}

function printList() {
  if (stats.value.owned === 0) {
    importError.value = "Não há figurinhas na coleção para imprimir.";
    importPending.value = null;
    importOpen.value = true;
    return;
  }

  const rows: PrintRow[] = [];
  for (const g of groups) {
    for (const s of g.stickers) {
      const count = getCount(s.code);
      if (count <= 0) continue;
      rows.push({
        code: s.code,
        name: s.name,
        groupName: g.name,
        count,
      });
    }
  }
  rows.sort((a, b) =>
    a.code.localeCompare(b.code, "pt", { sensitivity: "base" })
  );

  if (!openCollectionPrintWindow(rows, "Coleção de figurinhas")) {
    importError.value =
      "O navegador bloqueou a janela de impressão. Permita pop-ups e tente de novo.";
    importPending.value = null;
    importOpen.value = true;
  }
}

function triggerImportPick() {
  importError.value = null;
  importPending.value = null;
  fileInputRef.value?.click();
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  let text: string;
  try {
    text = await file.text();
  } catch {
    importError.value = "Não foi possível ler o arquivo.";
    importPending.value = null;
    importOpen.value = true;
    return;
  }

  const result = parseCollectionBackup(text, validCodes.value);
  if (!result.ok) {
    importError.value = result.error;
    importPending.value = null;
    importOpen.value = true;
    return;
  }

  importError.value = null;
  importPending.value = {
    collection: result.collection,
    warnings: result.warnings,
  };
  importOpen.value = true;
}

function confirmImport() {
  const pending = importPending.value;
  if (!pending) return;
  replaceCollection(pending.collection);
  importOpen.value = false;
}

function cancelImportDialog() {
  importOpen.value = false;
}

watch(importOpen, (open) => {
  if (!open) {
    importPending.value = null;
    importError.value = null;
  }
});

const importModalTitle = computed(() => {
  if (importError.value) return "Aviso";
  if (importPending.value) return "Confirmar importação";
  return "Importação";
});

function onSimpleHomeVisualizationMenuSelect(e: Event) {
  e.preventDefault();
  simpleHomeVisualization.value = !simpleHomeVisualization.value;
}

const dropdownItems = computed(() => {
  const locked = stickerEditLocked.value;

  const homeGridToggle = [
    {
      label: "Visualização simples",
      icon: simpleHomeVisualization.value
        ? "i-lucide-layout-list"
        : "i-lucide-layout-grid",
      slot: "simpleVizSwitch" as const,
      checked: simpleHomeVisualization.value,
      onSelect: onSimpleHomeVisualizationMenuSelect,
    },
  ];

  const start = props.prependItems?.length ? [...props.prependItems] : [];

  const core = [
    ...start,
    homeGridToggle,
    [
      {
        label: "Exportar CSV",
        icon: "i-lucide-file-spreadsheet",
        onSelect: exportCsv,
      },
      {
        label: "Exportar TXT",
        icon: "i-lucide-file-text",
        onSelect: exportTxt,
      },
    ],
    [
      {
        label: "Importar arquivo…",
        icon: "i-lucide-upload",
        disabled: locked,
        onSelect: () => triggerImportPick(),
      },
      {
        label: "Imprimir / salvar em PDF",
        icon: "i-lucide-printer",
        onSelect: printList,
      },
    ],
  ];
  const extra = props.appendItems;
  if (extra?.length) {
    return [...core, ...extra];
  }
  return core;
});
</script>

<template>
  <div>
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      accept=".csv,.txt,text/csv,text/plain"
      @change="onImportFile"
    />

    <UDropdownMenu :items="dropdownItems">
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        square
        class="shrink-0"
        icon="i-lucide-menu"
        aria-label="Opções"
      />

      <template #simpleVizSwitch-trailing="{ item }">
        <USwitch
          :model-value="item.checked"
          tabindex="-1"
          @click.stop.prevent="onSimpleHomeVisualizationMenuSelect($event)"
        />
      </template>
    </UDropdownMenu>

    <UModal
      v-model:open="importOpen"
      :title="importModalTitle"
      :description="
        importPending
          ? 'A coleção atual será substituída pelos dados do arquivo.'
          : undefined
      "
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <p v-if="importError" class="text-sm text-error">{{ importError }}</p>
        <template v-else-if="importPending">
          <p class="text-sm">
            Substituir a coleção por
            <strong>{{ Object.keys(importPending.collection).length }}</strong>
            código(s) com quantidade &gt; 0?
          </p>
          <ul
            v-if="importPending.warnings.length"
            class="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-muted"
          >
            <li v-for="(w, i) in importPending.warnings" :key="i">
              {{ w }}
            </li>
          </ul>
        </template>
      </template>
      <template #footer>
        <div v-if="importError" class="flex w-full justify-end">
          <UButton label="Fechar" color="neutral" @click="cancelImportDialog" />
        </div>
        <div
          v-else-if="importPending"
          class="flex w-full flex-wrap justify-end gap-2"
        >
          <UButton
            color="neutral"
            variant="outline"
            label="Cancelar"
            @click="cancelImportDialog"
          />
          <UButton
            color="primary"
            label="Substituir coleção"
            @click="confirmImport"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
