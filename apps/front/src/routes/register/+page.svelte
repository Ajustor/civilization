<script lang="ts">
	import {
		FormControl,
		FormField,
		FormLabel,
		FormButton,
		FormFieldErrors,
		FormDescription,
		Button
	} from '$lib/components/ui/form'

	import { Input } from '$lib/components/ui/input'
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'

	import { newUserSchema } from '$lib/schemas/newUser'
	import { Block } from 'konsta/svelte'

	export let data: PageData

	const form = superForm(data.newUserForm, {
		validators: zodClient(newUserSchema)
	})

	const { form: formData, enhance, errors, constraints, message: messageStore } = form

	messageStore.subscribe((message) => {
		if (!message) {
			return
		}

		if (message.status === 'error') {
			toast.error(message.text, { class: 'border-red-600' })
			return
		}

		toast.info(message.text)
	})

	let email = ''
</script>

<div class="m-auto flex w-3/4 flex-col items-center justify-center">
	<Card class="m-auto w-3/4 lg:w-1/2">
		<CardHeader>
			<CardTitle>Connexion</CardTitle>
		</CardHeader>
		<CardContent>
			<form method="post" use:enhance>
				<FormField {form} name="username">
					<FormControl let:attrs>
						<FormLabel>Nom d'utilisateur</FormLabel>
						<Input {...attrs} bind:value={$formData.username} {...$constraints.username} />
					</FormControl>
					<FormDescription />
					<FormFieldErrors>
						{#if $errors.username}
							{$errors.username}
						{/if}
					</FormFieldErrors>
				</FormField>

				<FormField {form} name="email">
					<FormControl let:attrs>
						<FormLabel>Email</FormLabel>
						<Input {...attrs} bind:value={$formData.email} {...$constraints.email} />
					</FormControl>
					<FormDescription />
					<FormFieldErrors>
						{#if $errors.email}
							{$errors.email}
						{/if}
					</FormFieldErrors>
				</FormField>

				<FormField {form} name="password">
					<FormControl let:attrs>
						<FormLabel>Mot de passe</FormLabel>
						<Input
							{...attrs}
							bind:value={$formData.password}
							type="password"
							{...$constraints.password}
						/>
					</FormControl>
					<FormDescription />
					<FormFieldErrors>
						{#if $errors.password}
							{$errors.password}
						{/if}
					</FormFieldErrors>
				</FormField>

				<FormField {form} name="passwordVerif">
					<FormControl let:attrs>
						<FormLabel>Vérification du mot de passe</FormLabel>
						<Input
							{...attrs}
							bind:value={$formData.passwordVerif}
							type="password"
							{...$constraints.passwordVerif}
						/>
					</FormControl>
					<FormDescription />
					<FormFieldErrors>
						{#if $errors.passwordVerif}
							{$errors.passwordVerif}
						{/if}
					</FormFieldErrors>
				</FormField>
				<FormButton>Créer mon compte</FormButton>
			</form>
		</CardContent>
	</Card>
</div>
