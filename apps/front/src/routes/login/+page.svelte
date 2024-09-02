<script lang="ts">
	import {
		FormControl,
		FormField,
		FormLabel,
		FormButton,
		FormFieldErrors,
		FormDescription
	} from '$lib/components/ui/form'

	import { Input } from '$lib/components/ui/input'
	import { loginSchema } from '$lib/schemas/login'
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'

	export let data: PageData

	const form = superForm(data.loginForm, {
		validators: zodClient(loginSchema)
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
</script>

<Card class="m-auto w-3/4 lg:w-1/2">
	<CardHeader>
		<CardTitle>Connexion</CardTitle>
	</CardHeader>
	<CardContent>
		<form method="post" use:enhance>
			<FormField {form} name="username">
				<FormControl let:attrs>
					<FormLabel>Email / Nom d'utilisateur</FormLabel>
					<Input {...attrs} bind:value={$formData.username} {...$constraints.username} />
				</FormControl>
				<FormDescription />
				<FormFieldErrors>
					{#if $errors.username}
						{$errors.username}
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
			<FormButton>Se connecter</FormButton>
		</form>
	</CardContent>
</Card>
