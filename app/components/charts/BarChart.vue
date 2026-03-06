<template>
  <div class="chart-wrap" :style="{ height: height + 'px' }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps<{
  months: Array<{ month: number; gross: number; net: number }>
  height?: number
  highlight?: number
}>()

const colorMode = useColorMode()
const { eur } = useFmt()

const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

const chartData = computed(() => ({
  labels: MONTH_LABELS,
  datasets: [
    {
      label: 'Gross',
      data: props.months.map(m => m.gross),
      backgroundColor: props.months.map((m, i) =>
        i === props.highlight ? '#1f8f69' : (colorMode.value === 'dark' ? '#27493f' : '#e6dccb')
      ),
      borderRadius: 999,
      borderSkipped: false,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => eur(ctx.raw),
      },
      backgroundColor: colorMode.value === 'dark' ? '#0f1f1a' : '#fffdf8',
      titleColor: colorMode.value === 'dark' ? '#99aba5' : '#6f7d78',
      bodyColor: colorMode.value === 'dark' ? '#f7f4eb' : '#1f2e29',
      borderColor: colorMode.value === 'dark' ? '#27493f' : '#e0d7c5',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      titleFont: { family: 'IBM Plex Mono', size: 10 },
      bodyFont: { family: 'IBM Plex Mono', size: 12, weight: 'bold' },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        font: { family: 'IBM Plex Mono', size: 10 },
        color: colorMode.value === 'dark' ? '#99aba5' : '#6f7d78',
      },
    },
    y: {
      display: false,
      grid: { display: false },
    },
  },
}))
</script>
