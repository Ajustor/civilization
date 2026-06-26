<script lang="ts">
	import { onMount } from 'svelte'
	import { getWorldsInfos } from '../../services/api/world-api'
	import { resourceNames, eventsName } from '$lib/translations'
	import { type ResourceTypes, type Events } from '@ajustor/simulation'

	type WorldInfo = Awaited<ReturnType<typeof getWorldsInfos>>[number]

	let worlds = $state<WorldInfo[]>([])
	let selectedWorldId = $state<string>('')
	let loading = $state(true)

	onMount(async () => {
		try {
			worlds = (await getWorldsInfos()) ?? []
			selectedWorldId = worlds[0]?.id ?? ''
		} catch (error) {
			console.error(error)
		} finally {
			loading = false
		}
	})

	const selectedWorld = $derived(worlds.find((w) => w.id === selectedWorldId) ?? null)

	// Seasonal resource multipliers — mirror the values applied in the simulation
	// (World.passResources). Generation = base config × multiplier.
	const SEASONS = [
		{ name: 'Printemps', months: [0, 1, 2], food: 1.5, wood: 1.1, color: 'oklch(0.52 0.1 130)' },
		{ name: 'Été', months: [3, 4, 5], food: 1.75, wood: 1.2, color: 'oklch(0.6 0.12 70)' },
		{ name: 'Automne', months: [6, 7, 8], food: 1.2, wood: 1, color: 'oklch(0.55 0.1 50)' },
		{ name: 'Hiver', months: [9, 10, 11], food: 0.5, wood: 0.75, color: 'oklch(0.5 0.05 240)' }
	]

	const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')
	const currentSeason = $derived(
		selectedWorld ? SEASONS.find((s) => s.months.includes(selectedWorld.month)) ?? null : null
	)
	const civilizationsCount = $derived(selectedWorld?.civilizations?.length ?? 0)
</script>

<svelte:head>
	<title>Les règles — Civilizations</title>
	<meta name="description" content="Les règles de la simulation de civilisation" />
</svelte:head>

