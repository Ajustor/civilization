<script lang="ts">
	import type { PageData } from './$types'
	import { getSeason } from '@ajustor/simulation'
	import {
		eventsDescription,
		eventsName,
		resourceNames,
		seasonsTranslations
	} from '$lib/translations'

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props()

	let selectedWorldIndex = $state(0)

	const tabActive = "padding:9px 18px; border-radius:999px; border:1px solid oklch(0.5 0.13 34); background:oklch(0.5 0.13 34); cursor:pointer; font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.95 0.02 84);"
	const tabIdle = "padding:9px 18px; border-radius:999px; border:1px solid oklch(0.78 0.05 65); background:oklch(0.97 0.015 84); cursor:pointer; font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.45 0.03 50);"

	const resourceBarColors: Record<string, string> = {
		food: 'oklch(0.55 0.1 130)',
		cookedFood: 'oklch(0.6 0.12 50)',
		wood: 'oklch(0.5 0.09 70)',
		stone: 'oklch(0.55 0.02 250)',
		plank: 'oklch(0.58 0.07 65)',
		charcoal: 'oklch(0.4 0.02 60)',
	}
</script>

<svelte:head>
	<title>Les mondes — Civilizations</title>
	<meta name="description" content="Une simulation d'un monde avec des civilisations qui vivent seule" />
</svelte:head>

