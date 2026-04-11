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
  labels: props.months.map(m => MONTH_LABELS[m.month]),
  datasets: [
    {
      label: 'Gross',
      data: props.months.map(m => m.gross),
      backgroundColor: props.months.map((m) =>
        m.month === props.highlight ? '#3a4adf' : (colorMode.value === 'dark' ? '#2d2f50' : '#d6d4e0')
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
      backgroundColor: colorMode.value === 'dark' ? '#161630' : '#f4f2f8',
      titleColor: colorMode.value === 'dark' ? '#9698b0' : '#5e5f78',
      bodyColor: colorMode.value === 'dark' ? '#eeedf5' : '#1c1d38',
      borderColor: colorMode.value === 'dark' ? '#2d2f50' : '#d6d4e0',
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
        color: colorMode.value === 'dark' ? '#9698b0' : '#5e5f78',
      },
    },
    y: {
      display: false,
      grid: { display: false },
    },
  },
}))
</script>
