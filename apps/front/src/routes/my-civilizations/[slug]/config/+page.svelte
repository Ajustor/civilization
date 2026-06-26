<script lang="ts">
	import type { PageData } from './$types'
	import { Checkbox } from '$lib/components/ui/checkbox'
	import {
		FormControl,
		FormDescription,
		FormField,
		FormFieldErrors,
		FormFieldset,
		FormLabel,
		FormLegend
	} from '$lib/components/ui/form'
	import { superForm } from 'sveltekit-superforms'
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters'
	import { civilizationConfigSchema } from '$lib/schemas/civilizationConfig'
	import type { z } from 'zod'
	import { toast } from 'svelte-sonner'

	type ConfigFormData = z.infer<typeof civilizationConfigSchema>
	import {
		BuildingTypes,
		House,
		Farm,
		Kiln,
		Sawmill,
		Mine,
		Campfire,
		Cache,
		Wall,
		Library,
		getBuildingGate,
		getTechNode,
		type ResourceTypes,
		type OccupationTypes
	} from '@ajustor/simulation'
	import { buildingNames, resourceNames, OCCUPATIONS } from '$lib/translations'
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const form = superForm(data.configForm, {
		// openExchange / atWarWith are arrays driven by checkboxes (no native form
		// inputs), so they only reach the server when the whole form is posted as JSON.
		dataType: 'json',
		// Keep the just-submitted values on screen instead of resetting to the
		// initial (often default) load snapshot — the action returns the freshly
		// persisted config, which we want to remain displayed.
		resetForm: false,
		validators: zodClient(civilizationConfigSchema),
		onError({ result }) {
			toast.error(result.error?.message ?? 'Une erreur est survenue')
		},
		onUpdated({ form }) {
			if (form.message?.status === 'success') {
				toast.success(form.message.text)
			}
		}
	})

	const { form: formData, enhance: formEnhance } = form

	const toggleExchange = (civilizationId: string, checked: boolean | 'indeterminate') => {
		const fd = $formData as ConfigFormData
		if (checked === true) {
			$formData.openExchange = [...fd.openExchange, civilizationId]
		} else {
			$formData.openExchange = fd.openExchange.filter((id: string) => id !== civilizationId)
		}
	}

	const toggleWar = (civilizationId: string, checked: boolean | 'indeterminate') => {
		const fd = $formData as ConfigFormData
		if (checked === true) {
			$formData.atWarWith = [...fd.atWarWith, civilizationId]
		} else {
			$formData.atWarWith = fd.atWarWith.filter((id: string) => id !== civilizationId)
		}
	}

	// Construction requirements come from the static fields on each building class.
	type BuildingMeta = {
		constructionCosts?: { resource: ResourceTypes; amount: number }[]
		workerRequiredToBuild?: { occupation: OccupationTypes; amount: number }[]
		timeToBuild?: number
	}
	const BUILDING_CLASSES: Record<BuildingTypes, BuildingMeta> = {
		[BuildingTypes.HOUSE]: House,
		[BuildingTypes.FARM]: Farm,
		[BuildingTypes.KILN]: Kiln,
		[BuildingTypes.SAWMILL]: Sawmill,
		[BuildingTypes.MINE]: Mine,
		[BuildingTypes.CAMPFIRE]: Campfire,
		[BuildingTypes.CACHE]: Cache,
		[BuildingTypes.WALL]: Wall,
		[BuildingTypes.LIBRARY]: Library
	}

	// Bâtiments verrouillés par l'arbre de technologies : pour chaque type gardé
	// par une techno non encore recherchée, on garde le nom (FR) de cette techno.
	const researchedTechs = $derived<string[]>(data.civilization.researchedTechs ?? [])
	const lockedBuildings = $derived.by(() => {
		const locked = new Map<BuildingTypes, string>()
		for (const buildingType of Object.values(BuildingTypes)) {
			const gate = getBuildingGate(buildingType)
			if (gate && !researchedTechs.includes(gate)) {
				locked.set(buildingType, getTechNode(gate)?.name ?? gate)
			}
		}
		return locked
	})

	const selectedBuildingInfo = $derived.by(() => {
		const type = $formData.nextBuildingToBuild
		if (!type) return null
		const meta = BUILDING_CLASSES[type as BuildingTypes]
		if (!meta) return null
		return {
			costs: meta.constructionCosts ?? [],
			workers: meta.workerRequiredToBuild ?? [],
			timeToBuild: meta.timeToBuild
		}
	})
