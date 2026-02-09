<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-lighter-pale-green dark:border-gray-700 flex flex-col items-center text-center transition-colors duration-300">
    <div class="text-4xl mb-2" :class="iconClass">
      <slot name="icon">
        <i :class="icon"></i>
      </slot>
    </div>
    <div class="text-3xl font-black text-primary-green dark:text-pale-green">{{ value }}</div>
    <div class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ title }}</div>
    <div v-if="subtitle" class="text-xs text-gray-400 dark:text-gray-500 mt-1 whitespace-pre-line">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon?: string
  iconClass?: string
  subtitle?: string
}>()
</script>
