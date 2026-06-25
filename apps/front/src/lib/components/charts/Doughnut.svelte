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
		DoughnutController,
		Colors
	} from 'chart.js'
	import { onMount } from 'svelte'

	interface Props {
		data: ChartData<'doughnut'>;
	}

	let { data }: Props = $props();

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
