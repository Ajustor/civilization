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

	import { Label } from '$lib/components/ui/label'
	import { Input } from '$lib/components/ui/input'
	import { loginSchema } from '$lib/schemas/login'
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog'
	import { buttonVariants } from '$lib/components/ui/button'

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

	let email = ''

	const askANewPassword = () => {
		if (!email) {
			toast.error("Merci d'entrer une adresse email")
		}
		fetch('/login', { body: JSON.stringify({ email }), method: 'POST' })
	}
</script>

{#snippet forgotDialog()}
	<Dialog>
		<DialogTrigger class={buttonVariants({ variant: 'outline' })}>Mot de passe oublié</DialogTrigger
		>
		<DialogContent class="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>Mot de passe oublié</DialogTitle>
				<DialogDescription>Faire une demande de changement de mot de passe</DialogDescription>
			</DialogHeader>
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="email" class="text-right">Email</Label>
					<Input id="email" bind:value={email} type="email" class="col-span-3" />
				</div>
			</div>
			<DialogFooter>
				<Button on:click={askANewPassword}>Demander un changement</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/snippet}

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
			{@render forgotDialog()}
		</form>
	</CardContent>
</Card>
