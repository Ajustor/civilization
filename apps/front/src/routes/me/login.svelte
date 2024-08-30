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
	import { loginSchema, type LoginSchema } from '$lib/schemas/login'
	import { superForm, type SuperValidated } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import type { PageData } from './$types'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import type { Infer } from 'sveltekit-superforms/dist/adapters/typeSchema'

	export let data: SuperValidated<Infer<LoginSchema>>

	const form = superForm(data, {
		validators: zodClient(loginSchema)
	})

	const { form: formData, enhance } = form
</script>

<main class="flex h-dvh w-dvw justify-center">
	<Card class="m-auto w-3/4 lg:w-1/2">
		<CardHeader>
			<CardTitle>Connexion</CardTitle>
		</CardHeader>
		<CardContent>
			<form method="post" use:enhance action="?/login">
				<FormField {form} name="username">
					<FormControl let:attrs>
						<FormLabel>Email/ Nom d'utilisateur</FormLabel>
						<Input {...attrs} bind:value={$formData.username} />
					</FormControl>
					<FormDescription />
					<FormFieldErrors />
				</FormField>

				<FormField {form} name="password">
					<FormControl let:attrs>
						<FormLabel>Mot de passe</FormLabel>
						<Input {...attrs} bind:value={$formData.password} type="password" />
					</FormControl>
					<FormDescription />
					<FormFieldErrors />
				</FormField>
				<FormButton>Se connecter</FormButton>
			</form>
		</CardContent>
	</Card>
</main>
