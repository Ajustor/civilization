<script lang="ts">
	import { onMount } from 'svelte'
	import { getWorldsInfos } from '../../services/api/world-api'
	import { resourceNames, eventsName, eventsDescription } from '$lib/translations'
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
	// (World.passAMonth). Generation = base config × multiplier.
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

	// ── Données de règles (valeurs issues de la simulation) ────────────────────
	const OCCUPATION_RULES = [
		{ name: 'Enfant', age: 'dès 4 ans (peut évoluer à 12 ans)', eat: 1, role: 'Récolte 5 nourriture ou pierre par mois' },
		{ name: 'Récolteur', age: "jusqu'à 70 ans", eat: 2, role: 'Récolte 20 nourriture ou pierre par mois' },
		{ name: 'Coupeur de bois', age: "jusqu'à 60 ans", eat: 2, role: 'Récolte 10 bois par mois' },
		{ name: 'Fermier', age: "jusqu'à 70 ans", eat: 3, role: 'Exploite une Ferme (jusqu’à 100 nourriture / mois)' },
		{ name: 'Charpentier', age: "jusqu'à 60 ans", eat: 3, role: 'Exploite une Scierie (produit des planches)' },
		{ name: 'Charbonnier', age: '12 à 60 ans', eat: 3, role: 'Exploite un Four à chaux (produit du charbon)' },
		{ name: 'Commis de cuisine', age: "jusqu'à 70 ans", eat: 2, role: 'Exploite un Feu de camp (produit de la nourriture préparée)' },
		{ name: 'Mineur', age: "jusqu'à 50 ans", eat: 3, role: 'Exploite une Mine (produit de la pierre)' },
		{ name: 'Soldat', age: "jusqu'à 60 ans", eat: 3, role: 'Défend la civilisation et mène les attaques' },
		{ name: 'Retraité', age: 'après la vie active', eat: 1, role: 'Ne travaille plus' }
	]

	const BUILDING_RULES = [
		{ name: 'Maison', cost: '15 bois', time: '2 mois', build: '—', operate: '—', effect: 'Loge 4 citoyens (un logement évite la perte de point de vie)' },
		{ name: 'Ferme', cost: '10 planches + 10 pierre', time: '2 mois', build: '2 récolteurs', operate: '5 fermiers', effect: 'Produit 100 nourriture / mois' },
		{ name: 'Four à chaux', cost: '20 pierre', time: '4 mois', build: '2 coupeurs de bois', operate: '2 charbonniers', effect: '5 bois → 10 charbon' },
		{ name: 'Scierie', cost: '15 pierre', time: '4 mois', build: '—', operate: '2 charpentiers', effect: '1 bois → 5 planches' },
		{ name: 'Mine', cost: 'aucun', time: '10 mois', build: '5 récolteurs', operate: '10 mineurs', effect: 'Produit de la pierre (1 à 100 par mineur)' },
		{ name: 'Feu de camp', cost: '15 bois', time: '2 mois', build: '2 récolteurs', operate: '1 commis de cuisine', effect: '10 nourriture → 7 nourriture préparée' },
		{ name: 'Entrepôt', cost: 'aucun', time: '1 mois', build: '1 récolteur', operate: '—', effect: 'Stocke et protège les ressources (nourriture 300, pierre 300, bois 150, charbon 150, planches 150, nourriture préparée 100). Indestructible.' },
		{ name: 'Muraille', cost: '2000 pierre + 1500 bois', time: '12 mois', build: '250 bâtisseurs', operate: '—', effect: 'Bloque une attaque entière, puis est détruite' }
	]

	const eventEntries = Object.entries(eventsName) as [Events, string][]
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
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Toutes les 15 minutes, un mois passe dans le monde.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Un cycle complet de 12 mois correspond à une année. Les saisons se succèdent ainsi : <strong>printemps</strong> (mois 0–2), <strong>été</strong> (3–5), <strong>automne</strong> (6–8), <strong>hiver</strong> (9–11).</span></li>
				</ul>
			</section>

			<!-- Survie -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Survie des citoyens</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Chaque citoyen a une jauge de <strong>points de vie</strong> (12 au maximum). Elle monte quand il mange et baisse quand il manque de l'essentiel.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span><strong>Nourriture</strong> : la nourriture préparée est consommée en priorité (rend de la vie). À défaut, la nourriture brute est consommée en plus grande quantité pour un effet moindre. Le besoin dépend du métier (de 1 à 3 par mois).</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Sans aucune nourriture, un citoyen perd <strong>4 points de vie</strong> dans le mois.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span><strong>Logement</strong> : une Maison loge 4 citoyens. Un citoyen sans logement perd <strong>1 point de vie</strong> par mois.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span><strong>Chauffage</strong> : en automne (2 bois/personne) et en hiver (3 bois/personne), il faut se chauffer. Le charbon est plus efficace : 1 charbon chauffe 10 personnes. Un citoyen non chauffé perd <strong>1 point de vie</strong> par mois.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>À partir de <strong>85 ans</strong>, un citoyen a <strong>20 % de chances de mourir</strong> chaque mois.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Le nombre d'actifs d'une civilisation est <strong>plafonné</strong> (100 000 par défaut, configurable).</span></li>
				</ul>
			</section>

			<!-- Reproduction -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Reproduction</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Pour concevoir, un citoyen doit avoir entre <strong>16 et 50 ans</strong>, une <strong>santé d'au moins 8</strong>, et ne pas déjà attendre d'enfant.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Une <strong>grossesse dure 9 mois</strong>. Chaque citoyen peut avoir jusqu'à <strong>3 enfants</strong> au cours de sa vie.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Chaque mois, un couple éligible a une <strong>probabilité de conception</strong> (60 % par défaut, configurable).</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Le nombre d'enfants à naître <strong>simultanément</strong> dans la civilisation est limité (10 par défaut, configurable).</span></li>
				</ul>
			</section>

			<!-- Métiers -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Métiers</h2>
				<p style="font-size:15px; color:oklch(0.5 0.03 50); margin:0 0 14px;">
					Les enfants, récolteurs et coupeurs de bois peuvent <strong>évoluer</strong> vers un métier spécialisé (20 % de chance par mois). Les métiers spécialisés font fonctionner les bâtiments de production.
				</p>
				<div style="overflow-x:auto;">
					<table style="width:100%; border-collapse:collapse; font-family:'EB Garamond',serif; font-size:15px; color:oklch(0.4 0.03 50);">
						<thead>
							<tr style="border-bottom:2px solid oklch(0.78 0.04 70);">
								<th style="text-align:left; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Métier</th>
								<th style="text-align:left; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Travaille</th>
								<th style="text-align:center; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Nourriture / mois</th>
								<th style="text-align:left; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Rôle</th>
							</tr>
						</thead>
						<tbody>
							{#each OCCUPATION_RULES as job}
								<tr style="border-bottom:1px solid oklch(0.88 0.03 70);">
									<td style="padding:8px 12px; font-family:'Marcellus',serif; color:oklch(0.34 0.04 40);">{job.name}</td>
									<td style="padding:8px 12px;">{job.age}</td>
									<td style="padding:8px 12px; text-align:center;">{job.eat}</td>
									<td style="padding:8px 12px;">{job.role}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>

			<!-- Bâtiments -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Bâtiments</h2>
				<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:12px;">
					{#each BUILDING_RULES as b}
						<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px; display:flex; flex-direction:column; gap:6px;">
							<div style="font-family:'Marcellus',serif; font-size:19px; color:oklch(0.34 0.04 40);">{b.name}</div>
							<div style="font-size:15px; color:oklch(0.42 0.03 50);">{b.effect}</div>
							<div style="display:grid; grid-template-columns:auto 1fr; gap:2px 10px; font-size:14px; color:oklch(0.5 0.03 50); margin-top:4px;">
								<span style="color:oklch(0.55 0.04 55);">Coût</span><span>{b.cost}</span>
								<span style="color:oklch(0.55 0.04 55);">Durée</span><span>{b.time}</span>
								<span style="color:oklch(0.55 0.04 55);">Construit par</span><span>{b.build}</span>
								<span style="color:oklch(0.55 0.04 55);">Exploité par</span><span>{b.operate}</span>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Événements -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Événements</h2>
				<p style="font-size:15px; color:oklch(0.5 0.03 50); margin:0 0 14px;">
					Chaque mois, selon la <strong>probabilité d'événement</strong> du monde, un événement peut frapper les civilisations. Les ressources stockées dans un <strong>Entrepôt</strong> sont protégées de l'incendie et de l'invasion de rats.
				</p>
				<div style="display:flex; flex-direction:column; gap:10px;">
					{#each eventEntries as [event, name]}
						<div style="padding:12px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px; border-left:3px solid oklch(0.5 0.16 30);">
							<div style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40); margin-bottom:2px;">{name}</div>
							<div style="font-size:15px; color:oklch(0.42 0.03 50);">{eventsDescription[event]}</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Guerre & combat -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Guerre &amp; combat</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Le <strong>ratio militaire</strong> (configurable) définit la part des adultes (hors enfants et retraités) entretenus comme <strong>soldats</strong>.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Lors d'une bataille, la <strong>force</strong> de chaque camp est la somme des points de vie de ses soldats. Le camp le plus fort l'emporte ; les pertes sont proportionnelles à la force adverse.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>En cas de victoire, l'attaquant <strong>pille 25 %</strong> de chaque ressource et <strong>capture 5 %</strong> de la population adverse (100 captifs maximum).</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Une <strong>Muraille</strong> bloque entièrement une attaque, mais elle est détruite dans l'opération.</span></li>
				</ul>
			</section>

			<!-- Échanges -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Échanges entre civilisations</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>L'échange n'a lieu que s'il est <strong>mutuel</strong> : les deux civilisations doivent s'ajouter l'une l'autre dans leur configuration.</span></li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span><span>Chaque mois, pour chaque ressource, leurs stocks sont <strong>rapprochés de leur moyenne</strong> — la civilisation la mieux pourvue aide la plus démunie.</span></li>
				</ul>
			</section>

		</div>
	</div>
</div>
