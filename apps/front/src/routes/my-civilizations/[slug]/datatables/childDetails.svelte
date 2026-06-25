<script lang="ts">
	import { OCCUPATIONS } from '$lib/translations'
	import { Gender, type OccupationTypes } from '@ajustor/simulation'
	import Icon from '@iconify/svelte'

	type Props = {
		gender: Gender
		occupation?: OccupationTypes
	}

	const GenderIcons = {
		[Gender.FEMALE]: 'noto:female-sign',
		[Gender.MALE]: 'noto:male-sign',
		[Gender.UNKNOWN]: 'Inconnu'
	}

	let { gender, occupation }: Props = $props()
</script>

<span style="color:oklch(0.4 0.04 50); font-size:14px;">
	<ul style="margin:0; padding-left:16px; list-style:disc;">
		<li>Genre: <Icon icon={GenderIcons[gender]} /></li>
		{#if occupation}
			<li>Occupation: {OCCUPATIONS[occupation]}</li>
		{/if}
	</ul>
</span>
