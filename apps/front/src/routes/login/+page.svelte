<script lang="ts">
	import { Input } from '$lib/components/ui/input'
	import { loginSchema } from '$lib/schemas/login'
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'
	import { redirect } from '@sveltejs/kit'

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props()

	const form = superForm(data.loginForm, {
		validators: zodClient(loginSchema)
	})

	const { form: formData, enhance, errors, constraints, message: messageStore } = form

	messageStore.subscribe((message) => {
		if (!message) return
		if (message.status === 'error') {
			toast.error(message.text, { class: 'border-red-600' })
			return
		}
		toast.info(message.text)
	})

	let email = $state('')

	const askANewPassword = async () => {
		if (!email) {
			toast.error("Merci d'entrer une adresse email")
			return
		}
		await fetch('/login', { body: JSON.stringify({ email }), method: 'POST' })
		throw redirect(302, '/login')
	}

	let showForgot = $state(false)
</script>

<svelte:head>
	<title>Connexion — Civilizations</title>
</svelte:head>

<div style="flex:1; display:flex; align-items:center; justify-content:center; padding:24px;">
	<div style="width:min(440px,100%); padding:clamp(28px,5vw,44px); border-radius:5px; background:radial-gradient(circle at 18% 12%, rgba(150,110,60,.07), transparent 45%), oklch(0.95 0.022 84); border:1px solid oklch(0.78 0.045 70); box-shadow:inset 0 0 0 6px oklch(0.93 0.03 84), inset 0 0 0 7px oklch(0.74 0.05 60), 0 22px 60px rgba(60,40,20,.22); animation:loginIn .5s cubic-bezier(.22,.72,.2,1) both;">
		<!-- Logo + Brand -->
		<div style="display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:26px;">
			<div style="width:72px; height:72px; border-radius:50%; background:radial-gradient(circle at 35% 30%, oklch(0.55 0.14 38), oklch(0.4 0.13 34)); color:oklch(0.94 0.03 84); display:flex; align-items:center; justify-content:center; font-family:'Marcellus',serif; font-size:34px; box-shadow:0 6px 16px rgba(80,30,20,.3), inset 0 2px 6px rgba(255,220,180,.4);">C</div>
			<h1 style="font-family:'Marcellus',serif; font-size:38px; margin:18px 0 4px; color:oklch(0.3 0.04 40);">Civilizations</h1>
		</div>

		<!-- Auth tabs -->
		<div style="display:flex; border-bottom:1px solid oklch(0.8 0.04 70); margin-bottom:22px;">
			<button style="flex:1; padding:11px; border:none; background:none; cursor:pointer; font-family:'Marcellus',serif; font-size:17px; color:oklch(0.4 0.12 34); border-bottom:2px solid oklch(0.5 0.13 34); margin-bottom:-1px;">Connexion</button>
			<a href="/register" style="flex:1; padding:11px; display:flex; align-items:center; justify-content:center; text-decoration:none; font-family:'Marcellus',serif; font-size:17px; color:oklch(0.58 0.03 50); border-bottom:2px solid transparent; margin-bottom:-1px;">Inscription</a>
		</div>

		{#if !showForgot}
			<!-- Login form -->
			<form method="post" use:enhance style="display:flex; flex-direction:column; gap:14px;">
				<div>
					<div style="font-size:15px; color:oklch(0.46 0.04 45); margin-bottom:6px;">Adresse de courrier ou nom</div>
					<input
						name="username"
						bind:value={$formData.username}
						placeholder="sigrun@valombre.fr"
						style="width:100%; padding:11px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.32 0.03 50); box-sizing:border-box;"
					/>
					{#if $errors.username}<div style="font-size:13px; color:oklch(0.52 0.2 30); margin-top:4px;">{$errors.username}</div>{/if}
				</div>
				<div>
					<div style="font-size:15px; color:oklch(0.46 0.04 45); margin-bottom:6px;">Mot de passe</div>
					<input
						name="password"
						bind:value={$formData.password}
						type="password"
						placeholder="••••••••"
						style="width:100%; padding:11px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.32 0.03 50); box-sizing:border-box;"
					/>
					{#if $errors.password}<div style="font-size:13px; color:oklch(0.52 0.2 30); margin-top:4px;">{$errors.password}</div>{/if}
				</div>
				<button type="submit" style="width:100%; padding:13px; margin-top:6px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:18px; letter-spacing:.03em; cursor:pointer; box-shadow:0 4px 14px rgba(80,30,20,.28);">Entrer dans le monde</button>
				<div onclick={() => showForgot = true} style="text-align:center; font-size:15px; color:oklch(0.5 0.06 40); margin-top:4px; cursor:pointer;">Mot de passe oublié&nbsp;?</div>
			</form>
		{:else}
			<!-- Forgot password form -->
			<div style="display:flex; flex-direction:column; gap:14px;">
				<div>
					<div style="font-size:15px; color:oklch(0.46 0.04 45); margin-bottom:6px;">Votre adresse de courrier</div>
					<input
						type="email"
						bind:value={email}
						placeholder="sigrun@valombre.fr"
						style="width:100%; padding:11px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.98 0.01 84); font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.32 0.03 50); box-sizing:border-box;"
					/>
				</div>
				<button onclick={askANewPassword} style="width:100%; padding:13px; margin-top:6px; border:none; border-radius:4px; background:oklch(0.5 0.13 34); color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:18px; letter-spacing:.03em; cursor:pointer; box-shadow:0 4px 14px rgba(80,30,20,.28);">Envoyer le lien</button>
				<div onclick={() => showForgot = false} style="text-align:center; font-size:15px; color:oklch(0.5 0.06 40); margin-top:4px; cursor:pointer;">‹ Retour à la connexion</div>
			</div>
		{/if}
	</div>
</div>
