<script lang="ts">
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { newCivilizationSchema } from '$lib/schemas/newCivilization'
	import {
		FormControl,
		FormDescription,
		FormField,
		FormFieldErrors,
		FormLabel
	} from '$lib/components/ui/form'
	import {
		callDeleteCivilization,
		callGetCivilizations
	} from '../../services/sveltekit-api/civilization'
	import { type CivilizationType, ResourceTypes } from '@ajustor/simulation'

	interface Props {
		data: PageData;
	}

	let { data = $bindable() }: Props = $props()

	const worlds = data.worlds ?? []

	const form = superForm(data.civilizationCreationForm, {
		validators: zodClient(newCivilizationSchema),
		onError({ result }) {
			if (result.error) toast.error(result.error.message)
		},
		onUpdate({ result }) {
			if (result.type === 'success' && result.data?.myCivilizations) {
				isDialogOpen = false
				data.myCivilizations = result.data.myCivilizations
			}
		}
	})

	let isDialogOpen = $state(false)
	let deleteDialogOpen = $state(false)
	let civilizationIdToDelete: string | null = null

	const { form: formData, enhance } = form

	// Pré-sélectionne le premier monde pour que la création cible toujours un monde.
	if (worlds.length && !$formData.worldId) {
		$formData.worldId = worlds[0].id
	}

	const openDeleteModal = (id: string) => {
		civilizationIdToDelete = id
		deleteDialogOpen = true
	}

	const deleteCivilization = async () => {
		if (!civilizationIdToDelete) return
		const loaderId = toast.loading('Suppression en cours')
		await callDeleteCivilization(civilizationIdToDelete).catch((error) => {
			toast.dismiss(loaderId)
			toast.error('Erreur lors de la suppression')
			throw error
		})
		toast.dismiss(loaderId)
		toast.success('Civilisation supprimée')
		const { myCivilizations } = await callGetCivilizations()
		data.myCivilizations = myCivilizations
		civilizationIdToDelete = null
		deleteDialogOpen = false
	}

	const getResourceQty = (civ: CivilizationType, type: ResourceTypes) =>
		civ.resources.find((r) => r.type === type)?.quantity ?? 0
</script>

<svelte:head>
	<title>Mes civilisations — Civilizations</title>
	<meta name="description" content="La page pour gérer mes civilisations" />
</svelte:head>

