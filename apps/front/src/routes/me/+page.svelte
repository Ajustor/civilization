<script lang="ts">
	import { passwordChangeSchema } from '$lib/schemas/passwordChanger'
	import { toast } from 'svelte-sonner'
	import { superForm } from 'sveltekit-superforms'
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters'
	import { useUser } from '../../stores/user'
	import type { PageData } from './$types'
	import {
		FormControl,
		FormDescription,
		FormField,
		FormFieldErrors,
		FormLabel
	} from '$lib/components/ui/form'
	import NotificationToggle from '$lib/components/NotificationToggle.svelte'
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const userStore = $state(useUser())

	if (data.user) {
		userStore.value = data.user
	}

	const form = superForm(data.passwordChangeForm, {
		validators: zodClient(passwordChangeSchema),
		onError({ result }) {
			if (result.error) {
				toast.error(result.error.message)
			}
		},
		onUpdated({ form: f }) {
			if (f.message?.status === 'success') {
				toast.success(f.message.text ?? 'Mot de passe mis à jour')
			}
		}
	})

	const { form: formData, enhance, constraints } = form
</script>

<svelte:head>
	<title>Mon compte — Civilizations</title>
</svelte:head>

<div class="civ-page-wrapper">
	<Breadcrumb items={[
		{ label: 'Mes civilisations', href: '/my-civilizations' },
		{ label: 'Mon compte' }
	]} />
	<div class="civ-card" style="max-width:560px; margin:0 auto; display:flex; flex-direction:column; gap:20px; animation:screenIn .46s cubic-bezier(.22,.72,.2,1) .05s both;">
		<h1 style="font-family:'Tangerine',cursive; font-size:clamp(26px,4vw,36px); margin:0; color:oklch(0.3 0.04 40);">Mon compte</h1>
		{#if userStore.value}
			<p style="font-size:18px; color:oklch(0.48 0.03 50); margin:0;">Bonjour, <strong style="color:oklch(0.38 0.06 40);">{userStore.value.username}</strong></p>
		{/if}

		<NotificationToggle authToken={data.authToken} />

		<div class="civ-inner-card">
			<h2 class="civ-section-title">Changer mon mot de passe</h2>
			<form method="post" use:enhance style="display:flex; flex-direction:column; gap:16px;">
				<FormField {form} name="oldPassword">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Ancien mot de passe</FormLabel>
							<input
								type="password"
								{...props}
								{...$constraints.oldPassword}
								bind:value={$formData.oldPassword}
								style="width:100%; padding:10px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); color:oklch(0.3 0.04 40); font-family:'EB Garamond',serif; font-size:16px; box-sizing:border-box;"
							/>
						{/snippet}
					</FormControl>
					<FormDescription />
					<FormFieldErrors />
				</FormField>

				<FormField {form} name="newPassword">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Nouveau mot de passe</FormLabel>
							<input
								type="password"
								{...props}
								{...$constraints.newPassword}
								bind:value={$formData.newPassword}
								style="width:100%; padding:10px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); color:oklch(0.3 0.04 40); font-family:'EB Garamond',serif; font-size:16px; box-sizing:border-box;"
							/>
						{/snippet}
					</FormControl>
					<FormDescription />
					<FormFieldErrors />
				</FormField>

				<FormField {form} name="newPasswordVerif">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Vérification du nouveau mot de passe</FormLabel>
							<input
								type="password"
								{...props}
								{...$constraints.newPasswordVerif}
								bind:value={$formData.newPasswordVerif}
								style="width:100%; padding:10px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); color:oklch(0.3 0.04 40); font-family:'EB Garamond',serif; font-size:16px; box-sizing:border-box;"
							/>
						{/snippet}
					</FormControl>
					<FormDescription />
					<FormFieldErrors />
				</FormField>

				<button
					type="submit"
					style="align-self:flex-start; padding:12px 22px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:17px; cursor:pointer; box-shadow:0 4px 12px rgba(80,30,20,.24);"
				>Changer mon mot de passe</button>
			</form>
		</div>
	</div>
</div>
