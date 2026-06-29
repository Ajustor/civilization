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

	// Note : le choix du prochain bâtiment à construire a été déplacé vers le bloc
	// « Constructions en cours » de la page de civilisation. Le champ
	// `nextBuildingToBuild` reste néanmoins dans le formulaire (chargé puis
	// réémis tel quel) afin que l'enregistrement de cette page ne l'efface pas.

	const { form: formData, enhance: formEnhance } = form

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
							<input type="number" min="0" max="100" class="input input-bordered w-full" {...props} bind:value={$formData.maximumChildrenPercentage} />
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

		<button type="submit" style="align-self:flex-start; padding:12px 22px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:17px; cursor:pointer; box-shadow:0 4px 12px rgba(80,30,20,.24);">Enregistrer la configuration</button>
	</form>
</div>
</div>
