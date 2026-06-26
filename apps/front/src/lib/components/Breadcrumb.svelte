<script lang="ts">
	type Crumb = { label: string; href?: string }

	let { items }: { items: Crumb[] } = $props()
</script>

<nav
	aria-label="Fil d'Ariane"
	style="font-family:'EB Garamond',serif; font-size:15px; color:oklch(0.55 0.03 50); margin-bottom:20px; animation:screenIn .4s ease both;"
>
	{#each items as item, i (i)}
		{#if item.href && i < items.length - 1}
			<a href={item.href} style="color:oklch(0.5 0.1 40); text-decoration:none;">{item.label}</a>
		{:else}
			<span aria-current="page" style="color:oklch(0.4 0.04 45);">{item.label}</span>
		{/if}
		{#if i < items.length - 1}
			<span style="margin:0 6px; color:oklch(0.6 0.05 60);">›</span>
		{/if}
	{/each}
</nav>