<div class="civ-page-wrapper">
	{#await data.worlds then worlds}
		<!-- World tabs -->
		<div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:22px;" class="civ-animate-in">
			{#each worlds as world, i}
				<button onclick={() => selectedWorldIndex = i} style={i === selectedWorldIndex ? tabActive : tabIdle}>{world.name}</button>
			{/each}
		</div>

		{@const world = worlds[selectedWorldIndex]}
		{#if world}
			<div class="civ-card" style="animation:screenIn .46s cubic-bezier(.22,.72,.2,1) .05s both;">
				<!-- World header -->
				<div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:24px; border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:22px;">
					<div>
						<div style="font-family:'Marcellus',serif; font-size:13px; letter-spacing:.4em; text-transform:uppercase; color:oklch(0.5 0.09 40);">Chronique du monde</div>
						<h1 style="font-family:'Tangerine',cursive; font-size:clamp(40px,7vw,52px); margin:6px 0 0; color:oklch(0.3 0.04 40);">{world.name}</h1>
						<div style="font-size:19px; color:oklch(0.46 0.03 50); margin-top:4px;">An {world.year} du monde</div>
					</div>
					<div style="width:104px; height:104px; border-radius:50%; background:radial-gradient(circle at 35% 30%, oklch(0.55 0.14 38), oklch(0.4 0.13 34)); color:oklch(0.94 0.03 84); display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(80,30,20,.35), inset 0 2px 6px rgba(255,220,180,.35); border:2px solid oklch(0.6 0.12 40); flex-shrink:0;">
						<div style="font-family:'Marcellus',serif; font-size:22px; line-height:1;">{seasonsTranslations[getSeason(world.month)]}</div>
						<div style="font-size:13px; opacity:.85; margin-top:3px;">Mois {world.month}</div>
					</div>
				</div>

				<!-- Event banner -->
				{#if world.nextEvent}
					<div style="display:flex; gap:16px; align-items:center; margin-top:24px; padding:16px 20px; border-radius:4px; background:oklch(0.9 0.04 60); border:1px solid oklch(0.62 0.12 40); border-left:5px solid oklch(0.5 0.14 34);">
						<div style="width:42px; height:42px; flex-shrink:0; border-radius:50%; background:oklch(0.5 0.14 34); color:oklch(0.95 0.02 84); display:flex; align-items:center; justify-content:center; font-family:'Marcellus',serif; font-size:22px;">!</div>
						<div>
							<div style="font-family:'Marcellus',serif; font-size:20px; color:oklch(0.42 0.12 34);">Présage — {eventsName[world.nextEvent]}</div>
							<div style="font-size:16px; color:oklch(0.46 0.04 50); margin-top:2px;">{eventsDescription[world.nextEvent]}</div>
						</div>
					</div>
				{/if}

				<!-- Stats + top civs + resources -->
				{#await data.lazy.worldsStats then worldsStats}
					{@const worldStats = worldsStats.get(world.id)}

					{#if worldStats}
						<!-- Alive/dead counts -->
						<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:16px; margin-top:24px;">
							{#await worldStats.aliveCivilizations then alive}
								<div class="civ-inner-card">
									<div style="font-family:'Tangerine',cursive; font-size:40px; color:oklch(0.45 0.09 150);">{alive}</div>
									<div style="font-size:16px; color:oklch(0.48 0.03 50);">civilisations en vie</div>
								</div>
							{/await}
							{#await worldStats.deadCivilizations then dead}
								<div class="civ-inner-card">
									<div style="font-family:'Tangerine',cursive; font-size:40px; color:oklch(0.42 0.06 40);">{dead}</div>
									<div style="font-size:16px; color:oklch(0.48 0.03 50);">civilisations éteintes</div>
								</div>
							{/await}
						</div>

						<!-- Top civs + gender chart -->
						<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; margin-top:20px;">
							{#await worldStats.topCivilizations then topCivs}
								{#if topCivs?.length}
									<div class="civ-inner-card">
										<h2 class="civ-section-title">Classement des civilisations</h2>
										<div style="display:flex; flex-direction:column; gap:11px;">
											{#each topCivs.slice(0, 5) as civ, i}
												{@const roman = ['I','II','III','IV','V'][i] ?? String(i+1)}
												<div style="display:flex; align-items:baseline; gap:14px;">
													<span style="font-family:'Marcellus',serif; font-size:{i < 3 ? 22 : 19}px; color:oklch({i < 3 ? '0.5 0.1 40' : '0.6 0.03 50'}); width:30px;">{roman}</span>
													<span style="font-size:19px; flex:1;">{civ.name}</span>
													<span style="font-size:17px; color:oklch(0.5 0.03 50);">{civ.livedMonths} mois</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							{/await}
							{#await worldStats.menAndWomen then ratio}
								{#if ratio}
										{@const total = ratio.men + ratio.women}
										{@const menDeg = total > 0 ? Math.round((ratio.men / total) * 339) : 0}
										{@const womenDeg = 339 - menDeg}
									<div class="civ-inner-card" style="display:flex; flex-direction:column; align-items:center;">
										<h2 class="civ-section-title" style="align-self:flex-start;">Hommes & femmes</h2>
										<svg width="150" height="150" viewBox="0 0 150 150">
											<circle cx="75" cy="75" r="54" fill="none" stroke="oklch(0.85 0.03 84)" stroke-width="18"/>
											<circle cx="75" cy="75" r="54" fill="none" stroke="oklch(0.5 0.1 240)" stroke-width="18" stroke-dasharray="{menDeg} 339" transform="rotate(-90 75 75)"/>
											<circle cx="75" cy="75" r="54" fill="none" stroke="oklch(0.52 0.13 34)" stroke-width="18" stroke-dasharray="{womenDeg} 339" stroke-dashoffset="{-menDeg}" transform="rotate(-90 75 75)"/>
										</svg>
										<div style="display:flex; gap:20px; margin-top:14px; font-size:16px;">
											<span style="display:flex; align-items:center; gap:7px;"><span style="width:11px; height:11px; border-radius:2px; background:oklch(0.5 0.1 240); display:inline-block;"></span>Hommes {ratio.men}</span>
											<span style="display:flex; align-items:center; gap:7px;"><span style="width:11px; height:11px; border-radius:2px; background:oklch(0.52 0.13 34); display:inline-block;"></span>Femmes {ratio.women}</span>
										</div>
									</div>
								{/if}
							{/await}
						</div>
					{/if}
				{/await}

				<!-- Resources -->
				<div class="civ-inner-card" style="margin-top:20px;">
					<h2 class="civ-section-title">Les réserves du monde</h2>
					<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px 32px;">
						{#each world.resources as resource}
							<div>
								<div style="display:flex; justify-content:space-between; font-size:17px; margin-bottom:5px;">
									<span>{resourceNames[resource.type]}</span>
									<span style="color:oklch(0.5 0.03 50);">{resource.quantity}</span>
								</div>
								<div class="civ-progress-bar">
									<div class="civ-progress-fill" style="width:60%; background:{resourceBarColors[resource.type] ?? 'oklch(0.55 0.1 130)'};"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	{/await}
</div>
