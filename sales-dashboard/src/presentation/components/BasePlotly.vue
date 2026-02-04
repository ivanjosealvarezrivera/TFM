<template>
  <div ref="plotlyDiv" class="w-full h-full min-h-[400px]"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Plotly from 'plotly.js-dist-min'
import type { Data, Layout } from 'plotly.js'

const props = defineProps<{
  data: Data[]
  layout: Partial<Layout>
}>()

const plotlyDiv = ref<HTMLElement | null>(null)

const renderPlotly = () => {
  if (plotlyDiv.value) {
    const layout = {
      ...props.layout,
      width: plotlyDiv.value.clientWidth,
      height: plotlyDiv.value.clientHeight
    }
    
    Plotly.react(plotlyDiv.value, props.data, layout, { 
      responsive: true,
      displayModeBar: false 
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
  window.addEventListener('resize', handleResize)
  
  // Refuerzo pasados unos ms por si el layout de la página ha cambiado
  setTimeout(handleResize, 500)
})

onUnmounted(() => {
  if (plotlyDiv.value) Plotly.purge(plotlyDiv.value)
  window.removeEventListener('resize', handleResize)
})

watch(() => [props.data, props.layout], () => {
  renderPlotly()
}, { deep: true })
</script>
