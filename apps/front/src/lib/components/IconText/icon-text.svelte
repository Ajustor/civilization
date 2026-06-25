<script lang="ts">
	import Icon from '@iconify/svelte'

	interface Props {
		icon: string;
		text: string | number | undefined;
	}

	let { icon, text }: Props = $props();
</script>

<div class="flex items-center">
	<Icon {icon} width="30" />
	<span class="ml-4">{text}</span>
</div>