<div class="civ-page-wrapper">
	<div class="civ-card civ-animate-in">
		<div style="border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:20px; margin-bottom:28px;">
			<div style="font-family:'Marcellus',serif; font-size:13px; letter-spacing:.4em; text-transform:uppercase; color:oklch(0.5 0.09 40); margin-bottom:6px;">Simulation</div>
			<h1 style="font-family:'Tangerine',cursive; font-size:clamp(34px,6vw,46px); margin:0; color:oklch(0.3 0.04 40);">Les règles du monde</h1>
		</div>

		<!-- Sélecteur de monde -->
		<div class="civ-inner-card" style="margin-bottom:24px;">
			<h2 class="civ-section-title">Choisir un monde</h2>
			{#if loading}
				<p style="color:oklch(0.5 0.03 50); font-size:16px;">Chargement des mondes…</p>
			{:else if worlds.length === 0}
				<p style="color:oklch(0.5 0.03 50); font-size:16px;">Aucun monde disponible pour le moment.</p>
			{:else}
				<select
					bind:value={selectedWorldId}
					style="width:100%; max-width:360px; padding:10px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); color:oklch(0.3 0.04 40); font-family:'EB Garamond',serif; font-size:16px;"
				>
					{#each worlds as world}
						<option value={world.id}>{world.name}</option>
					{/each}
				</select>
			{/if}
		</div>

		{#if selectedWorld}
			<!-- État actuel du monde -->
			<section class="civ-inner-card" style="margin-bottom:24px;">
				<h2 class="civ-section-title">État de {selectedWorld.name}</h2>
				<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px;">
					<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px;">
						<div style="font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:4px;">Date</div>
						<div style="font-family:'Marcellus',serif; font-size:20px; color:oklch(0.34 0.04 40);">An {selectedWorld.year} · Mois {selectedWorld.month + 1}</div>
						{#if currentSeason}
							<div style="font-size:15px; color:oklch(0.42 0.03 50); margin-top:2px;">Saison : <strong>{currentSeason.name}</strong></div>
						{/if}
					</div>
					<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px;">
						<div style="font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:4px;">Civilisations</div>
						<div style="font-family:'Marcellus',serif; font-size:20px; color:oklch(0.34 0.04 40);">{fmt(civilizationsCount)}</div>
					</div>
					<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px;">
						<div style="font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:4px;">Prochain événement</div>
						<div style="font-family:'Marcellus',serif; font-size:20px; color:{selectedWorld.nextEvent ? 'oklch(0.5 0.16 30)' : 'oklch(0.34 0.04 40)'};">
							{selectedWorld.nextEvent ? eventsName[selectedWorld.nextEvent as Events] : 'Aucun'}
						</div>
					</div>
					<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px;">
						<div style="font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:4px;">Probabilité d'événement</div>
						<div style="font-family:'Marcellus',serif; font-size:20px; color:oklch(0.34 0.04 40);">{selectedWorld.config.EVENT_CHANCE}%</div>
					</div>
				</div>
			</section>

			<!-- Réserves actuelles du monde -->
			{#if selectedWorld.resources?.length}
				<section class="civ-inner-card" style="margin-bottom:24px;">
					<h2 class="civ-section-title">Réserves actuelles de {selectedWorld.name}</h2>
					<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px;">
						{#each selectedWorld.resources as resource}
							<div style="padding:12px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px; display:flex; justify-content:space-between; align-items:baseline;">
								<span style="font-size:16px; color:oklch(0.42 0.03 50);">{resourceNames[resource.type as ResourceTypes] ?? resource.type}</span>
								<span style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40);">{fmt(resource.quantity)}</span>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Génération de ressources par saison (propre à ce monde) -->
			<section class="civ-inner-card" style="margin-bottom:24px;">
				<h2 class="civ-section-title">Génération de ressources par saison</h2>
				<p style="font-size:15px; color:oklch(0.5 0.03 50); margin:0 0 12px;">
					Chaque mois, {selectedWorld.name} produit ces quantités de base, modulées par la saison.
				</p>
				<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;">
					{#each SEASONS as s}
						<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px; border-top:3px solid {s.color}; {currentSeason?.name === s.name ? 'box-shadow:0 0 0 2px ' + s.color + ' inset;' : ''}">
							<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
								<span style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40);">{s.name}</span>
								{#if currentSeason?.name === s.name}
									<span style="font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:{s.color};">Actuelle</span>
								{/if}
							</div>
							<div style="font-size:15px; color:oklch(0.42 0.03 50); display:flex; flex-direction:column; gap:4px;">
								<span>Nourriture : <strong>{fmt(selectedWorld.config.BASE_FOOD_GENERATION * s.food)}</strong> <span style="color:oklch(0.55 0.03 50); font-size:13px;">(× {s.food})</span></span>
								<span>Bois : <strong>{fmt(selectedWorld.config.BASE_WOOD_GENERATION * s.wood)}</strong> <span style="color:oklch(0.55 0.03 50); font-size:13px;">(× {s.wood})</span></span>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Règles générales (communes à tous les mondes) -->
		<div style="display:flex; flex-direction:column; gap:24px;">

			<!-- Temps -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Le temps qui passe</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Toutes les 15 minutes, un mois passe dans le monde.</li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Un cycle complet de 12 mois correspond à une année. Les saisons se succèdent ainsi : <strong>printemps</strong> (mois 0–2), <strong>été</strong> (3–5), <strong>automne</strong> (6–8), <strong>hiver</strong> (9–11).</li>
				</ul>
			</section>

			<!-- Survie -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Survie des citoyens</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Chaque mois, les citoyens doivent <strong>manger</strong> et disposer d'un <strong>logement</strong> pour rester en vie.</li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>En automne et en hiver, ils ont également besoin de <strong>bois</strong> pour se chauffer.</li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Un citoyen ayant atteint 85 ans a <strong>20 % de chances de mourir</strong> chaque mois.</li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>La population d'une civilisation est <strong>limitée à 100 000 habitants</strong> (hors retraités).</li>
				</ul>
			</section>

			<!-- Reproduction -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Reproduction</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Les citoyens peuvent se reproduire chaque mois à condition d'avoir une <strong>santé d'au moins 8</strong> et d'être âgés de <strong>16 à 60 ans</strong>.</li>
				</ul>
			</section>

			<!-- Métiers -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Métiers</h2>
				<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px; font-size:16px; color:oklch(0.42 0.03 50);">
					<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px;">
						<div style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40); margin-bottom:4px;">Fermier</div>
						<div>Travaille de 4 à 70 ans · consomme 1 de nourriture</div>
					</div>
					<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px;">
						<div style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40); margin-bottom:4px;">Charpentier</div>
						<div>Travaille de 12 à 60 ans · consomme 2 de nourriture</div>
					</div>
				</div>
				<div style="margin-top:12px; padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px; font-size:16px; color:oklch(0.42 0.03 50);">
					<div style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40); margin-bottom:4px;">Bâtiments</div>
					<div>Une <strong>Maison</strong> aide les citoyens à rester en vie en assurant un logement.</div>
				</div>
			</section>

		</div>
	</div>
</div>
