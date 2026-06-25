<script lang="ts">
	import type { PageData } from './$types'
	import { enhance } from '$app/forms'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { ResourceTypes } from '@ajustor/simulation'
	import { resourceNames } from '$lib/translations'

	let { data }: { data: PageData } = $props()

	type Offer = {
		_id: string
		fromCivilizationId: string
		toCivilizationId?: string | null
		give: { resourceType: string; quantity: number }[]
		want: { resourceType: string; quantity: number }[]
		status: string
	}

	type Civilization = {
		id: string
		name: string
	}

	const resourceTypeValues = Object.values(ResourceTypes)

	function formatResources(items: { resourceType: string; quantity: number }[]): string {
		return items
			.map((r) => {
				const name = resourceNames[r.resourceType as ResourceTypes] ?? r.resourceType
				return `${r.quantity} ${name}`
			})
			.join(', ')
	}

	function getOfferId(offer: Offer): string {
		return offer._id
	}
</script>

<svelte:head>
	<title>Marché du monde</title>
	<meta name="description" content="Le marché des échanges de ressources du monde" />
</svelte:head>

<div class="m-auto flex w-full max-w-4xl flex-col gap-6 p-4">
	<h1 class="text-3xl">Marché du monde</h1>

	<!-- Create offer form -->
	<Card class="card bg-neutral text-neutral-content shadow-xl">
		<CardHeader>
			<CardTitle>Proposer un échange</CardTitle>
		</CardHeader>
		<CardContent>
			{#if (data.myCivilizations as Civilization[]).length === 0}
				<p>Vous n'avez aucune civilisation pour proposer un échange.</p>
			{:else}
				<form method="post" action="?/create" use:enhance class="flex flex-col gap-4">
					<input type="hidden" name="worldId" value={data.worldId} />

					<div class="flex flex-col gap-1">
						<label for="create-civ" class="label">Votre civilisation</label>
						<select id="create-civ" name="civilizationId" class="select select-bordered w-full">
							{#each data.myCivilizations as civ}
								<option value={(civ as Civilization).id}>{(civ as Civilization).name}</option>
							{/each}
						</select>
					</div>

					<div class="flex flex-col gap-2">
						<p class="font-semibold">Vous donnez</p>
						<div class="flex gap-2">
							<select name="giveResource" class="select select-bordered flex-1">
								{#each resourceTypeValues as rt}
									<option value={rt}>{resourceNames[rt]}</option>
								{/each}
							</select>
							<Input type="number" name="giveQuantity" min="1" value={1} class="w-24" />
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<p class="font-semibold">Vous voulez</p>
						<div class="flex gap-2">
							<select name="wantResource" class="select select-bordered flex-1">
								{#each resourceTypeValues as rt}
									<option value={rt}>{resourceNames[rt]}</option>
								{/each}
							</select>
							<Input type="number" name="wantQuantity" min="1" value={1} class="w-24" />
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<label for="target-civ" class="label">Civilisation cible (optionnel)</label>
						<select id="target-civ" name="toCivilizationId" class="select select-bordered w-full">
							<option value="">Marché ouvert</option>
							{#each data.myCivilizations as civ}
								<option value={(civ as Civilization).id}>{(civ as Civilization).name}</option>
							{/each}
						</select>
					</div>

					<Button type="submit" class="btn btn-primary self-start">Proposer l'échange</Button>
				</form>
			{/if}
		</CardContent>
	</Card>

	<!-- Offer list -->
	<h2 class="text-2xl">Offres ouvertes</h2>

	{#if (data.offers as Offer[]).length === 0}
		<p class="text-base-content/70">Aucune offre ouverte pour ce monde.</p>
	{:else}
		<div class="flex flex-col gap-4">
			{#each data.offers as offer}
				{@const offerId = getOfferId(offer as Offer)}
				<Card class="card bg-neutral text-neutral-content shadow-xl">
					<CardHeader>
						<CardTitle class="flex flex-wrap items-center gap-2 text-base">
							<span>{formatResources((offer as Offer).give)}</span>
							<span>→</span>
							<span>{formatResources((offer as Offer).want)}</span>
						</CardTitle>
					</CardHeader>
					<CardContent class="flex flex-col gap-4">
						<p class="text-sm opacity-70">
							De : <span class="font-mono">{(offer as Offer).fromCivilizationId}</span>
						</p>
						{#if (offer as Offer).toCivilizationId}
							<p class="text-sm opacity-70">
								Pour : <span class="font-mono">{(offer as Offer).toCivilizationId}</span>
							</p>
						{:else}
							<p class="text-sm opacity-70">Offre ouverte à tous</p>
						{/if}

						<div class="flex flex-wrap gap-2">
							<!-- Accept form -->
							<form method="post" action="?/accept" use:enhance class="flex items-end gap-2">
								<input type="hidden" name="offerId" value={offerId} />
								{#if (data.myCivilizations as Civilization[]).length > 0}
									<select name="civilizationId" class="select select-bordered select-sm">
										{#each data.myCivilizations as civ}
											<option value={(civ as Civilization).id}>{(civ as Civilization).name}</option>
										{/each}
									</select>
								{/if}
								<Button type="submit" class="btn btn-success btn-sm">Accepter</Button>
							</form>

							<!-- Cancel form -->
							<form method="post" action="?/cancel" use:enhance>
								<input type="hidden" name="offerId" value={offerId} />
								<Button type="submit" variant="destructive" class="btn btn-error btn-sm">
									Annuler
								</Button>
							</form>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
