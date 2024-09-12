<script lang="ts">
	import { OCCUPATIONS } from '$lib/translations'
	import { Gender, type OccupationTypes } from '@ajustor/simulation'
	import Icon from '@iconify/svelte'

	type Props = {
		name: string
		gender: Gender
		occupation?: OccupationTypes
	}

	const GenderIcons = {
		[Gender.FEMALE]: 'noto:female-sign',
		[Gender.MALE]: 'noto:male-sign',
		[Gender.UNKNOWN]: 'Inconnu'
	}

	let { name, gender, occupation }: Props = $props()
</script>

<span class="text-neutral-content">
	<ul>
		<li>Nom: {name}</li>
		<li>Genre: <Icon icon={GenderIcons[gender]} /></li>
		{#if occupation}
			<li>Occupation: {OCCUPATIONS[occupation]}</li>
		{/if}
	</ul>
</span>
