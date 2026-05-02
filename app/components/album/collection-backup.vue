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

const { collection, getCount, replaceCollection, stats } = useCollection();
const { groups } = useAlbum();

const fileInputRef = ref<HTMLInputElement | null>(null);

const importOpen = ref(false);
const importError = ref<string | null>(null);
const importPending = ref<{ collection: Collection; warnings: string[] } | null>(
  null,
);

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
    "text/csv;charset=utf-8",
  );
}

function exportTxt() {
  const raw = collection.value ?? {};
  downloadTextFile(
    filenameFor("txt"),
    serializeCollectionTxt(raw),
    "text/plain;charset=utf-8",
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
    a.code.localeCompare(b.code, "pt", { sensitivity: "base" }),
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

const dropdownItems = computed(() => [
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
      onSelect: () => triggerImportPick(),
    },
    {
      label: "Imprimir / salvar em PDF",
      icon: "i-lucide-printer",
      onSelect: printList,
    },
  ],
]);
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
        icon="i-lucide-save"
        label="Cópia"
        trailing-icon="i-lucide-chevron-down"
        class="shrink-0"
      />
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
        <div v-else-if="importPending" class="flex w-full flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancelar"
            @click="cancelImportDialog"
          />
          <UButton color="primary" label="Substituir coleção" @click="confirmImport" />
        </div>
      </template>
    </UModal>
  </div>
</template>
