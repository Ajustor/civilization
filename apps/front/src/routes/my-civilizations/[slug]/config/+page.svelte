<script lang="ts">
	import type { PageData } from './$types'
	import { Input } from '$lib/components/ui/input'
	import { Checkbox } from '$lib/components/ui/checkbox'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import {
		FormButton,
		FormControl,
		FormDescription,
		FormField,
		FormFieldErrors,
		FormFieldset,
		FormLabel,
		FormLegend
	} from '$lib/components/ui/form'
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { civilizationConfigSchema } from '$lib/schemas/civilizationConfig'
	import { toast } from 'svelte-sonner'
	import { BuildingTypes } from '@ajustor/simulation'
	import { buildingNames } from '$lib/translations'

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const form = superForm(data.configForm, {
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

	const { form: formData, enhance } = form

	const toggleExchange = (civilizationId: string, checked: boolean | 'indeterminate') => {
		if (checked === true) {
			$formData.openExchange = [...$formData.openExchange, civilizationId]
		} else {
			$formData.openExchange = $formData.openExchange.filter((id) => id !== civilizationId)
		}
	}

	const toggleWar = (civilizationId: string, checked: boolean | 'indeterminate') => {
		if (checked === true) {
			$formData.atWarWith = [...$formData.atWarWith, civilizationId]
		} else {
			$formData.atWarWith = $formData.atWarWith.filter((id) => id !== civilizationId)
		}
	}
</script>

<svelte:head>
	<title>Configuration de {data.civilization.name}</title>
	<meta name="description" content="Configurer le comportement de ma civilisation" />
</svelte:head>

<div class="civ-page-wrapper">
<a href="/my-civilizations/{data.civilization.id}" style="background:none; border:none; cursor:pointer; font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.5 0.06 40); padding:0; margin-bottom:14px; display:inline-flex; align-items:center; gap:6px; text-decoration:none; animation:screenIn .4s ease both;">‹ Retour à {data.civilization.name}</a>

<div class="civ-card" style="max-width:720px; margin:0 auto; display:flex; flex-direction:column; gap:20px;">
	<h1 style="font-family:'Marcellus',serif; font-size:clamp(26px,4vw,36px); margin:0; color:oklch(0.3 0.04 40);">Configuration de {data.civilization.name}</h1>

	<form method="post" use:enhance action="?/updateConfig" class="flex flex-col gap-6">
		<Card class="card bg-neutral text-neutral-content shadow-xl">
			<CardHeader>
				<CardTitle>Population</CardTitle>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<FormField {form} name="maximumChildren">
					<FormControl >
						{#snippet children({ props })}
												<FormLabel>Nombre maximum d'enfants simultanés</FormLabel>
							<Input type="number" min="0" {...props} bind:value={$formData.maximumChildren} />
																	{/snippet}
										</FormControl>
					<FormDescription>
						Limite le nombre d'enfants vivants en même temps dans la civilisation.
					</FormDescription>
					<FormFieldErrors />
				</FormField>

				<FormField {form} name="maxActivePeopleByCivilization">
					<FormControl >
						{#snippet children({ props })}
												<FormLabel>Nombre maximum d'actifs</FormLabel>
							<Input
								type="number"
								min="0"
								{...props}
								bind:value={$formData.maxActivePeopleByCivilization}
							/>
																	{/snippet}
										</FormControl>
					<FormDescription>
						Au-delà de cette limite, la civilisation arrête de faire des enfants.
					</FormDescription>
					<FormFieldErrors />
				</FormField>
			</CardContent>
		</Card>

		<Card class="card bg-neutral text-neutral-content shadow-xl">
			<CardHeader>
				<CardTitle>Échanges</CardTitle>
			</CardHeader>
			<CardContent>
				{#if data.otherCivilizations.length}
					<FormFieldset {form} name="openExchange" class="flex flex-col gap-3">
						<FormLegend>
							Civilisations avec lesquelles ouvrir les échanges de ressources
						</FormLegend>
						<FormDescription>
							L'échange n'a lieu que s'il est mutuel : l'autre civilisation doit elle aussi vous
							ajouter. Les ressources des deux civilisations seront alors équilibrées chaque mois.
						</FormDescription>
						{#each data.otherCivilizations as otherCivilization}
							<div class="flex items-center gap-2">
								<Checkbox
									id="exchange-{otherCivilization.id}"
									checked={$formData.openExchange.includes(otherCivilization.id)}
									onCheckedChange={(checked: boolean | 'indeterminate') =>
										toggleExchange(otherCivilization.id, checked)}
								/>
								<label for="exchange-{otherCivilization.id}">{otherCivilization.name}</label>
							</div>
						{/each}
						<FormFieldErrors />
					</FormFieldset>
				{:else}
					<p>Vous n'avez pas d'autre civilisation avec laquelle ouvrir des échanges.</p>
				{/if}
			</CardContent>
		</Card>

		<Card class="card bg-neutral text-neutral-content shadow-xl">
			<CardHeader>
				<CardTitle>Militaire</CardTitle>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<FormField {form} name="militaryRatio">
					<FormControl >
						{#snippet children({ props })}
												<FormLabel>Ratio militaire (%)</FormLabel>
							<Input
								type="number"
								min="0"
								max="100"
								{...props}
								bind:value={$formData.militaryRatio}
							/>
																	{/snippet}
										</FormControl>
					<FormDescription>
						Part des adultes entretenus comme soldats (0–100%).
					</FormDescription>
					<FormFieldErrors />
				</FormField>

				{#if data.otherCivilizations.length}
					<FormFieldset {form} name="atWarWith" class="flex flex-col gap-3">
						<FormLegend>Civilisations à attaquer</FormLegend>
						{#each data.otherCivilizations as otherCivilization}
							<div class="flex items-center gap-2">
								<Checkbox
									id="war-{otherCivilization.id}"
									checked={$formData.atWarWith.includes(otherCivilization.id)}
									onCheckedChange={(checked: boolean | 'indeterminate') =>
										toggleWar(otherCivilization.id, checked)}
								/>
								<label for="war-{otherCivilization.id}">{otherCivilization.name}</label>
							</div>
						{/each}
						<FormFieldErrors />
					</FormFieldset>
				{:else}
					<p>Vous n'avez pas d'autre civilisation à attaquer.</p>
				{/if}

				<FormField {form} name="nextBuildingToBuild">
					<FormControl >
						{#snippet children({ props })}
												<FormLabel>Prochain bâtiment à construire</FormLabel>
							<select
								{...props}
								value={$formData.nextBuildingToBuild ?? ''}
								onchange={(e) => {
									$formData.nextBuildingToBuild = e.currentTarget.value || null
								}}
								class="select select-bordered w-full"
							>
								<option value="">Aucun</option>
								{#each Object.values(BuildingTypes) as buildingType}
									<option value={buildingType}>{buildingNames[buildingType]}</option>
								{/each}
							</select>
																	{/snippet}
										</FormControl>
					<FormDescription>
						Bâtiment que la civilisation cherchera à construire en priorité.
					</FormDescription>
					<FormFieldErrors />
				</FormField>
			</CardContent>
		</Card>

		<FormButton class="btn btn-primary self-start">Enregistrer la configuration</FormButton>
	</form>
</div>
</div>
