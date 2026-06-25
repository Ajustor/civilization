<script module>
	export const hydrate = 'visible'
</script>

<script lang="ts">
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		ArcElement,
		CategoryScale,
		type ChartData,
		type ChartOptions,
		DoughnutController,
		Colors
	} from 'chart.js'
	import { onMount } from 'svelte'

	interface Props {
		data: ChartData<'doughnut'>;
		options?: Partial<ChartOptions<'doughnut'>>;
	}

	let { data, options = {} }: Props = $props();

	ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, DoughnutController, Colors)

	let chart: HTMLCanvasElement = $state()

	onMount(() => {
		new ChartJS(chart, {
			type: 'doughnut',
			data,
			options: {
				responsive: true,
				plugins: {
					legend: {
						labels: { color: 'oklch(0.4 0.04 50)' }
					}
				},
				...options
			}
		})
	})
</script>

<canvas bind:this={chart} aria-label="Un graphique en donut"></canvas>
