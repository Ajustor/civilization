<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte'

	// replaced dynamically
	const buildDate = __DATE__

	const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
		onRegistered(r) {
			// Vérifie périodiquement si une nouvelle version a été déployée, afin qu'une
			// application restée ouverte propose le rafraîchissement sans attendre un
			// rechargement complet de la page.
			if (r) {
				setInterval(() => {
					r.update()
				}, 60_000)
			}
		},
		onRegisterError(error) {
			console.log('SW registration error', error)
		}
	})
	const close = () => {
		offlineReady.set(false)
		needRefresh.set(false)
	}

	let toast = $derived($offlineReady || $needRefresh)
</script>

{#if toast}
	<div class="pwa-toast" role="alert">
		<div class="message">
			{#if $offlineReady}
				<span> L'application est prête </span>
			{:else}
				<span> Du nouveau contenu est disponible ! </span>
			{/if}
		</div>
		{#if $needRefresh}
			<button onclick={() => updateServiceWorker(true)}> Rafraichir </button>
		{/if}
		<button onclick={close}> Fermer </button>
	</div>
{/if}

<div class="pwa-date">
	{buildDate}
</div>

<style>
	.pwa-date {
		visibility: hidden;
	}
	.pwa-toast {
		position: fixed;
		right: 0;
		bottom: 0;
		margin: 16px;
		padding: 12px;
		border: 1px solid #8885;
		border-radius: 4px;
		z-index: 2;
		text-align: left;
		box-shadow: 3px 4px 5px 0 #8885;
		background-color: white;
	}
	.pwa-toast .message {
		margin-bottom: 8px;
	}
	.pwa-toast button {
		border: 1px solid #8885;
		outline: none;
		margin-right: 5px;
		border-radius: 2px;
		padding: 3px 10px;
	}
</style>
