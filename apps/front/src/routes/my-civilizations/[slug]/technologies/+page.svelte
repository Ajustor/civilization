<script lang="ts">
	import type { PageData } from './$types'
	import { TECH_TREE, type TechNode } from '@ajustor/simulation'
	import { techNames } from '$lib/translations'
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'
	import { invalidateAll } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import { onMount } from 'svelte'

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

	// Emblème par technologie — un petit blason qui ancre chaque nœud.
	const emblems: Record<string, string> = {
		craftsmanship: '🪚',
		masonry: '🧱',
		agronomy: '🌾',
		warehousing: '📦',
		mechanization: '⚙️',
		medicine: '⚕️',
		metallurgy: '⚔️',
		philosophy: '📜',
		irrigation: '💧',
		demography: '👨‍👩‍👧',
		logistics: '📋',
		armory: '🛡️',
		engineering: '🔧',
		sciences: '🔭',
		alchemy: '⚗️',
		hydraulics: '🌊',
		astronomy: '⭐',
		urbanism: '🏛️',
		commerce: '🛒',
		husbandry: '🐄',
		pottery: '🏺',
		hunting: '🏹',
		fortification: '🏰',
		theology: '⛪',
		navigation: '⛵',
		cartography: '🗺️',
		industry: '🏭',
		artillery: '💣',
		advanced_medicine: '💊',
		diplomacy: '🤝',
	}

	// ── Disposition en arbre ───────────────────────────────────────────────────
	// Profondeur d'un nœud = plus long chemin depuis une racine (sans prérequis).
	// Les nœuds d'une même profondeur forment une colonne (un « palier »).
	const byId = new Map<string, TechNode>(TECH_TREE.map((n) => [n.id, n]))
	const depthCache = new Map<string, number>()
	const depthOf = (id: string): number => {
		const cached = depthCache.get(id)
		if (cached !== undefined) return cached
		const node = byId.get(id)
		const depth =
			!node || node.prerequisites.length === 0
				? 0
				: 1 + Math.max(...node.prerequisites.map(depthOf))
		depthCache.set(id, depth)
		return depth
	}
	const tiers = (() => {
		const grouped = new Map<number, TechNode[]>()
		for (const node of TECH_TREE) {
			const depth = depthOf(node.id)
			;(grouped.get(depth) ?? grouped.set(depth, []).get(depth)!).push(node)
		}
		return [...grouped.entries()]
			.sort(([a], [b]) => a - b)
			.map(([depth, nodes]) => ({ depth, nodes }))
	})()
	const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

	// ── Branches (lignes SVG entre prérequis et nœud) ──────────────────────────
	let treeEl = $state<HTMLDivElement>()
	const nodeEls: Record<string, HTMLElement> = {}
	type Edge = { d: string; tone: 'on' | 'reachable' | 'off' }
	let edges = $state<Edge[]>([])
	let svgW = $state(0)
	let svgH = $state(0)
	let resizeTick = $state(0)

	const measure = () => {
		if (!treeEl) return
		const base = treeEl.getBoundingClientRect()
		const next: Edge[] = []
		for (const node of TECH_TREE) {
			const childEl = nodeEls[node.id]
			if (!childEl) continue
			const c = childEl.getBoundingClientRect()
			for (const preId of node.prerequisites) {
				const preEl = nodeEls[preId]
				if (!preEl) continue
				const p = preEl.getBoundingClientRect()
				const x1 = p.right - base.left + treeEl.scrollLeft
				const y1 = p.top - base.top + p.height / 2 + treeEl.scrollTop
				const x2 = c.left - base.left + treeEl.scrollLeft
				const y2 = c.top - base.top + c.height / 2 + treeEl.scrollTop
				const dx = Math.max(36, (x2 - x1) * 0.5)
				const tone: Edge['tone'] =
					researched.includes(node.id) && researched.includes(preId)
						? 'on'
						: researched.includes(preId)
							? 'reachable'
							: 'off'
				next.push({ d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`, tone })
			}
		}
		svgW = treeEl.scrollWidth
		svgH = treeEl.scrollHeight
		edges = next
	}

	// Re-mesure quand l'état de recherche change (couleurs/branches) ou au resize.
	$effect(() => {
		void researched.length
		void points
		void resizeTick
		measure()
	})

	onMount(() => {
		const schedule = () => requestAnimationFrame(() => resizeTick++)
		const ro = new ResizeObserver(schedule)
		if (treeEl) ro.observe(treeEl)
		window.addEventListener('resize', schedule)
		// Les polices d'affichage décalent la mise en page une fois chargées.
		document.fonts?.ready.then(schedule)
		return () => {
			ro.disconnect()
			window.removeEventListener('resize', schedule)
		}
	})

	const edgeStroke: Record<Edge['tone'], string> = {
		on: 'oklch(0.55 0.13 145)',
		reachable: 'oklch(0.58 0.13 45)',
		off: 'oklch(0.62 0.03 60)'
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

	<div class="civ-card" style="display:flex; flex-direction:column; gap:18px;">
		<div class="tt-head">
			<h1>Arbre des savoirs</h1>
			<div class="tt-points"><span class="gem">◈</span> {points} <span class="lbl">points de recherche</span></div>
		</div>

		<!-- Légende -->
		<div class="tt-legend">
			<span><i class="dot" style="background:oklch(0.55 0.13 145);"></i> Acquise</span>
			<span><i class="dot" style="background:oklch(0.5 0.13 34);"></i> Disponible</span>
			<span><i class="dot" style="background:oklch(0.6 0.05 60);"></i> Points insuffisants</span>
			<span><i class="dot" style="background:oklch(0.7 0.02 60);"></i> Verrouillée</span>
		</div>

		<!-- L'arbre -->
		<div class="tree" bind:this={treeEl}>
			<svg class="branches" width={svgW} height={svgH} viewBox="0 0 {svgW} {svgH}" aria-hidden="true">
				{#each edges as edge}
					<path
						d={edge.d}
						fill="none"
						stroke={edgeStroke[edge.tone]}
						stroke-width={edge.tone === 'off' ? 2 : 3}
						stroke-linecap="round"
						stroke-dasharray={edge.tone === 'off' ? '2 7' : 'none'}
						opacity={edge.tone === 'on' ? 0.95 : edge.tone === 'reachable' ? 0.85 : 0.45}
					/>
				{/each}
			</svg>

			<div class="tiers-row">
				{#each tiers as tier}
					<div class="tier">
						<div class="tier-label">Palier {ROMAN[tier.depth] ?? tier.depth + 1}</div>
						<div class="tier-nodes">
							{#each tier.nodes as node (node.id)}
								{@const state = stateOf(node)}
								<div class="node {state}" bind:this={nodeEls[node.id]}>
									<div class="node-top">
										<span class="emblem">{emblems[node.id] ?? '✦'}</span>
										<span class="name">{techNames[node.id] ?? node.id}</span>
										<span class="cost">{node.cost}<small>pts</small></span>
									</div>
									<p class="desc">{node.description}</p>
									{#if node.prerequisites.length}
										<div class="prereq">
											Requiert : {node.prerequisites.map((p) => techNames[p] ?? p).join(' · ')}
										</div>
									{/if}

									{#if state === 'researched'}
										<div class="badge done">✓ Acquise</div>
									{:else if state === 'locked'}
										<div class="badge locked">🔒 Verrouillée</div>
									{:else}
										<button
											class="research"
											onclick={() => unlock(node)}
											disabled={state !== 'available' || busy === node.id}
										>
											{state === 'available'
												? busy === node.id
													? 'Patientez…'
													: 'Rechercher'
												: 'Points insuffisants'}
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.tt-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 10px;
		border-bottom: 2px solid oklch(0.72 0.05 60);
		padding-bottom: 16px;
	}
	.tt-head h1 {
		font-family: 'Tangerine', cursive;
		font-size: clamp(32px, 5.5vw, 46px);
		margin: 0;
		color: oklch(0.3 0.04 40);
	}
	.tt-points {
		font-family: 'Marcellus', serif;
		font-size: 20px;
		color: oklch(0.42 0.1 250);
		display: flex;
		align-items: baseline;
		gap: 7px;
	}
	.tt-points .gem {
		color: oklch(0.55 0.14 250);
	}
	.tt-points .lbl {
		font-size: 14px;
		color: oklch(0.5 0.04 250);
	}

	.tt-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 20px;
		font-family: 'EB Garamond', serif;
		font-size: 14px;
		color: oklch(0.48 0.03 50);
	}
	.tt-legend span {
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}
	.tt-legend .dot {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		display: inline-block;
	}

	/* Surface de l'arbre : un vélin patiné qui défile horizontalement */
	.tree {
		position: relative;
		overflow-x: auto;
		overflow-y: hidden;
		padding: 10px 4px 18px;
		border-radius: 5px;
		background:
			radial-gradient(circle at 12% 0%, oklch(0.9 0.03 78 / 0.5), transparent 45%),
			radial-gradient(circle at 88% 100%, oklch(0.88 0.035 66 / 0.5), transparent 45%),
			repeating-linear-gradient(90deg, transparent 0 38px, oklch(0.6 0.04 60 / 0.05) 38px 39px),
			oklch(0.965 0.018 84);
		border: 1px solid oklch(0.8 0.045 70);
		box-shadow: inset 0 0 24px oklch(0.6 0.06 60 / 0.12);
	}

	.branches {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		overflow: visible;
	}

	.tiers-row {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: stretch;
		gap: 64px;
		width: max-content;
		padding: 6px 10px;
	}

	.tier {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 232px;
	}
	.tier-label {
		font-family: 'Marcellus', serif;
		font-size: 12px;
		letter-spacing: 0.32em;
		text-transform: uppercase;
		color: oklch(0.56 0.06 55);
		text-align: center;
		padding-bottom: 4px;
		border-bottom: 1px dashed oklch(0.78 0.05 60);
	}
	.tier-nodes {
		display: flex;
		flex-direction: column;
		gap: 18px;
		justify-content: center;
		flex: 1;
	}

	/* Nœud */
	.node {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 13px 15px;
		border-radius: 6px;
		border: 1px solid oklch(0.8 0.04 70);
		border-left: 4px solid oklch(0.7 0.02 60);
		background: oklch(0.985 0.012 84);
		box-shadow: 0 4px 14px oklch(0.5 0.06 60 / 0.1);
		transition: transform 0.16s ease, box-shadow 0.16s ease;
	}
	.node:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 22px oklch(0.5 0.06 60 / 0.18);
	}
	.node.researched {
		border-left-color: oklch(0.55 0.13 145);
		background: linear-gradient(oklch(0.97 0.03 145 / 0.4), oklch(0.985 0.012 84));
	}
	.node.available {
		border-left-color: oklch(0.5 0.13 34);
		box-shadow: 0 0 0 1px oklch(0.6 0.13 34 / 0.25), 0 6px 18px oklch(0.5 0.13 34 / 0.16);
		animation: ember 2.4s ease-in-out infinite;
	}
	.node.tooExpensive {
		border-left-color: oklch(0.6 0.06 60);
	}
	.node.locked {
		border-left-color: oklch(0.72 0.02 60);
		opacity: 0.62;
		filter: saturate(0.6);
	}
	@keyframes ember {
		0%, 100% { box-shadow: 0 0 0 1px oklch(0.6 0.13 34 / 0.2), 0 6px 18px oklch(0.5 0.13 34 / 0.12); }
		50% { box-shadow: 0 0 0 2px oklch(0.6 0.13 34 / 0.4), 0 8px 24px oklch(0.5 0.13 34 / 0.26); }
	}

	.node-top {
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.emblem {
		font-size: 19px;
		line-height: 1;
		flex-shrink: 0;
	}
	.node .name {
		font-family: 'Marcellus', serif;
		font-size: 17px;
		color: oklch(0.32 0.04 40);
		flex: 1;
		min-width: 0;
	}
	.node .cost {
		font-family: 'Marcellus', serif;
		font-size: 15px;
		color: oklch(0.45 0.1 250);
		white-space: nowrap;
	}
	.node .cost small {
		font-size: 11px;
		margin-left: 2px;
		color: oklch(0.55 0.05 250);
	}
	.node .desc {
		margin: 0;
		font-family: 'EB Garamond', serif;
		font-size: 14.5px;
		line-height: 1.45;
		color: oklch(0.43 0.03 50);
	}
	.node .prereq {
		font-family: 'EB Garamond', serif;
		font-size: 12.5px;
		color: oklch(0.56 0.04 55);
		font-style: italic;
	}

	.badge {
		font-family: 'Marcellus', serif;
		font-size: 14px;
		align-self: flex-start;
	}
	.badge.done {
		color: oklch(0.48 0.13 145);
		font-weight: 600;
	}
	.badge.locked {
		color: oklch(0.58 0.03 60);
	}

	.research {
		align-self: flex-start;
		padding: 8px 18px;
		border: none;
		border-radius: 4px;
		background: oklch(0.5 0.13 34);
		color: oklch(0.97 0.02 84);
		font-family: 'Marcellus', serif;
		font-size: 15px;
		cursor: pointer;
		transition: background 0.15s ease, transform 0.1s ease;
	}
	.research:hover:not(:disabled) {
		background: oklch(0.45 0.14 34);
		transform: translateY(-1px);
	}
	.research:disabled {
		background: oklch(0.72 0.03 60);
		color: oklch(0.95 0.01 84);
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.tiers-row {
			gap: 48px;
		}
		.tier {
			min-width: 210px;
		}
	}
</style>
