<template>
  <div 
    class="relative group"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <div 
      :class="[
        'flex transition-all duration-300 rounded-2xl border-2 border-dashed',
        compact 
          ? 'flex-row items-center gap-4 p-3' 
          : 'flex-col items-center justify-center p-12 rounded-3xl',
        isDragging 
          ? 'border-primary-green bg-primary-green/5 scale-[1.01] shadow-lg' 
          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 hover:border-primary-green/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
      ]"
    >
      <!-- Icono -->
      <div 
        :class="[
          'flex items-center justify-center transition-all duration-500 shrink-0',
          compact ? 'w-10 h-10 rounded-xl' : 'w-20 h-20 mb-6 rounded-2xl',
          isDragging ? 'bg-primary-green text-white rotate-12' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary-green'
        ]"
      >
        <i :class="['pi', compact ? 'text-xl' : 'text-4xl', isDragging ? 'pi-cloud-download animate-bounce' : 'pi-cloud-upload']"></i>
      </div>

      <!-- Texto informativo (solo en modo normal) -->
      <div v-if="!compact" class="text-center">
        <h2 class="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">Sube un archivo para comenzar</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8 font-medium text-center max-w-sm">
          Arrastra tu archivo Excel (.xlsx) aquí o utiliza el botón inferior para una selección tradicional.
        </p>
      </div>

      <!-- Texto informativo compacto -->
      <div v-else class="flex-1 min-w-0">
        <h4 class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">Archivo de Ventas (.xlsx)</h4>
        <p class="text-[10px] text-gray-400 dark:text-gray-500 truncate italic">Suelta aquí o pulsa el botón</p>
      </div>

      <!-- Bloque de Error (solo en modo normal, en compacto usamos toast o lo mostramos minimalista) -->
      <div v-if="error && !compact" class="mb-8 w-full max-w-2xl animate-fadein">
        <div class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-800 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <i class="pi pi-exclamation-triangle text-xl"></i>
            </div>
            <div>
              <h4 class="text-base font-bold text-red-800 dark:text-red-200">Error en estructura del archivo</h4>
              <p class="text-sm text-red-700 dark:text-red-300 mt-1 opacity-90">{{ error }}</p>
              
              <div v-if="missingCols && missingCols.length > 0" class="mt-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-red-500 dark:text-red-400 mb-2">Columnas faltantes:</p>
                <div class="flex flex-wrap gap-2">
                  <span v-for="col in missingCols" :key="col" class="px-3 py-1 bg-red-200/50 dark:bg-red-800/50 text-red-900 dark:text-red-100 text-[10px] font-bold rounded-lg border border-red-300/50 dark:border-red-700/50 uppercase">
                    {{ col }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón de Acción -->
      <div :class="['flex items-center gap-4', compact ? 'ml-auto' : '']">
        <label 
          :class="[
            'flex items-center gap-2 bg-primary-green hover:bg-darker-green text-white rounded-full font-bold cursor-pointer transition-all active:scale-95 group/btn',
            compact ? 'px-4 py-2 text-xs' : 'px-8 py-4 px-8 py-4 shadow-lg shadow-primary-green/30'
          ]"
        >
          <i :class="['pi pi-file-excel transition-transform group-hover/btn:rotate-12', compact ? 'text-sm' : 'text-xl']"></i>
          <span>{{ compact ? 'Elegir' : 'Elegir archivo' }}</span>
          <input 
            type="file" 
            class="hidden" 
            accept=".xlsx" 
            @change="handleFileSelect"
          >
        </label>
      </div>

      <!-- Tags informativos (solo en modo normal) -->
      <div v-if="!compact" class="mt-8 flex gap-6">
        <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <i class="pi pi-check-circle text-primary-green"></i>
          <span>Formato Excel</span>
        </div>
        <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <i class="pi pi-check-circle text-primary-green"></i>
          <span>Análisis Instantáneo</span>
        </div>
      </div>
    </div>

    <!-- Overlay de Drag Activo -->
    <div 
      v-if="isDragging"
      class="absolute inset-0 z-10 pointer-events-none border-4 border-primary-green border-double rounded-3xl animate-pulse"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  error?: string | null;
  missingCols?: string[];
  compact?: boolean;
}>();

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>();

const isDragging = ref(false);

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file && file.name.endsWith('.xlsx')) {
      emit('file-selected', file);
    }
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    if (file) {
      emit('file-selected', file);
    }
  }
};
</script>

<style scoped>
@keyframes pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.7; }
  100% { opacity: 0.3; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
