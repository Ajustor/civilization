<script lang="ts">
	import Icon from '@iconify/svelte'

	export let icon
	export let text: string | number | undefined
</script>

<div class="flex items-center">
	<Icon {icon} width="30" />
	<span class="ml-4">{text}</span>
</div>
