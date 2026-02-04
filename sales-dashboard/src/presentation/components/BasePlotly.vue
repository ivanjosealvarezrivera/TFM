<template>
  <div ref="plotlyDiv" class="w-full h-full min-h-[400px]"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Plotly from 'plotly.js-dist-min'
import type { Data, Layout } from 'plotly.js'

const props = withDefaults(defineProps<{
  data: Data[]
  layout: Partial<Layout>
  displayModeBar?: boolean
}>(), {
  displayModeBar: true
})

const plotlyDiv = ref<HTMLElement | null>(null)

let resizeObserver: ResizeObserver | null = null

const renderPlotly = () => {
  if (plotlyDiv.value) {
    // No pasamos width/height explícitos para dejar que responsive: true 
    // y el contenedor CSS gestionen el tamaño correctamente.
    Plotly.react(plotlyDiv.value, props.data, props.layout, { 
      responsive: true,
      displayModeBar: props.displayModeBar 
    })
  }
}

const handleResize = () => {
  if (plotlyDiv.value) {
    Plotly.Plots.resize(plotlyDiv.value)
  }
}

onMounted(() => {
  renderPlotly()
  
  // Usamos ResizeObserver para detectar cambios en el elemento mismo,
  // no solo en la ventana global del navegador.
  if (plotlyDiv.value) {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(plotlyDiv.value)
  }
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', handleResize)
  if (plotlyDiv.value) Plotly.purge(plotlyDiv.value)
})

watch(() => [props.data, props.layout], () => {
  renderPlotly()
}, { deep: true })
</script>
