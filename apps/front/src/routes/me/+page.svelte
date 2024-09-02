<script lang="ts">
	import { useUser } from '../../stores/user'

	const userStore = useUser()
</script>

<p>Bonsoir {userStore.value?.username}</p>