</script>

<svelte:head>
	<title>Configuration de {data.civilization.name}</title>
	<meta name="description" content="Configurer le comportement de ma civilisation" />
</svelte:head>

<div class="civ-page-wrapper">
<Breadcrumb items={[
	{ label: 'Mes civilisations', href: '/my-civilizations' },
	{ label: data.civilization.name, href: `/my-civilizations/${data.civilization.id}` },
	{ label: 'Configuration' }
]} />

<div class="civ-card" style="max-width:720px; margin:0 auto; display:flex; flex-direction:column; gap:20px;">
	<h1 style="font-family:'Tangerine',cursive; font-size:clamp(26px,4vw,36px); margin:0; color:oklch(0.3 0.04 40);">Configuration de {data.civilization.name}</h1>

	<form method="post" use:formEnhance action="?/updateConfig" class="flex flex-col gap-4">

		<!-- Population -->
		<div class="civ-inner-card">
			<h3 class="civ-section-title">Population</h3>
			<div style="display:flex; flex-direction:column; gap:16px;">
				<FormField {form} name="maximumChildren">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Nombre maximum d'enfants simultanés</FormLabel>
							<input type="number" min="0" class="input input-bordered w-full" {...props} bind:value={$formData.maximumChildren} />
						{/snippet}
					</FormControl>
					<FormDescription>Limite le nombre d'enfants vivants en même temps dans la civilisation.</FormDescription>
					<FormFieldErrors />
				</FormField>

				<FormField {form} name="maxActivePeopleByCivilization">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Nombre maximum d'actifs</FormLabel>
							<input type="number" min="0" class="input input-bordered w-full" {...props} bind:value={$formData.maxActivePeopleByCivilization} />
						{/snippet}
					</FormControl>
					<FormDescription>Au-delà de cette limite, la civilisation arrête de faire des enfants.</FormDescription>
					<FormFieldErrors />
				</FormField>
			</div>
		</div>

		<!-- Échanges -->
		<div class="civ-inner-card">
			<h3 class="civ-section-title">Échanges</h3>
			{#if data.otherCivilizations.length}
				<FormFieldset {form} name="openExchange" class="flex flex-col gap-3">
					<FormLegend>Civilisations avec lesquelles ouvrir les échanges de ressources</FormLegend>
					<FormDescription>
						L'échange n'a lieu que s'il est mutuel : l'autre civilisation doit elle aussi vous ajouter. Les ressources des deux civilisations seront alors équilibrées chaque mois.
					</FormDescription>
					{#each data.otherCivilizations as otherCivilization}
						<div class="flex items-center gap-2">
							<Checkbox
								id="exchange-{otherCivilization.id}"
								checked={($formData as ConfigFormData).openExchange.includes(otherCivilization.id)}
								onCheckedChange={(checked: boolean | 'indeterminate') => toggleExchange(otherCivilization.id, checked)}
							/>
							<label for="exchange-{otherCivilization.id}" style="font-size:15px; cursor:pointer;">{otherCivilization.name}</label>
						</div>
					{/each}
					<FormFieldErrors />
				</FormFieldset>
			{:else}
				<p style="color:oklch(0.5 0.03 50);">Vous n'avez pas d'autre civilisation avec laquelle ouvrir des échanges.</p>
			{/if}
		</div>

		<!-- Militaire -->
		<div class="civ-inner-card">
			<h3 class="civ-section-title">Militaire</h3>
			<div style="display:flex; flex-direction:column; gap:16px;">
				<FormField {form} name="militaryRatio">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Ratio militaire (%)</FormLabel>
							<input type="number" min="0" max="100" class="input input-bordered w-full" {...props} bind:value={$formData.militaryRatio} />
						{/snippet}
					</FormControl>
					<FormDescription>Part des adultes entretenus comme soldats (0–100%).</FormDescription>
					<FormFieldErrors />
				</FormField>

				{#if data.worldCivilizations.length}
					<FormFieldset {form} name="atWarWith" class="flex flex-col gap-3">
						<FormLegend>Civilisations à attaquer</FormLegend>
						{#each data.worldCivilizations as otherCivilization}
							<div class="flex items-center gap-2">
								<Checkbox
									id="war-{otherCivilization.id}"
									checked={($formData as ConfigFormData).atWarWith.includes(otherCivilization.id)}
									onCheckedChange={(checked: boolean | 'indeterminate') => toggleWar(otherCivilization.id, checked)}
								/>
								<label for="war-{otherCivilization.id}" style="font-size:15px; cursor:pointer;">{otherCivilization.name}</label>
							</div>
						{/each}
						<FormFieldErrors />
					</FormFieldset>
				{:else}
					<p style="color:oklch(0.5 0.03 50);">Aucune autre civilisation dans ce monde.</p>
				{/if}

				</div>
			</div>

			<!-- Construction -->
			<div class="civ-inner-card">
				<h3 class="civ-section-title">Construction</h3>
				<div style="display:flex; flex-direction:column; gap:16px;">
				<FormField {form} name="nextBuildingToBuild">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Prochain bâtiment à construire</FormLabel>
							<select
								{...props}
								value={$formData.nextBuildingToBuild ?? ''}
								onchange={(e) => { $formData.nextBuildingToBuild = e.currentTarget.value || null }}
								class="select select-bordered w-full"
							>
								<option value="">Aucun</option>
								{#each Object.values(BuildingTypes) as buildingType}
									{@const lockedBy = lockedBuildings.get(buildingType)}
									<option
										value={buildingType}
										disabled={!!lockedBy}
										title={lockedBy ? `Recherche manquante : ${lockedBy}` : undefined}
									>{buildingNames[buildingType]}{lockedBy ? ` 🔒 (recherche : ${lockedBy})` : ''}</option>
								{/each}
							</select>
						{/snippet}
					</FormControl>
					<FormDescription>Bâtiment que la civilisation cherchera à construire en priorité.</FormDescription>
					{#if selectedBuildingInfo}
						<div style="margin-top:10px; padding:12px 14px; border:1px solid oklch(0.8 0.04 70); border-radius:4px; background:oklch(0.97 0.015 84); display:flex; flex-direction:column; gap:10px;">
							<div style="display:flex; align-items:baseline; gap:8px;">
								<span style="font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:oklch(0.52 0.05 50);">Temps de construction</span>
								<span style="font-size:15px; font-weight:600; color:oklch(0.32 0.04 40);">{selectedBuildingInfo.timeToBuild ?? '?'} mois</span>
							</div>
							<div>
								<div style="font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:4px;">Ressources requises</div>
								{#if selectedBuildingInfo.costs.length}
									<div style="display:flex; flex-wrap:wrap; gap:6px;">
										{#each selectedBuildingInfo.costs as cost}
											<span style="font-size:14px; padding:3px 10px; border-radius:3px; background:oklch(0.92 0.03 78); color:oklch(0.35 0.04 42);">{cost.amount} {resourceNames[cost.resource]}</span>
										{/each}
									</div>
								{:else}
									<span style="font-size:14px; color:oklch(0.5 0.03 50);">Aucune ressource requise</span>
								{/if}
							</div>
							{#if selectedBuildingInfo.workers.length}
								<div>
									<div style="font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:4px;">Ouvriers requis pour la construction</div>
									<div style="display:flex; flex-wrap:wrap; gap:6px;">
										{#each selectedBuildingInfo.workers as worker}
											<span style="font-size:14px; padding:3px 10px; border-radius:3px; background:oklch(0.92 0.03 78); color:oklch(0.35 0.04 42);">{worker.amount} {OCCUPATIONS[worker.occupation]}</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
					<FormFieldErrors />
				</FormField>
			</div>
		</div>

		<button type="submit" style="align-self:flex-start; padding:12px 22px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:17px; cursor:pointer; box-shadow:0 4px 12px rgba(80,30,20,.24);">Enregistrer la configuration</button>
	</form>
</div>
</div>
