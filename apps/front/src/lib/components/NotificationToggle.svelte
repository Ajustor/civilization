<script lang="ts">
	import { onMount } from 'svelte'
	import { toast } from 'svelte-sonner'
	import {
		disablePush,
		enablePush,
		getPushState,
		isPushSupported,
		type PushState
	} from '../../services/push'

	interface Props {
		authToken?: string
	}

	let { authToken }: Props = $props()

	let pushState: PushState = $state('unsupported')
	let loading = $state(false)

	onMount(async () => {
		if (!isPushSupported()) {
			pushState = 'unsupported'
			return
		}
		pushState = await getPushState()
	})

	const toggle = async () => {
		if (!authToken) {
			toast.error('Vous devez être connecté pour activer les notifications.')
			return
		}
		loading = true
		try {
			if (pushState === 'enabled') {
				pushState = await disablePush(authToken)
				toast.success("Notifications d'attaque désactivées")
			} else {
				pushState = await enablePush(authToken)
				if (pushState === 'enabled') {
					toast.success("Notifications d'attaque activées")
				} else if (pushState === 'denied') {
					toast.error(
						'Les notifications sont bloquées dans votre navigateur. Autorisez-les pour être prévenu des attaques.'
					)
				}
			}
		} catch (error) {
			console.error(error)
			toast.error(
				error instanceof Error
					? error.message
					: 'Impossible de modifier les notifications.'
			)
		} finally {
			loading = false
		}
	}
</script>

<div class="civ-inner-card">
	<h2 class="civ-section-title">Notifications d'attaque</h2>

	{#if pushState === 'unsupported'}
		<p style="font-size:15px; color:oklch(0.5 0.03 50); margin:0;">
			Votre navigateur ne supporte pas les notifications push. Installez l'application
			(PWA) ou utilisez un navigateur compatible pour être prévenu des attaques.
		</p>
	{:else}
		<p style="font-size:15px; color:oklch(0.48 0.03 50); margin:0 0 14px;">
			Recevez une notification dès qu'une civilisation vous déclare la guerre, pour avoir
			le temps de préparer vos défenses.
		</p>

		{#if pushState === 'denied'}
			<p style="font-size:14px; color:oklch(0.5 0.13 34); margin:0 0 14px;">
				Les notifications sont actuellement bloquées dans les réglages de votre navigateur.
			</p>
		{/if}

		<button
			type="button"
			onclick={toggle}
			disabled={loading || pushState === 'denied'}
			style="align-self:flex-start; padding:12px 22px; border:none; border-radius:4px; background:{pushState ===
			'enabled'
				? 'oklch(0.5 0.06 40)'
				: 'oklch(0.5 0.13 34)'}; color:oklch(0.95 0.02 84); font-family:'Marcellus',serif; font-size:17px; cursor:{loading ||
			pushState === 'denied'
				? 'not-allowed'
				: 'pointer'}; opacity:{loading || pushState === 'denied' ? 0.6 : 1}; box-shadow:0 4px 12px rgba(80,30,20,.24);"
		>
			{#if loading}
				Patientez…
			{:else if pushState === 'enabled'}
				Désactiver les notifications
			{:else}
				Activer les notifications
			{/if}
		</button>
	{/if}
</div>