<!-- Create civilization modal -->
{#if isDialogOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		style="position:fixed; inset:0; z-index:50; background:rgba(40,25,10,.45); display:flex; align-items:center; justify-content:center; padding:16px;"
		onclick={() => (isDialogOpen = false)}
	>
		<div
			style="background:radial-gradient(circle at 18% 12%, rgba(150,110,60,.06), transparent 45%), oklch(0.95 0.022 84); border:1px solid oklch(0.78 0.045 70); box-shadow:inset 0 0 0 5px oklch(0.93 0.03 84), inset 0 0 0 6px oklch(0.74 0.05 60), 0 20px 48px rgba(60,40,20,.24); border-radius:5px; padding:32px; width:100%; max-width:480px;"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<h2 style="font-family:'Marcellus',serif; font-size:22px; margin:0 0 8px; color:oklch(0.3 0.04 40);">Fonder une civilisation</h2>
			<p style="font-size:16px; color:oklch(0.5 0.03 50); margin:0 0 20px;">Nommez votre civilisation, la simulation se charge du reste.</p>
			<form method="post" use:enhance action="?/createNewCivilization" style="display:flex; flex-direction:column; gap:16px;">
				<FormField {form} name="name">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Le nom de votre civilisation</FormLabel>
							<input
								type="text"
								{...props}
								bind:value={$formData.name}
								style="width:100%; padding:10px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); color:oklch(0.3 0.04 40); font-family:'EB Garamond',serif; font-size:16px; box-sizing:border-box;"
							/>
						{/snippet}
					</FormControl>
					<FormDescription />
					<FormFieldErrors />
				</FormField>
				{#if worlds.length}
					<FormField {form} name="worldId">
						<FormControl>
							{#snippet children({ props })}
								<FormLabel>Monde</FormLabel>
								<select
									{...props}
									bind:value={$formData.worldId}
									style="width:100%; padding:10px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); color:oklch(0.3 0.04 40); font-family:'EB Garamond',serif; font-size:16px;"
								>
									<option value="">— Choisir un monde —</option>
									{#each worlds as world}
										<option value={world.id}>{world.name}</option>
									{/each}
								</select>
							{/snippet}
						</FormControl>
						<FormFieldErrors />
					</FormField>
				{:else}
					<p style="font-size:14px; color:oklch(0.5 0.03 50); margin:0;">Aucun monde disponible pour le moment.</p>
				{/if}
				<div style="display:flex; gap:10px; justify-content:flex-end;">
					<button
						type="button"
						onclick={() => (isDialogOpen = false)}
						style="padding:10px 18px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:none; color:oklch(0.45 0.06 40); font-family:'Marcellus',serif; font-size:16px; cursor:pointer;"
					>Annuler</button>
					<button
						type="submit"
						style="padding:10px 20px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:16px; cursor:pointer; box-shadow:0 4px 12px rgba(80,30,20,.24);"
					>Créer ma civilisation</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete confirmation modal -->
{#if deleteDialogOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		style="position:fixed; inset:0; z-index:50; background:rgba(40,25,10,.45); display:flex; align-items:center; justify-content:center; padding:16px;"
		onclick={() => (deleteDialogOpen = false)}
	>
		<div
			style="background:radial-gradient(circle at 18% 12%, rgba(150,110,60,.06), transparent 45%), oklch(0.95 0.022 84); border:1px solid oklch(0.78 0.045 70); box-shadow:inset 0 0 0 5px oklch(0.93 0.03 84), inset 0 0 0 6px oklch(0.74 0.05 60), 0 20px 48px rgba(60,40,20,.24); border-radius:5px; padding:32px; width:100%; max-width:420px;"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<h2 style="font-family:'Marcellus',serif; font-size:20px; margin:0 0 12px; color:oklch(0.3 0.04 40);">Supprimer la civilisation</h2>
			<p style="font-size:16px; color:oklch(0.5 0.03 50); margin:0 0 24px; line-height:1.5;">La suppression est irréversible. Êtes-vous sûr de vouloir supprimer votre civilisation ?</p>
			<div style="display:flex; gap:10px; justify-content:flex-end;">
				<button
					onclick={() => (deleteDialogOpen = false)}
					style="padding:10px 18px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:none; color:oklch(0.45 0.06 40); font-family:'Marcellus',serif; font-size:16px; cursor:pointer;"
				>Annuler</button>
				<button
					onclick={deleteCivilization}
					style="padding:10px 20px; border:none; border-radius:4px; background:oklch(0.52 0.2 30); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:16px; cursor:pointer; box-shadow:0 4px 12px rgba(120,30,10,.24);"
				>Supprimer</button>
			</div>
		</div>
	</div>
{/if}

<div class="civ-page-wrapper">
	<!-- Page header -->
	<div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:24px;" class="civ-animate-in">
		<div>
			<h1 style="font-family:'Tangerine',cursive; font-size:clamp(32px,5vw,42px); margin:0; color:oklch(0.3 0.04 40);">Mes civilisations</h1>
			<div style="font-size:18px; color:oklch(0.48 0.03 50); margin-top:4px;">Vos lignées sous votre regard.</div>
		</div>

		<button
			onclick={() => (isDialogOpen = true)}
			style="display:flex; align-items:center; gap:8px; padding:12px 20px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:17px; cursor:pointer; box-shadow:0 4px 12px rgba(80,30,20,.24);"
		>
			<span style="font-size:22px; line-height:1;">+</span> Fonder une civilisation
		</button>
	</div>

	<!-- Civilization cards grid -->
	{#await data.myCivilizations}
		<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;" class="civ-animate-rise">
			{#each [1,2,3] as _}
				<div style="height:280px; border-radius:5px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
			{/each}
		</div>
	{:then myCivilizations}
		{#if myCivilizations.length}
			<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;" class="civ-animate-rise">
				{#each myCivilizations as civ}
					{@const foodQty = getResourceQty(civ, ResourceTypes.RAW_FOOD)}
					{@const woodQty = getResourceQty(civ, ResourceTypes.WOOD)}
					{@const maxFood = Math.max(foodQty, 1000)}
					{@const maxWood = Math.max(woodQty, 1000)}
					<div style="padding:26px; border-radius:5px; background:radial-gradient(circle at 18% 12%, rgba(150,110,60,.06), transparent 45%), oklch(0.95 0.022 84); border:1px solid oklch(0.78 0.045 70); box-shadow:inset 0 0 0 5px oklch(0.93 0.03 84), inset 0 0 0 6px oklch(0.74 0.05 60), 0 12px 32px rgba(60,40,20,.12); display:flex; flex-direction:column;">
						<div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid oklch(0.8 0.04 70); padding-bottom:14px;">
							<h2 style="font-family:'Marcellus',serif; font-size:25px; margin:0; color:oklch(0.32 0.04 40);">{civ.name}</h2>
							<div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
								<span style="font-size:14px; color:oklch(0.5 0.03 50); text-align:right; line-height:1.3;">{~~(civ.livedMonths / 12)} ans · {civ.livedMonths % 12} mois</span>
								{#if (civ as any).recentAttacksCount > 0}
									<span style="font-size:12px; font-family:'Marcellus',serif; background:oklch(0.52 0.22 30); color:oklch(0.97 0.01 84); border-radius:10px; padding:2px 8px; white-space:nowrap;">
										⚔ {(civ as any).recentAttacksCount} attaque{(civ as any).recentAttacksCount > 1 ? 's' : ''}
									</span>
								{/if}
							</div>
						</div>

						<div style="display:flex; gap:24px; margin:16px 0;">
							<div>
								<div style="font-family:'Tangerine',cursive; font-size:28px; color:oklch(0.45 0.09 150);">{civ.citizensCount}</div>
								<div style="font-size:14px; color:oklch(0.5 0.03 50);">citoyens</div>
							</div>
							<div>
								<div style="font-family:'Tangerine',cursive; font-size:28px; color:oklch(0.45 0.1 38);">{civ.buildings.reduce((a, b) => a + b.count, 0)}</div>
								<div style="font-size:14px; color:oklch(0.5 0.03 50);">bâtiments</div>
							</div>
						</div>

						<div style="display:flex; flex-direction:column; gap:9px; margin-bottom:18px;">
							<div>
								<div style="display:flex; justify-content:space-between; font-size:15px; margin-bottom:4px;">
									<span>Nourriture</span>
									<span style="color:oklch(0.5 0.03 50);">{foodQty}</span>
								</div>
								<div class="civ-progress-bar">
									<div class="civ-progress-fill" style="width:{Math.min(100, (foodQty/maxFood)*100)}%; background:oklch(0.55 0.1 130);"></div>
								</div>
							</div>
							<div>
								<div style="display:flex; justify-content:space-between; font-size:15px; margin-bottom:4px;">
									<span>Bois</span>
									<span style="color:oklch(0.5 0.03 50);">{woodQty}</span>
								</div>
								<div class="civ-progress-bar">
									<div class="civ-progress-fill" style="width:{Math.min(100, (woodQty/maxWood)*100)}%; background:oklch(0.5 0.09 70);"></div>
								</div>
							</div>
						</div>

						<div style="display:flex; gap:8px; margin-top:auto;">
							<a href="/my-civilizations/{civ.id}" style="flex:1; display:flex; align-items:center; justify-content:center; padding:11px; border:1px solid oklch(0.5 0.13 34); border-radius:4px; background:none; color:oklch(0.45 0.12 34); font-family:'Marcellus',serif; font-size:16px; cursor:pointer; text-decoration:none;">Voir le détail</a>
							<button onclick={() => openDeleteModal(civ.id)} title="Supprimer" style="padding:11px 14px; border:1px solid oklch(0.52 0.2 30); border-radius:4px; background:none; color:oklch(0.52 0.2 30); cursor:pointer; font-size:18px;">✕</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="civ-card" style="text-align:center; padding:48px;">
				<div style="font-family:'Marcellus',serif; font-size:22px; color:oklch(0.48 0.03 50); margin-bottom:16px;">Aucune civilisation fondée</div>
				<div style="font-size:16px; color:oklch(0.54 0.03 50);">Utilisez le bouton ci-dessus pour fonder votre première civilisation.</div>
			</div>
		{/if}
	{:catch error}
		<div class="civ-card" style="color:oklch(0.52 0.2 30);">{error}</div>
	{/await}
</div>
