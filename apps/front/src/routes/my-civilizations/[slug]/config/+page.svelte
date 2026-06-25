<script lang="ts">
	import type { PageData } from './$types'
	import { Button } from '$lib/components/ui/button'
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
	import { ArrowLeft } from '@lucide/svelte'
	import { BuildingTypes } from '@ajustor/simulation'

	export let data: PageData

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

<Button variant="ghost" href="/my-civilizations/{data.civilization.id}"><ArrowLeft />Retour</Button>

<div class="m-auto flex w-full max-w-2xl flex-col gap-5">
	<h1 class="text-3xl">Configuration de {data.civilization.name}</h1>

	<form method="post" use:enhance action="?/updateConfig" class="flex flex-col gap-6">
		<Card class="card bg-neutral text-neutral-content shadow-xl">
			<CardHeader>
				<CardTitle>Population</CardTitle>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<FormField {form} name="maximumChildren">
					<FormControl let:attrs>
						<FormLabel>Nombre maximum d'enfants simultanés</FormLabel>
						<Input type="number" min="0" {...attrs} bind:value={$formData.maximumChildren} />
					</FormControl>
					<FormDescription>
						Limite le nombre d'enfants vivants en même temps dans la civilisation.
					</FormDescription>
					<FormFieldErrors />
				</FormField>

				<FormField {form} name="maxActivePeopleByCivilization">
					<FormControl let:attrs>
						<FormLabel>Nombre maximum d'actifs</FormLabel>
						<Input
							type="number"
							min="0"
							{...attrs}
							bind:value={$formData.maxActivePeopleByCivilization}
						/>
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
					<FormControl let:attrs>
						<FormLabel>Ratio militaire (%)</FormLabel>
						<Input
							type="number"
							min="0"
							max="100"
							{...attrs}
							bind:value={$formData.militaryRatio}
						/>
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
					<FormControl let:attrs>
						<FormLabel>Prochain bâtiment à construire</FormLabel>
						<select
							{...attrs}
							value={$formData.nextBuildingToBuild ?? ''}
							on:change={(e) => {
								$formData.nextBuildingToBuild = e.currentTarget.value || null
							}}
							class="select select-bordered w-full"
						>
							<option value="">Aucun</option>
							{#each Object.values(BuildingTypes) as buildingType}
								<option value={buildingType}>{buildingType}</option>
							{/each}
						</select>
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
