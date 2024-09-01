<script lang="ts">
	import type { ActionData, PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import { Button } from '$lib/components/ui/button'
	import { Plus } from 'lucide-svelte'
	import {
		Dialog,
		DialogTrigger,
		DialogContent,
		DialogHeader,
		DialogDescription
	} from '$lib/components/ui/dialog'
	import { Label } from '$lib/components/ui/label'
	import { Input } from '$lib/components/ui/input'
	import { loginSchema } from '$lib/schemas/login'
	import { superValidate, superForm } from 'sveltekit-superforms'
	import { zod, zodClient } from 'sveltekit-superforms/adapters'
	import { newCivilizationSchema } from '$lib/schemas/newCivilization'
	import {
		FormButton,
		FormControl,
		FormDescription,
		FormField,
		FormFieldErrors,
		FormLabel
	} from '$lib/components/ui/form'

	export let data: PageData

	export let formResponse: ActionData

	const translatedResourceName = {
		food: 'Nouriture',
		wood: 'bois'
	}

	const form = superForm(data.civilizationCreationForm, {
		validators: zodClient(newCivilizationSchema)
	})

	const { form: formData, enhance, errors } = form
</script>

<svelte:head>
	<title>Mes civilisations</title>
	<meta name="description" content="La page pour gérer mes civilisations" />
</svelte:head>

<Dialog>
	<DialogTrigger><Button><Plus /> Créer une nouvelle civilisation</Button></DialogTrigger>
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
					<FormFieldErrors>
						{#if $errors.name}
							{$errors.name}
						{/if}
					</FormFieldErrors>
				</FormField>
				<FormButton data-dialog-close>Créer ma civilisation</FormButton>
			</form>
		</DialogDescription>
	</DialogContent>
</Dialog>

<section>
	<Root
		opts={{
			align: 'start'
		}}
		class="w-full max-w-sm"
	>
		<Content>
			{#each data.myCivilizations as civilization}
				<!-- content here -->
				<Item>
					<Card>
						<CardHeader>
							<CardTitle>
								{civilization.name}
							</CardTitle>
						</CardHeader>
						<CardContent>
							Citoyens:
							<ul>
								{#each civilization.citizens as citizen}
									<li>
										{citizen.name} ({citizen.years} ans): {citizen.profession}
										Nombre de point de vie restant: {citizen.lifeCounter}
									</li>
								{/each}
							</ul>
							Bâtiments:
							<ul>
								{#each civilization.buildings as building}
									<li>
										{building.type}: avec une capacité de {building.capacity} citoyens
									</li>
								{/each}
							</ul>
							Resources:
							<ul>
								{#each civilization.resources as resource}
									<li>{translatedResourceName[resource.type]}: {resource.quantity} restante</li>
								{/each}
							</ul>
						</CardContent>
					</Card>
				</Item>
			{/each}
		</Content>
		<Previous variant="ghost" />
		<Next variant="ghost" />
	</Root>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
