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
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import { toast } from 'svelte-sonner'
	import { iForgotSchema } from '$lib/schemas/iForgot'
	import type { PageData } from './$types'

	export let data: PageData

	const form = superForm(data.iForgotForm, {
		validators: zodClient(iForgotSchema)
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

<div class="m-auto flex w-3/4 flex-col items-center justify-center">
	<Card class="m-auto w-full lg:w-1/2">
		<CardHeader>
			<CardTitle>Nouveau mot de passe</CardTitle>
		</CardHeader>
		<CardContent>
			<form method="post" use:enhance>
				<FormField {form} name="newPassword">
					<FormControl let:attrs>
						<FormLabel>Nouveau mot de passe</FormLabel>
						<Input
							{...attrs}
							bind:value={$formData.newPassword}
							type="password"
							{...$constraints.newPassword}
						/>
					</FormControl>
					<FormDescription />
					<FormFieldErrors>
						{#if $errors.newPassword}
							{$errors.newPassword}
						{/if}
					</FormFieldErrors>
				</FormField>

				<FormField {form} name="authorizationKey">
					<FormControl let:attrs>
						<Input {...attrs} bind:value={data.authorizationKey} type="hidden" />
					</FormControl>
				</FormField>

				<FormField {form} name="userId">
					<FormControl let:attrs>
						<Input {...attrs} bind:value={data.userId} type="hidden" />
					</FormControl>
				</FormField>

				<FormField {form} name="newPasswordVerif">
					<FormControl let:attrs>
						<FormLabel>Vérification du nouveau mot de passe</FormLabel>
						<Input
							{...attrs}
							bind:value={$formData.newPasswordVerif}
							type="password"
							{...$constraints.newPasswordVerif}
						/>
					</FormControl>
					<FormDescription />
					<FormFieldErrors>
						{#if $errors.newPasswordVerif}
							{$errors.newPasswordVerif}
						{/if}
					</FormFieldErrors>
				</FormField>
				<FormButton>Changer mon mot de passe</FormButton>
			</form>
		</CardContent>
	</Card>
</div>
