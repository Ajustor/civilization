<script lang="ts">
	export let iconComponent
	export let text: string | number
</script>

<div class="flex items-center">
	<svelte:component this={iconComponent} />
	<span class="ml-4">{text}</span>
</div>
