<script lang="ts">
	import { Chart, type ChartData } from 'chart.js/auto'
	import { onMount } from 'svelte'

	export let data: ChartData<'doughnut'>

	let chart: HTMLCanvasElement

	onMount(() => {
		new Chart(chart, {
			type: 'doughnut',
			data,
			options: {
				responsive: true,
				plugins: {
					legend: {
						labels: {
							color: 'black'
						}
					}
				}
			}
		})
	})
</script>

<canvas bind:this={chart} aria-label="Un graphique en donut"></canvas>
