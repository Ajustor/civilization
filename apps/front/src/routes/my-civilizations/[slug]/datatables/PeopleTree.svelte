<script lang="ts">
	import { Gender, type PeopleType } from '@ajustor/simulation'
	import FamilyTree from '@balkangraph/familytree.js'
	import { onMount } from 'svelte'

	export let data: PeopleType[]

	let tree: HTMLElement

	onMount(() => {
		const baseTree = data.map(({ id, lineage, gender, name }, _, people) => {
			const pids: string[] = []

			if (gender === Gender.FEMALE) {
				const myChildren = people.filter(({ lineage }) => lineage && lineage.mother.id === id)
				pids.push(...myChildren.map(({ lineage }) => lineage!.father.id))
			}

			if (gender === Gender.MALE) {
				const myChildren = people.filter(({ lineage }) => lineage && lineage.father.id === id)
				pids.push(...myChildren.map(({ lineage }) => lineage!.mother.id))
			}

			return {
				id,
				gender,
				name,
				...(lineage && { mid: lineage.mother.id, fid: lineage.father.id }),
				pids
			}
		})

		new FamilyTree(tree, {
			nodeBinding: {
				field_0: 'name'
			},
			nodes: baseTree
		})

		console.log('PLOP', baseTree)
	})
</script>

<div class="h-full w-full" bind:this={tree}></div>
