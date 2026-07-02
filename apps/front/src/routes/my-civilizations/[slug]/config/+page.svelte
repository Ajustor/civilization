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
	import { DISTRIBUTABLE_OCCUPATIONS } from '@ajustor/simulation'
	import { OCCUPATIONS } from '$lib/translations/occupations'

	type ConfigFormData = z.infer<typeof civilizationConfigSchema>
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'
	import PercentSlider from '$lib/components/PercentSlider.svelte'

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

	// Note : le choix du prochain bâtiment à construire a été déplacé vers le bloc
	// « Constructions en cours » de la page de civilisation. Le champ
	// `nextBuildingToBuild` reste néanmoins dans le formulaire (chargé puis
	// réémis tel quel) afin que l'enregistrement de cette page ne l'efface pas.

	const { form: formData, enhance: formEnhance } = form

	// Total live des jauges : maintenu à 100 % par le rééquilibrage automatique.
	const distributionTotal = $derived(
		DISTRIBUTABLE_OCCUPATIONS.reduce(
			(sum, occupation) =>
				sum + (Number(($formData as ConfigFormData).occupationDistribution?.[occupation]) || 0),
			0
		)
	)

	// Quand une jauge change, les autres sont recalculées en direct pour que le
	// total fasse toujours exactement 100 % : le reste (100 − valeur choisie) est
	// réparti proportionnellement aux valeurs actuelles des autres jauges (parts
	// égales si elles sont toutes à zéro), avec un arrondi au plus fort reste.
	const rebalanceDistribution = (changed: string, value: number) => {
		const current = ($formData as ConfigFormData).occupationDistribution ?? {}
		const others = DISTRIBUTABLE_OCCUPATIONS.filter((occupation) => occupation !== changed)
		const remaining = Math.max(0, 100 - value)
		const othersTotal = others.reduce(
			(sum, occupation) => sum + (Number(current[occupation]) || 0),
			0
		)
		const exactShares = others.map((occupation) =>
			othersTotal > 0
				? ((Number(current[occupation]) || 0) / othersTotal) * remaining
				: remaining / others.length
		)
		const floored = exactShares.map(Math.floor)
		let leftover = remaining - floored.reduce((sum, share) => sum + share, 0)
		exactShares
			.map((exact, index) => ({ index, fraction: exact - floored[index] }))
			.sort((a, b) => b.fraction - a.fraction)
			.forEach(({ index }) => {
				if (leftover > 0) {
					floored[index] += 1
					leftover -= 1
				}
			})
		const next: Record<string, number> = { [changed]: value }
		others.forEach((occupation, index) => {
			next[occupation] = floored[index]
		})
		$formData.occupationDistribution = next
	}

	const toggleExchange = (civilizationId: string, checked: boolean | 'indeterminate') => {
		const fd = $formData as ConfigFormData
		if (checked === true) {
			$formData.openExchange = [...fd.openExchange, civilizationId]
		} else {
			$formData.openExchange = fd.openExchange.filter((id: string) => id !== civilizationId)
		}
	}


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
				<FormField {form} name="maximumChildrenPercentage">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Pourcentage maximum d'enfants (% des adultes)</FormLabel>
							<PercentSlider {...props} bind:value={$formData.maximumChildrenPercentage} />
						{/snippet}
					</FormControl>
					<FormDescription>Limite le nombre d'enfants vivants simultanément à ce pourcentage du nombre d'adultes (citoyens non-enfants). Ex. 25 % avec 100 adultes = 25 enfants maximum.</FormDescription>
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

		<!-- Répartition des métiers -->
		<div class="civ-inner-card">
			<h3 class="civ-section-title">Répartition des métiers</h3>
			<p style="color:oklch(0.5 0.03 50); font-size:14px; margin:0 0 12px;">
				Pourcentage cible de la population active civile pour chaque métier. Dès qu'un citoyen a les
				prérequis, il évolue vers le métier le plus déficitaire. Le <strong>Fermier</strong> et
				l'<strong>Érudit</strong> produisent même sans bâtiment (à rendement réduit) : leur bâtiment ne
				fait que les booster, et la civilisation le construit automatiquement quand des travailleurs ne
				sont pas boostés. Le <strong>Mineur</strong>, le <strong>Commis de cuisine</strong>, le
				<strong>Charpentier</strong> et le <strong>Charbonnier</strong> exigent leur bâtiment : leur
				effectif est plafonné par les places bâties. Le <strong>Constructeur</strong> est le seul métier
				habilité à bâtir — sans constructeurs, aucun chantier ne démarre. Quand vous ajustez une jauge,
				les autres se recalculent en direct pour que le total fasse toujours exactement 100 %. Les
				soldats sont gérés séparément par le ratio militaire.
			</p>
			<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:10px;">
				{#each DISTRIBUTABLE_OCCUPATIONS as occupation}
					<label style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:6px 10px; background:oklch(0.97 0.01 84); border-radius:4px;">
						<span style="font-size:15px; flex-shrink:0; min-width:96px;">{OCCUPATIONS[occupation]}</span>
						<PercentSlider
							bind:value={$formData.occupationDistribution[occupation]}
							onValueChange={(value) => rebalanceDistribution(occupation, value)}
						/>
					</label>
				{/each}
			</div>
			<p
				style="margin:12px 0 0; font-weight:600; color:{distributionTotal === 100
					? 'oklch(0.5 0.13 150)'
					: 'oklch(0.5 0.18 25)'};"
			>
				Total : {distributionTotal} %{distributionTotal === 100 ? ' ✓' : ' (doit faire 100 %)'}
			</p>
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

		<!-- Mode rapide -->
		<div class="civ-inner-card">
			<h3 class="civ-section-title">Mode rapide</h3>
			<div style="display:flex; align-items:flex-start; gap:10px;">
				<Checkbox id="speedMode" checked={$formData.speedMode} onCheckedChange={(c) => ($formData.speedMode = c === true)} />
				<label for="speedMode" style="font-size:15px; cursor:pointer;">
					Activer le mode rapide. Si <strong>toutes</strong> les civilisations d'un monde l'activent, le temps avance d'un an (12 mois) à chaque tick au lieu d'un mois.
				</label>
			</div>
		</div>

		<button type="submit" style="align-self:flex-start; padding:12px 22px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:17px; cursor:pointer; box-shadow:0 4px 12px rgba(80,30,20,.24);">Enregistrer la configuration</button>
	</form>
</div>
</div>
