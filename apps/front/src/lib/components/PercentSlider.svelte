<script lang="ts">
	// Curseur de pourcentage doublé d'une saisie directe : les deux champs restent
	// synchronisés sur la même valeur (entière, bornée min/max).
	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		suffix = '%',
		accent = 'oklch(0.5 0.13 34)',
		onValueChange,
		...rest
	}: {
		value?: number
		min?: number
		max?: number
		step?: number
		suffix?: string
		accent?: string
		/** Appelé après chaque changement avec la valeur bornée — utile pour rééquilibrer d'autres jauges. */
		onValueChange?: (value: number) => void
		[key: string]: unknown
	} = $props()

	const apply = (raw: string) => {
		const parsed = Number(raw)
		if (Number.isNaN(parsed) || raw === '') {
			return
		}
		const next = Math.min(max, Math.max(min, Math.round(parsed)))
		value = next
		onValueChange?.(next)
	}
</script>

<span style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
	<input
		type="range"
		{min}
		{max}
		{step}
		value={value}
		oninput={(e) => apply(e.currentTarget.value)}
		style="flex:1; min-width:70px; accent-color:{accent}; cursor:pointer;"
	/>
	<input
		type="number"
		{min}
		{max}
		{step}
		value={value}
		oninput={(e) => apply(e.currentTarget.value)}
		onblur={(e) => {
			// Re-synchronise l'affichage si la saisie a été bornée ou laissée vide.
			e.currentTarget.value = String(value)
		}}
		class="input input-bordered"
		style="width:72px; text-align:right;"
		{...rest}
	/>
	{#if suffix}<span style="color:oklch(0.5 0.03 50); flex-shrink:0;">{suffix}</span>{/if}
</span>
