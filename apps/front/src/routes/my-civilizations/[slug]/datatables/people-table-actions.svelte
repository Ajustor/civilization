<script lang="ts">
	import Ellipsis from 'lucide-svelte/icons/ellipsis'
	import {
		DropdownMenu,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuGroup,
		DropdownMenuLabel,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu'
	import { Button } from '$lib/components/ui/button'
	import type { PeopleType } from '@ajustor/simulation'

	export let id: string
	export let people: PeopleType[]

	const showTree = () => {
		const filteredTree = people.filter(
			({ id: personId, lineage }) =>
				id === personId || lineage?.father.id === id || lineage?.mother.id === id
		)

		console.log(filteredTree)
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger asChild let:builder>
		<Button variant="ghost" builders={[builder]} size="icon" class="relative h-8 w-8 p-0">
			<span class="sr-only">Ouvrir le menu</span>
			<Ellipsis class="h-4 w-4" />
		</Button>
	</DropdownMenuTrigger>
	<DropdownMenuContent>
		<DropdownMenuGroup>
			<DropdownMenuLabel>Actions</DropdownMenuLabel>
			<DropdownMenuItem on:click={showTree}>Voir l'arbre de la personne</DropdownMenuItem>
		</DropdownMenuGroup>
		<DropdownMenuSeparator />
	</DropdownMenuContent>
</DropdownMenu>
