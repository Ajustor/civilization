<script lang="ts">
	import type { PageData } from './$types'
	import { type DeathCause } from '@ajustor/simulation'
	import { deathCauseNames } from '$lib/translations'

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString('fr-FR')

	const graves = $derived(data.cemetery?.graves ?? [])
	const causes = $derived<Record<string, number>>(
		(data.cemetery?.causes ?? {}) as Record<string, number>
	)
	const totalDeaths = $derived(
		Object.values(causes).reduce((sum: number, count) => sum + count, 0)
	)
	const causeName = (cause: string) => deathCauseNames[cause as DeathCause] ?? cause
</script>

<svelte:head>
	<title>Cimetière — {data.civilization.name}</title>
	<meta name="description" content="Le cimetière de {data.civilization.name}" />
</svelte:head>

<div class="mourning">
	<div class="mourning-wrapper">
		<!-- Fil d'Ariane assombri -->
		<nav aria-label="Fil d'Ariane" class="mourning-breadcrumb">
			<a href="/my-civilizations">Mes civilisations</a>
			<span class="sep">›</span>
			<a href="/my-civilizations/{data.slug}">{data.civilization.name}</a>
			<span class="sep">›</span>
			<span aria-current="page">Cimetière</span>
		</nav>

		<header class="mourning-header">
			<div class="kicker">In memoriam</div>
			<h1>Cimetière de {data.civilization.name}</h1>
			<p class="elegy">
				Ici reposent celles et ceux qui ont vécu, peiné et bâti. Que leur mémoire
				veille sur les vivants.
			</p>
		</header>

		<div class="mourning-card">
			{#if graves.length === 0}
				<p class="empty">Aucun défunt à pleurer pour le moment.</p>
			{:else}
				<!-- Bilan des causes (sur l'ensemble des défunts) -->
				<div class="toll">
					<span class="toll-total">🕯 {fmt(totalDeaths)} âme{totalDeaths > 1 ? 's' : ''} disparue{totalDeaths > 1 ? 's' : ''}</span>
					<div class="toll-causes">
						{#each Object.entries(causes) as [cause, count]}
							<span class="cause-chip">{causeName(cause)} : <strong>{fmt(count as number)}</strong></span>
						{/each}
					</div>
				</div>

				<!-- Stèles -->
				<ul class="graves">
					{#each graves as grave}
						<li class="grave">
							<span class="stone">🪦</span>
							<span class="name">{grave.name}</span>
							<span class="cause">{causeName(grave.cause)}</span>
							<span class="month">{#if grave.ageAtDeath != null}Décès à {~~(grave.ageAtDeath / 12)} ans · {/if}Mois {grave.month}</span>
						</li>
					{/each}
				</ul>

				<!-- Pagination -->
				<div class="pager">
					{#if data.page > 0}
						<a href="?page={data.page - 1}">← Plus récents</a>
					{:else}
						<span></span>
					{/if}
					<span class="page-no">Page {data.page + 1}</span>
					{#if graves.length === data.pageSize}
						<a href="?page={data.page + 1}">Plus anciens →</a>
					{:else}
						<span></span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.mourning {
		flex: 1;
		color: oklch(0.82 0.018 80);
		font-family: 'EB Garamond', serif;
		background:
			radial-gradient(ellipse at 50% -10%, oklch(0.24 0.025 285), transparent 60%),
			radial-gradient(ellipse at 50% 120%, oklch(0.16 0.02 280), transparent 55%),
			oklch(0.12 0.018 280);
	}

	.mourning-wrapper {
		width: min(900px, 100%);
		margin: 0 auto;
		padding: clamp(18px, 3vw, 40px);
		animation: veilIn 0.7s ease both;
	}

	@keyframes veilIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: none; }
	}

	/* Fil d'Ariane */
	.mourning-breadcrumb {
		font-size: 15px;
		color: oklch(0.55 0.015 80);
		margin-bottom: 28px;
	}
	.mourning-breadcrumb a {
		color: oklch(0.66 0.04 70);
		text-decoration: none;
	}
	.mourning-breadcrumb a:hover {
		text-decoration: underline;
	}
	.mourning-breadcrumb .sep {
		margin: 0 6px;
		color: oklch(0.42 0.02 80);
	}
	.mourning-breadcrumb [aria-current='page'] {
		color: oklch(0.78 0.02 80);
	}

	/* En-tête de deuil */
	.mourning-header {
		text-align: center;
		margin-bottom: 36px;
	}
	.kicker {
		font-family: 'Marcellus', serif;
		font-size: 13px;
		letter-spacing: 0.45em;
		text-transform: uppercase;
		color: oklch(0.62 0.06 70);
		margin-bottom: 10px;
	}
	.mourning-header h1 {
		font-family: 'Tangerine', cursive;
		font-size: clamp(40px, 7vw, 62px);
		line-height: 1.05;
		margin: 0;
		color: oklch(0.88 0.02 80);
		text-shadow: 0 2px 18px oklch(0.05 0 0 / 0.6);
	}
	.elegy {
		max-width: 540px;
		margin: 14px auto 0;
		font-size: 17px;
		font-style: italic;
		line-height: 1.6;
		color: oklch(0.6 0.015 80);
	}

	/* Carte sombre */
	.mourning-card {
		padding: clamp(20px, 3vw, 32px);
		border-radius: 6px;
		background: oklch(0.17 0.016 282);
		border: 1px solid oklch(0.3 0.02 282);
		box-shadow:
			inset 0 1px 0 oklch(0.34 0.02 282),
			0 24px 60px oklch(0.04 0 0 / 0.55);
	}

	.empty {
		text-align: center;
		font-style: italic;
		font-size: 17px;
		color: oklch(0.58 0.015 80);
		margin: 12px 0;
	}

	/* Bilan */
	.toll {
		padding-bottom: 20px;
		margin-bottom: 20px;
		border-bottom: 1px solid oklch(0.28 0.02 282);
	}
	.toll-total {
		display: block;
		font-family: 'Marcellus', serif;
		font-size: 20px;
		color: oklch(0.82 0.05 75);
		margin-bottom: 14px;
	}
	.toll-causes {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.cause-chip {
		font-size: 14px;
		padding: 5px 13px;
		border-radius: 999px;
		background: oklch(0.22 0.018 282);
		border: 1px solid oklch(0.32 0.02 282);
		color: oklch(0.7 0.015 80);
	}
	.cause-chip strong {
		color: oklch(0.85 0.04 75);
	}

	/* Stèles */
	.graves {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.grave {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 11px 16px;
		border-radius: 5px;
		background: oklch(0.2 0.015 282);
		border: 1px solid oklch(0.29 0.018 282);
		border-left: 3px solid oklch(0.5 0.05 70);
	}
	.grave .stone {
		font-size: 18px;
		flex-shrink: 0;
		filter: grayscale(0.3);
	}
	.grave .name {
		flex: 1;
		min-width: 0;
		font-family: 'Marcellus', serif;
		font-size: 16px;
		color: oklch(0.86 0.018 80);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.grave .cause {
		font-size: 14px;
		color: oklch(0.66 0.04 65);
	}
	.grave .month {
		font-size: 13px;
		color: oklch(0.55 0.015 80);
		flex-shrink: 0;
	}

	/* Pagination */
	.pager {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 24px;
	}
	.pager a {
		padding: 11px 16px;
		border: 1px solid oklch(0.34 0.02 282);
		border-radius: 4px;
		color: oklch(0.74 0.03 70);
		font-family: 'Marcellus', serif;
		font-size: 15px;
		text-decoration: none;
		transition: background 0.15s ease, border-color 0.15s ease;
	}
	.pager a:hover {
		background: oklch(0.24 0.018 282);
		border-color: oklch(0.44 0.03 282);
		text-decoration: none;
	}
	.page-no {
		font-size: 14px;
		color: oklch(0.55 0.015 80);
	}

	@media (max-width: 560px) {
		.grave {
			flex-wrap: wrap;
			gap: 6px 12px;
		}
		.grave .name {
			flex-basis: 100%;
		}
	}
</style>
