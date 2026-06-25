<script module>
	export const hydrate = 'visible' // ou 'visible' pour hydrater seulement quand l'élément est visible
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
		BarController,
		Colors,
		LinearScale,
		LineController,
		PointElement,
		LineElement,
		BarElement
	} from 'chart.js'
	import { onMount } from 'svelte'

	interface Props {
		data: ChartData<'bar'>;
	}

	let { data }: Props = $props();

	ChartJS.register(
		Title,
		PointElement,
		LineElement,
		BarElement,
		Tooltip,
		Legend,
		ArcElement,
		CategoryScale,
		BarController,
		Colors,
		LinearScale,
		LineController
	)

	let chart: HTMLCanvasElement = $state()

	onMount(() => {
		new ChartJS(chart, {
			type: 'bar',
			data,
			options: {
				scales: {
					y: {
						beginAtZero: true
					}
				}
			}
		})
	})
</script>

<canvas bind:this={chart} aria-label="Un graphique en bar"></canvas>
