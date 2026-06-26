<script lang="ts">
	import type { PageData } from './$types'
	import { TECH_TREE, type TechNode } from '@ajustor/simulation'
	import { techNames } from '$lib/translations'
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'
	import { invalidateAll } from '$app/navigation'
	import { toast } from 'svelte-sonner'

	let { data }: { data: PageData } = $props()

	let points = $derived(data.civilization.researchPoints ?? 0)
	let researched = $derived<string[]>(data.civilization.researchedTechs ?? [])
	let busy = $state<string | null>(null)

	type NodeState = 'researched' | 'available' | 'tooExpensive' | 'locked'
	const stateOf = (node: TechNode): NodeState => {
		if (researched.includes(node.id)) return 'researched'
		if (!node.prerequisites.every((p) => researched.includes(p))) return 'locked'
		return points >= node.cost ? 'available' : 'tooExpensive'
	}
	const stateColor: Record<NodeState, string> = {
		researched: 'oklch(0.5 0.12 145)',
		available: 'oklch(0.5 0.13 34)',
		tooExpensive: 'oklch(0.55 0.05 60)',
		locked: 'oklch(0.6 0.02 60)'
	}

	const unlock = async (node: TechNode) => {
		if (stateOf(node) !== 'available') return
		busy = node.id
		try {
			const res = await fetch(`/my-civilizations/${data.civilization.id}/technologies`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ techId: node.id })
			})
			const result = await res.json()
			if (!res.ok || result?.error) {
				toast.error(result?.error ?? 'Impossible de débloquer cette technologie')
				return
			}
			toast.success(`${techNames[node.id] ?? node.id} débloquée`)
			await invalidateAll()
		} catch (error) {
			console.error(error)
			toast.error('Une erreur est survenue')
		} finally {
			busy = null
		}
	}
</script>

<svelte:head><title>Technologies — {data.civilization.name}</title></svelte:head>

<div class="civ-page-wrapper">
	<Breadcrumb items={[
		{ label: 'Mes civilisations', href: '/my-civilizations' },
		{ label: data.civilization.name, href: `/my-civilizations/${data.civilization.id}` },
		{ label: 'Technologies' }
	]} />

	<div class="civ-card" style="display:flex; flex-direction:column; gap:20px;">
		<div style="display:flex; justify-content:space-between; align-items:baseline; border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:16px;">
			<h1 style="font-family:'Tangerine',cursive; font-size:clamp(30px,5vw,42px); margin:0; color:oklch(0.3 0.04 40);">Technologies</h1>
			<div style="font-family:'Marcellus',serif; font-size:20px; color:oklch(0.45 0.1 250);">{points} points de recherche</div>
		</div>

		<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px;">
			{#each TECH_TREE as node (node.id)}
				{@const state = stateOf(node)}
				<div style="border:1px solid oklch(0.82 0.04 70); border-left:4px solid {stateColor[state]}; border-radius:4px; padding:14px 16px; display:flex; flex-direction:column; gap:8px; background:oklch(0.97 0.015 84); opacity:{state === 'locked' ? 0.6 : 1};">
					<div style="display:flex; justify-content:space-between; align-items:baseline;">
						<span style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40);">{techNames[node.id] ?? node.id}</span>
						<span style="font-size:14px; color:oklch(0.5 0.04 50);">{node.cost} pts</span>
					</div>
					<div style="font-size:15px; color:oklch(0.42 0.03 50);">{node.description}</div>
					{#if node.prerequisites.length}
						<div style="font-size:13px; color:oklch(0.55 0.03 50);">Prérequis : {node.prerequisites.map((p) => techNames[p] ?? p).join(', ')}</div>
					{/if}
					{#if state === 'researched'}
						<div style="font-size:14px; font-weight:600; color:{stateColor.researched};">✓ Acquise</div>
					{:else if state === 'locked'}
						<div style="font-size:14px; color:{stateColor.locked};">Verrouillée</div>
					{:else}
						<button
							onclick={() => unlock(node)}
							disabled={state !== 'available' || busy === node.id}
							style="align-self:flex-start; padding:8px 16px; border:none; border-radius:4px; background:{state === 'available' ? stateColor.available : 'oklch(0.7 0.02 60)'}; color:oklch(0.96 0.02 84); font-family:'Marcellus',serif; font-size:15px; cursor:{state === 'available' ? 'pointer' : 'not-allowed'}; opacity:{busy === node.id ? 0.6 : 1};"
						>{state === 'available' ? (busy === node.id ? 'Patientez…' : 'Rechercher') : 'Points insuffisants'}</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
