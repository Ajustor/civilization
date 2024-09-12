<script lang="ts">
	import { passwordChangeSchema } from '$lib/schemas/passwordChanger'
	import { toast } from 'svelte-sonner'
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { useUser } from '../../stores/user'
	import type { PageData } from './$types'
	import {
		FormButton,
		FormControl,
		FormDescription,
		FormField,
		FormFieldErrors,
		FormLabel
	} from '$lib/components/ui/form'
	import { Input } from '$lib/components/ui/input'
	import { Block } from 'konsta/svelte'

	export let data: PageData

	const userStore = useUser()

	if (data.user) {
		userStore.value = data.user
	}

	const form = superForm(data.passwordChangeForm, {
		validators: zodClient(passwordChangeSchema),
		onError({ result }) {
			if (result.error) {
				toast.error(result.error.message)
			}
		}
	})

	const { form: formData, enhance, errors, constraints, message: messageStore } = form
</script>

<div class="m-auto flex w-3/4 flex-col items-center justify-center">
	<section class="flex w-full flex-col gap-16">
		<p>Bonsoir {userStore.value?.username}</p>

		<form method="post" use:enhance>
			<FormField {form} name="oldPassword">
				<FormControl let:attrs>
					<FormLabel>Ancien mot de passe</FormLabel>
					<Input
						{...attrs}
						bind:value={$formData.oldPassword}
						type="password"
						{...$constraints.oldPassword}
					/>
				</FormControl>
				<FormDescription />
				<FormFieldErrors />
			</FormField>

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
				<FormFieldErrors />
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
				<FormFieldErrors />
			</FormField>
			<FormButton>Changer mon mot de passe</FormButton>
		</form>
	</section>
</div>
