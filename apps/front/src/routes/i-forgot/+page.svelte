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

	interface Props {
		data: PageData;
	}

	let { data = $bindable() }: Props = $props();

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
					<FormControl >
						{#snippet children({ props })}
												<FormLabel>Nouveau mot de passe</FormLabel>
							<Input
								{...props}
								bind:value={$formData.newPassword}
								type="password"
								{...$constraints.newPassword}
							/>
																	{/snippet}
										</FormControl>
					<FormDescription />
					<FormFieldErrors>
						{#if $errors.newPassword}
							{$errors.newPassword}
						{/if}
					</FormFieldErrors>
				</FormField>

				<FormField {form} name="authorizationKey">
					<FormControl >
						{#snippet children({ props })}
												<Input {...props} bind:value={data.authorizationKey} type="hidden" />
																	{/snippet}
										</FormControl>
				</FormField>

				<FormField {form} name="userId">
					<FormControl >
						{#snippet children({ props })}
												<Input {...props} bind:value={data.userId} type="hidden" />
																	{/snippet}
										</FormControl>
				</FormField>

				<FormField {form} name="newPasswordVerif">
					<FormControl >
						{#snippet children({ props })}
												<FormLabel>Vérification du nouveau mot de passe</FormLabel>
							<Input
								{...props}
								bind:value={$formData.newPasswordVerif}
								type="password"
								{...$constraints.newPasswordVerif}
							/>
																	{/snippet}
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
