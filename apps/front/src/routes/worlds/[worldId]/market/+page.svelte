<script lang="ts">
	import type { PageData } from './$types'
	import { enhance } from '$app/forms'
	import { ResourceTypes } from '@ajustor/simulation'
	import { resourceNames } from '$lib/translations'
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'

	let { data }: { data: PageData } = $props()

	type Offer = {
		_id: string
		fromCivilizationId: string
		toCivilizationId?: string | null
		give: { resourceType: string; quantity: number }[]
		want: { resourceType: string; quantity: number }[]
		status: string
	}

	type WorldCiv = { id: string; name: string }

	const resourceTypeValues = Object.values(ResourceTypes)
	const civNameMap = $derived(
		new Map((data.worldCivilizations as WorldCiv[]).map((c) => [c.id, c.name]))
	)
	const myCivIds = $derived(
		new Set((data.myCivilizations as WorldCiv[]).map((c) => c.id))
	)

	function civName(id: string): string {
		return civNameMap.get(id) ?? id
	}

	function formatResources(items: { resourceType: string; quantity: number }[]): string {
		return items
			.map((r) => `${r.quantity} ${resourceNames[r.resourceType as ResourceTypes] ?? r.resourceType}`)
			.join(', ')
	}

	// Form multi-ressources
	let giveLines = $state([{ resource: resourceTypeValues[0], quantity: 1 }])
	let wantLines = $state([{ resource: resourceTypeValues[0], quantity: 1 }])

	function addLine(lines: typeof giveLines) {
		lines.push({ resource: resourceTypeValues[0], quantity: 1 })
	}
	function removeLine(lines: typeof giveLines, index: number) {
		if (lines.length > 1) lines.splice(index, 1)
	}

	let showOnlyMine = $state(false)
	const filteredOffers = $derived(
		showOnlyMine
			? (data.offers as Offer[]).filter((o) => myCivIds.has(o.fromCivilizationId))
			: (data.offers as Offer[])
	)
</script>

<svelte:head>
	<title>Marché du monde</title>
	<meta name="description" content="Marché des échanges de ressources entre civilisations" />
</svelte:head>

