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
		BarController,
		Colors,
		LinearScale,
		LineController,
		PointElement,
		LineElement,
		BarElement
	} from 'chart.js'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: any; // supports mixed bar+line datasets
		options?: Partial<ChartOptions<'bar'>>;
	}

	let { data, options = {} }: Props = $props();

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

	// Rebuild the chart whenever `data`/`options` change. The previous version only
	// drew once in onMount, so the live auto-refresh (and any reactive data update)
	// never reached the canvas. Destroying the prior instance avoids leaking charts.
	$effect(() => {
		const instance = new ChartJS(chart, {
			type: 'bar',
			data,
			options: {
				scales: { y: { beginAtZero: true } },
				...options
			}
		})
		return () => instance.destroy()
	})
</script>

<canvas bind:this={chart} aria-label="Un graphique en bar"></canvas>
