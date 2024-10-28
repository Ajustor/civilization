<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import { Button } from '$lib/components/ui/button'
	import { Carrot, FlameKindling, Landmark, PersonStanding, Plus, Trash } from 'lucide-svelte'
	import {
		Dialog,
		DialogTrigger,
		DialogContent,
		DialogHeader,
		DialogDescription
	} from '$lib/components/ui/dialog'
	import { Input } from '$lib/components/ui/input'
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { newCivilizationSchema } from '$lib/schemas/newCivilization'
	import {
		FormButton,
		FormControl,
		FormDescription,
		FormField,
		FormFieldErrors,
		FormLabel
	} from '$lib/components/ui/form'
	import { toast } from 'svelte-sonner'
	import {
		callDeleteCivilization,
		callGetCivilizations
	} from '../../services/sveltekit-api/civilization'
	import {
		AlertDialog,
		AlertDialogHeader,
		AlertDialogContent,
		AlertDialogFooter,
		AlertDialogCancel,
		AlertDialogAction
	} from '$lib/components/ui/alert-dialog'
	import { type CivilizationType } from '@ajustor/simulation'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import Cuboid from 'lucide-svelte/icons/cuboid'
	import { resourceNames } from '$lib/translations'

	export let data: PageData

	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling,
		stone: Cuboid
	}

	const form = superForm(data.civilizationCreationForm, {
		validators: zodClient(newCivilizationSchema),
		onError({ result }) {
			if (result.error) {
				toast.error(result.error.message)
			}
		},
		onUpdate({ result }) {
			if (result.type === 'success') {
				if (result.data?.myCivilizations) {
					isDialogOpen = false
					data.myCivilizations = result.data.myCivilizations
				}
			}
		}
	})

	let isDialogOpen = false
	let deleteDialogOpen = false
	let civilizationIdToDelete: string | null = null

	const { form: formData, enhance } = form

	const openDeleteModal = (civilizationId: string) => {
		civilizationIdToDelete = civilizationId
		deleteDialogOpen = true
	}

	const deleteCivilization = async () => {
		if (!civilizationIdToDelete) {
			return
		}
		const loaderId = toast.loading('Suppression de votre civilisation en cours')
		await callDeleteCivilization(civilizationIdToDelete).catch((error) => {
			toast.dismiss(loaderId)
			toast.error('Une erreur a eu lieu lors de la suppression de votre civilisation')

			throw error
		})
		toast.dismiss(loaderId)
		toast.success('Suppression de votre civilisation terminée')

		const { myCivilizations } = await callGetCivilizations()
		data.myCivilizations = myCivilizations
		civilizationIdToDelete = null
	}
</script>

<svelte:head>
	<title>Mes civilisations</title>
	<meta name="description" content="La page pour gérer mes civilisations" />
</svelte:head>

<AlertDialog bind:open={deleteDialogOpen}>
	<AlertDialogContent>
		<AlertDialogHeader>
			La suppression est irréversible, êtes vous sûr de vouloir supprimer votre civilisation ?
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>Annuler</AlertDialogCancel>
			<AlertDialogAction class="btn btn-error" on:click={deleteCivilization}>
				Supprimer
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>

{#snippet createCivilizationDialog()}
	<Dialog bind:open={isDialogOpen}>
		<DialogTrigger class="btn btn-primary">
			<Plus /> Créer une nouvelle civilisation
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>Nommez votre civilisation, la simulation se charge du reste</DialogHeader>
			<DialogDescription>
				<form method="post" use:enhance action="?/createNewCivilization">
					<FormField {form} name="name">
						<FormControl let:attrs>
							<FormLabel>Le nom de votre civilisation</FormLabel>
							<Input {...attrs} bind:value={$formData.name} />
						</FormControl>
						<FormDescription />
						<FormFieldErrors />
					</FormField>
					<FormButton data-dialog-close>Créer ma civilisation</FormButton>
				</form>
			</DialogDescription>
		</DialogContent>
	</Dialog>
{/snippet}

{#snippet civilizationInformations(civilization: CivilizationType)}
	<Card class="card bg-neutral text-neutral-content relative shadow-xl">
		<CardHeader>
			<CardTitle class="flex items-center justify-between">
				{civilization.name}
				<Button
					variant="destructive"
					title="Supprimer cette civilisation"
					class="transition-colors hover:bg-red-600"
					on:click={() => openDeleteModal(civilization.id)}
				>
					<Trash size="24" />
				</Button>
			</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			{#if !civilization.citizensCount}
				<span
					class="absolute left-0 top-0 m-0 flex h-full w-full flex-col items-center justify-center bg-red-600 p-0"
				>
					Plus personne ne vit dans "{civilization.name}"
					<Button
						variant="destructive"
						title="Supprimer cette civilisation"
						on:click={() => openDeleteModal(civilization.id)}
					>
						<Trash size="24" />
					</Button>
				</span>
			{:else}
				<IconText iconComponent={PersonStanding} text={civilization.citizensCount} />
				<IconText iconComponent={Landmark} text={civilization.buildings.length} />
				<span>
					Ressources:
					<ul>
						{#each civilization.resources as resource}
							<li>
								<IconText
									iconComponent={resourceIcons[resource.type]}
									text="{resourceNames[resource.type]}: {resource.quantity} restante"
								/>
							</li>
						{/each}
					</ul>
				</span>
				<a class="btn btn-primary" href="/my-civilizations/{civilization.id}">
					Voir le détail de la civilisation
				</a>
			{/if}
		</CardContent>
	</Card>
{/snippet}

<div class="m-auto flex w-3/4 flex-col items-center justify-center gap-4">
	{@render createCivilizationDialog()}
	{#await data.myCivilizations}
		<div
			class="card skeleton bg-neutral text-neutral-content relative h-24 w-1/3 rounded shadow-xl"
		></div>
	{:then myCivilizations}
		{#if myCivilizations.length}
			<Root
				opts={{
					slidesToScroll: 'auto'
				}}
				class="w-full"
			>
				<Content class="w-full md:w-1/2 lg:w-1/3">
					{#each myCivilizations as civilization}
						<!-- content here -->
						<Item>
							{@render civilizationInformations(civilization)}
						</Item>
					{/each}
				</Content>
				<Previous variant="ghost" />
				<Next variant="ghost" />
			</Root>
		{/if}
	{:catch error}
		{error}
	{/await}
</div>
