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
        i === props.highlight ? '#00d09c' : (colorMode.preference === 'dark' ? '#242427' : '#e5e5e5')
      ),
      borderRadius: 8,
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
      backgroundColor: colorMode.preference === 'dark' ? '#1a1a1d' : '#ffffff',
      titleColor: colorMode.preference === 'dark' ? '#a0a0a8' : '#666666',
      bodyColor: colorMode.preference === 'dark' ? '#fafafa' : '#0c0c0e',
      borderColor: colorMode.preference === 'dark' ? '#2a2a2d' : '#e5e5e5',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: { family: 'JetBrains Mono', size: 10 },
      bodyFont: { family: 'JetBrains Mono', size: 12, weight: 'bold' },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        font: { family: 'JetBrains Mono', size: 10 },
        color: '#a0a0a8',
      },
    },
    y: {
      display: false,
      grid: { display: false },
    },
  },
}))
</script>
