<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte'

	// replaced dynamically
	const buildDate = __DATE__

	const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
		onRegistered(r) {
			if (__RELOAD_SW__) {
				r &&
					setInterval(() => {
						console.log('Checking for sw update')
						r.update()
					}, 20000 /* 20s for testing purposes */)
			} else {
				console.log(`SW Registered: ${r}`)
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

	$: toast = $offlineReady || $needRefresh
</script>

{#if toast}
	<div class="pwa-toast" role="alert">
		<div class="message">
			{#if $offlineReady}
				<span> L'application est prête </span>
			{:else}
				<span> Du nouveau contenus est disponible ! </span>
			{/if}
		</div>
		{#if $needRefresh}
			<button on:click={() => updateServiceWorker(true)}> Rafraichir </button>
		{/if}
		<button on:click={close}> Fermer </button>
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
