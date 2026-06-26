<svelte:head>
	<title>Les règles — Civilizations</title>
	<meta name="description" content="Les règles de la simulation de civilisation" />
</svelte:head>

<div class="civ-page-wrapper">
	<div class="civ-card civ-animate-in">
		<div style="border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:20px; margin-bottom:28px;">
			<div style="font-family:'Marcellus',serif; font-size:13px; letter-spacing:.4em; text-transform:uppercase; color:oklch(0.5 0.09 40); margin-bottom:6px;">Simulation</div>
			<h1 style="font-family:'Marcellus',serif; font-size:clamp(34px,6vw,46px); margin:0; color:oklch(0.3 0.04 40);">Les règles du monde</h1>
		</div>

		<div style="display:flex; flex-direction:column; gap:24px;">

			<!-- Temps -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Le temps qui passe</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Toutes les 15 minutes, un mois passe dans le monde.</li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Un cycle complet de 12 mois correspond à une année. Les saisons se succèdent ainsi : <strong>printemps</strong> (mois 0–2), <strong>été</strong> (3–5), <strong>automne</strong> (6–8), <strong>hiver</strong> (9–11).</li>
				</ul>
			</section>

			<!-- Survie -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Survie des citoyens</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Chaque mois, les citoyens doivent <strong>manger</strong> et disposer d'un <strong>logement</strong> pour rester en vie.</li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>En automne et en hiver, ils ont également besoin de <strong>bois</strong> pour se chauffer.</li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Un citoyen ayant atteint 85 ans a <strong>20 % de chances de mourir</strong> chaque mois.</li>
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>La population d'une civilisation est <strong>limitée à 100 000 habitants</strong> (hors retraités).</li>
				</ul>
			</section>

			<!-- Reproduction -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Reproduction</h2>
				<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:17px; line-height:1.6; color:oklch(0.42 0.03 50);">
					<li style="display:flex; gap:12px;"><span style="color:oklch(0.5 0.13 34); flex-shrink:0;">·</span>Les citoyens peuvent se reproduire chaque mois à condition d'avoir une <strong>santé d'au moins 8</strong> et d'être âgés de <strong>16 à 60 ans</strong>.</li>
				</ul>
			</section>

			<!-- Métiers -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Métiers</h2>
				<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px; font-size:16px; color:oklch(0.42 0.03 50);">
					<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px;">
						<div style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40); margin-bottom:4px;">Fermier</div>
						<div>Travaille de 4 à 70 ans · consomme 1 de nourriture</div>
					</div>
					<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px;">
						<div style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40); margin-bottom:4px;">Charpentier</div>
						<div>Travaille de 12 à 60 ans · consomme 2 de nourriture</div>
					</div>
				</div>
				<div style="margin-top:12px; padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px; font-size:16px; color:oklch(0.42 0.03 50);">
					<div style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40); margin-bottom:4px;">Bâtiments</div>
					<div>Une <strong>Maison</strong> aide les citoyens à rester en vie en assurant un logement.</div>
				</div>
			</section>

			<!-- Réserves du monde -->
			<section class="civ-inner-card">
				<h2 class="civ-section-title">Réserves du monde par saison</h2>
				<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;">
					{#each [
						{ name: 'Printemps', food: '× 1,5', wood: '× 1,1', color: 'oklch(0.52 0.1 130)' },
						{ name: 'Été',       food: '× 1,75', wood: '× 1,2', color: 'oklch(0.6 0.12 70)' },
						{ name: 'Automne',   food: '× 1,2',  wood: '× 1',   color: 'oklch(0.55 0.1 50)' },
						{ name: 'Hiver',     food: '× 0,5',  wood: '× 0,75', color: 'oklch(0.5 0.05 240)' }
					] as s}
						<div style="padding:14px 16px; border:1px solid oklch(0.84 0.03 72); border-radius:4px; border-top:3px solid {s.color};">
							<div style="font-family:'Marcellus',serif; font-size:18px; color:oklch(0.34 0.04 40); margin-bottom:8px;">{s.name}</div>
							<div style="font-size:15px; color:oklch(0.42 0.03 50); display:flex; flex-direction:column; gap:4px;">
								<span>Nourriture {s.food}</span>
								<span>Bois {s.wood}</span>
							</div>
						</div>
					{/each}
				</div>
			</section>

		</div>
	</div>
</div>