<div class="civ-page-wrapper">
	<Breadcrumb items={[
		{ label: 'Mes civilisations', href: '/my-civilizations' },
		{ label: 'Marché du monde' }
	]} />

	<div class="civ-card" style="animation:screenIn .46s cubic-bezier(.22,.72,.2,1) .05s both;">
		<h1 style="font-family:'Tangerine',cursive; font-size:clamp(28px,5vw,40px); margin:0 0 24px; color:oklch(0.3 0.04 40); border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:16px;">Marché du monde</h1>

		<!-- Créer une offre -->
		<div class="civ-inner-card" style="margin-bottom:24px;">
			<h2 class="civ-section-title">Proposer un échange</h2>

			{#if (data.myCivilizations as WorldCiv[]).length === 0}
				<p style="color:oklch(0.5 0.03 50);">Vous n'avez aucune civilisation pour proposer un échange.</p>
			{:else}
				<form method="post" action="?/create" use:enhance class="flex flex-col gap-4">
					<input type="hidden" name="worldId" value={data.worldId} />

					<div style="display:flex; flex-direction:column; gap:6px;">
						<label for="create-civ" style="font-size:15px; color:oklch(0.42 0.04 45);">Votre civilisation</label>
						<select id="create-civ" name="civilizationId" class="select select-bordered w-full">
							{#each data.myCivilizations as civ}
								<option value={(civ as WorldCiv).id}>{(civ as WorldCiv).name}</option>
							{/each}
						</select>
					</div>

					<!-- Vous donnez -->
					<div style="display:flex; flex-direction:column; gap:8px;">
						<p style="font-family:'Marcellus',serif; font-size:17px; color:oklch(0.38 0.04 40); margin:0;">Vous donnez</p>
						{#each giveLines as line, i}
							<div style="display:flex; gap:8px; align-items:center;">
								<select name="giveResource" bind:value={line.resource} class="select select-bordered" style="flex:1;">
									{#each resourceTypeValues as rt}
										<option value={rt}>{resourceNames[rt]}</option>
									{/each}
								</select>
								<input type="number" name="giveQuantity" bind:value={line.quantity} min="1" class="input input-bordered" style="width:80px;" />
								{#if giveLines.length > 1}
									<button type="button" onclick={() => removeLine(giveLines, i)} style="padding:6px 10px; border:1px solid oklch(0.52 0.2 30); border-radius:4px; background:none; color:oklch(0.52 0.2 30); cursor:pointer;">×</button>
								{/if}
							</div>
						{/each}
						{#if giveLines.length < resourceTypeValues.length}
							<button type="button" onclick={() => addLine(giveLines)} style="align-self:flex-start; padding:6px 12px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:none; color:oklch(0.45 0.06 40); font-family:'EB Garamond',serif; font-size:15px; cursor:pointer;">+ Ajouter une ressource</button>
						{/if}
					</div>

					<!-- Vous voulez -->
					<div style="display:flex; flex-direction:column; gap:8px;">
						<p style="font-family:'Marcellus',serif; font-size:17px; color:oklch(0.38 0.04 40); margin:0;">Vous voulez</p>
						{#each wantLines as line, i}
							<div style="display:flex; gap:8px; align-items:center;">
								<select name="wantResource" bind:value={line.resource} class="select select-bordered" style="flex:1;">
									{#each resourceTypeValues as rt}
										<option value={rt}>{resourceNames[rt]}</option>
									{/each}
								</select>
								<input type="number" name="wantQuantity" bind:value={line.quantity} min="1" class="input input-bordered" style="width:80px;" />
								{#if wantLines.length > 1}
									<button type="button" onclick={() => removeLine(wantLines, i)} style="padding:6px 10px; border:1px solid oklch(0.52 0.2 30); border-radius:4px; background:none; color:oklch(0.52 0.2 30); cursor:pointer;">×</button>
								{/if}
							</div>
						{/each}
						{#if wantLines.length < resourceTypeValues.length}
							<button type="button" onclick={() => addLine(wantLines)} style="align-self:flex-start; padding:6px 12px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:none; color:oklch(0.45 0.06 40); font-family:'EB Garamond',serif; font-size:15px; cursor:pointer;">+ Ajouter une ressource</button>
						{/if}
					</div>

					<div style="display:flex; flex-direction:column; gap:6px;">
						<label for="target-civ" style="font-size:15px; color:oklch(0.42 0.04 45);">Civilisation cible (optionnel)</label>
						<select id="target-civ" name="toCivilizationId" class="select select-bordered w-full">
							<option value="">Offre ouverte à tous</option>
							{#each data.worldCivilizations as civ}
								{#if !(myCivIds.has((civ as WorldCiv).id))}
									<option value={(civ as WorldCiv).id}>{(civ as WorldCiv).name}</option>
								{/if}
							{/each}
						</select>
					</div>

					<button type="submit" style="align-self:flex-start; padding:12px 22px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:17px; cursor:pointer; box-shadow:0 4px 12px rgba(80,30,20,.24);">Proposer l'échange</button>
				</form>
			{/if}
		</div>

		<!-- Offres ouvertes -->
		<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
			<h2 class="civ-section-title" style="margin:0;">Offres ouvertes</h2>
			<label style="display:flex; align-items:center; gap:8px; font-size:15px; color:oklch(0.5 0.03 50); cursor:pointer;">
				<input type="checkbox" bind:checked={showOnlyMine} class="checkbox checkbox-sm" />
				Mes offres uniquement
			</label>
		</div>

		{#if filteredOffers.length === 0}
			<p style="color:oklch(0.5 0.03 50); font-size:16px;">Aucune offre ouverte.</p>
		{:else}
			<div style="display:flex; flex-direction:column; gap:12px;">
				{#each filteredOffers as offer}
					{@const isMyOffer = myCivIds.has((offer as Offer).fromCivilizationId)}
					<div class="civ-inner-card">
						<div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:12px;">
							<div style="flex:1; min-width:240px;">
								<div style="margin-bottom:8px; font-size:14px; color:oklch(0.54 0.03 50);">
									De : <strong>{civName((offer as Offer).fromCivilizationId)}</strong>
									{#if (offer as Offer).toCivilizationId}
										· Réservée à : <strong>{civName((offer as Offer).toCivilizationId!)}</strong>
									{:else}
										· <em>Offre ouverte à tous</em>
									{/if}
								</div>
								<div style="display:flex; flex-wrap:wrap; align-items:stretch; gap:10px;">
									<div style="flex:1; min-width:140px; border:1px solid oklch(0.82 0.06 145); border-radius:4px; padding:8px 12px; background:oklch(0.96 0.03 145);">
										<div style="font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:oklch(0.45 0.09 150); margin-bottom:2px;">Offre</div>
										<div style="font-family:'Marcellus',serif; font-size:17px; color:oklch(0.34 0.05 145);">{formatResources((offer as Offer).give)}</div>
									</div>
									<div style="display:flex; align-items:center; color:oklch(0.6 0.05 60); font-size:20px;">⇄</div>
									<div style="flex:1; min-width:140px; border:1px solid oklch(0.82 0.07 60); border-radius:4px; padding:8px 12px; background:oklch(0.97 0.03 70);">
										<div style="font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:oklch(0.5 0.1 55); margin-bottom:2px;">En échange de</div>
										<div style="font-family:'Marcellus',serif; font-size:17px; color:oklch(0.4 0.07 50);">{formatResources((offer as Offer).want)}</div>
									</div>
								</div>
								{#if !isMyOffer}
									<div style="margin-top:8px; font-size:13px; color:oklch(0.5 0.03 50); font-style:italic;">
										En acceptant, vous donnez <strong style="font-style:normal; color:oklch(0.42 0.07 50);">{formatResources((offer as Offer).want)}</strong> et recevez <strong style="font-style:normal; color:oklch(0.4 0.07 145);">{formatResources((offer as Offer).give)}</strong>.
									</div>
								{/if}
							</div>

							<div style="display:flex; gap:8px; flex-wrap:wrap;">
								{#if !isMyOffer}
									<form method="post" action="?/accept" use:enhance style="display:flex; gap:6px; align-items:center;">
										<input type="hidden" name="offerId" value={(offer as Offer)._id} />
										<select name="civilizationId" class="select select-bordered select-sm">
											{#each data.myCivilizations as civ}
												<option value={(civ as WorldCiv).id}>{(civ as WorldCiv).name}</option>
											{/each}
										</select>
										<button type="submit" style="padding:6px 14px; border:none; border-radius:4px; background:oklch(0.52 0.1 130); color:oklch(0.95 0.02 84); font-family:'EB Garamond',serif; font-size:15px; cursor:pointer;">Accepter</button>
									</form>
								{/if}
								{#if isMyOffer}
									<form method="post" action="?/cancel" use:enhance>
										<input type="hidden" name="offerId" value={(offer as Offer)._id} />
										<button type="submit" style="padding:6px 14px; border:1px solid oklch(0.52 0.2 30); border-radius:4px; background:none; color:oklch(0.52 0.2 30); font-family:'EB Garamond',serif; font-size:15px; cursor:pointer;">Annuler</button>
									</form>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
