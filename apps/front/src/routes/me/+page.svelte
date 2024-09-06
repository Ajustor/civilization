<script lang="ts">
	import { useUser } from '../../stores/user'
	import type { PageData } from './$types'

	export let data: PageData

	const userStore = useUser()

	if (data.user) {
		userStore.value = data.user
	}
</script>

<p>Bonsoir {userStore.value?.username}</p>
