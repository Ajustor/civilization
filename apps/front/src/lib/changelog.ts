// Journal des mises à jour présenté aux joueurs sur la page /changelog.
// Ajoutez les nouvelles entrées en haut de la liste (la plus récente d'abord).
// `date` est au format AAAA-MM-JJ pour pouvoir être triée/affichée proprement.

export type ChangeKind = 'feature' | 'improvement' | 'fix'

export type ChangelogChange = {
	kind: ChangeKind
	text: string
}

export type ChangelogEntry = {
	date: string
	title: string
	changes: ChangelogChange[]
}

export const changeKindLabels: Record<ChangeKind, string> = {
	feature: 'Nouveauté',
	improvement: 'Amélioration',
	fix: 'Correction'
}

export const changeKindColors: Record<ChangeKind, string> = {
	feature: 'oklch(0.5 0.13 145)',
	improvement: 'oklch(0.5 0.12 250)',
	fix: 'oklch(0.5 0.15 34)'
}

export const changelog: ChangelogEntry[] = [
	{
		date: '2026-06-29',
		title: 'Mode rapide & vue du monde enrichie',
		changes: [
			{
				kind: 'feature',
				text: 'Nouveau « mode rapide » par civilisation (dans les réglages). Si toutes les civilisations d’un monde l’activent, le temps avance d’un an (12 mois) à chaque tick au lieu d’un mois.'
			},
			{
				kind: 'improvement',
				text: 'La durée du mode rapide (nombre de mois simulés par tick) est désormais propre à chaque monde — 12 mois (un an) par défaut.'
			},
			{
				kind: 'feature',
				text: 'Sur la page du monde, un clic sur la carte des civilisations en vie ou sur le classement ouvre la liste détaillée de toutes les civilisations du monde (population, ancienneté, nombre de bâtiments, mode rapide).'
			},
			{
				kind: 'improvement',
				text: 'La page du monde indique désormais combien de civilisations sont en mode rapide et la vitesse de jeu en cours (1 mois ou 1 an toutes les 15 minutes).'
			},
			{
				kind: 'fix',
				text: 'Les offres de marché d’une civilisation disparaissent désormais lorsqu’elle meurt ou est supprimée.'
			},
			{
				kind: 'feature',
				text: 'Une civilisation voit désormais directement sur sa page quand une autre lui a déclaré la guerre, même sans notification.'
			}
		]
	},
	{
		date: '2026-06-29',
		title: 'Civilisation détaillée, guerre en façade & confort de jeu',
		changes: [
			{
				kind: 'feature',
				text: 'Chaque bâtiment de la civilisation peut être déplié pour révéler sa production, sa main-d’œuvre d’exploitation, son coût et son temps de construction.'
			},
			{
				kind: 'feature',
				text: 'La liste des citoyens indique désormais la tranche d’âge d’activité de chaque métier.'
			},
			{
				kind: 'feature',
				text: 'La guerre se gère directement depuis la page de la civilisation : choix des civilisations à attaquer, ratio militaire et indicateur des attaques en cours, sans passer par les réglages.'
			},
			{
				kind: 'feature',
				text: 'Les citoyens captifs sont mis en évidence : repère « Enlevé(e) » dans la liste et compteur de captifs.'
			},
			{
				kind: 'feature',
				text: 'Les enfants apparaissent maintenant, sous forme de barres, dans le graphique de progression de la population.'
			},
			{
				kind: 'feature',
				text: 'Les civilisations construisent désormais aussi des Bibliothèques d’elles-mêmes.'
			},
			{
				kind: 'improvement',
				text: 'Auto-construction plus fine : un nouveau bâtiment n’est ajouté que si les exemplaires existants sont pleins (sauf s’il n’en existe aucun), en suivant les besoins réels de la civilisation.'
			},
			{
				kind: 'improvement',
				text: 'En-tête de la civilisation réorganisé : statistiques regroupées à gauche, boutons d’action à droite avec menu déroulant sur mobile, et tableaux enfin lisibles sur petit écran.'
			},
			{
				kind: 'improvement',
				text: 'Le tri des citoyens s’applique désormais à toute la population, et plus seulement à la page affichée.'
			},
			{
				kind: 'improvement',
				text: 'La page des règles affiche des valeurs synchronisées avec le jeu (coûts, main-d’œuvre, production) — fini les informations périmées.'
			},
			{
				kind: 'fix',
				text: 'Les soldats ne sont plus envoyés sur les chantiers de construction.'
			},
			{
				kind: 'fix',
				text: 'Un citoyen occupé à construire ne peut plus être enrôlé comme soldat.'
			},
			{
				kind: 'fix',
				text: 'Les ressources pillées sont désormais traduites sur la page des conflits.'
			},
			{
				kind: 'fix',
				text: 'Une nouvelle version du jeu est détectée plus rapidement : une invitation à rafraîchir apparaît sans avoir à recharger manuellement.'
			}
		]
	},
	{
		date: '2026-06-29',
		title: 'Constructions plus accessibles & journal des mises à jour',
		changes: [
			{
				kind: 'improvement',
				text: 'Le choix du prochain bâtiment à construire se fait désormais directement depuis le bloc « Constructions en cours » de la civilisation, sans passer par les réglages.'
			},
			{
				kind: 'feature',
				text: 'Ajout de cette page de journal des mises à jour pour suivre les nouveautés du jeu.'
			},
			{
				kind: 'fix',
				text: 'Le rafraîchissement automatique en direct fonctionne de nouveau : la civilisation se met à jour dès que le monde avance d’un mois, sans recharger la page.'
			},
			{
				kind: 'fix',
				text: 'Les notifications push s’affichent à nouveau correctement (déclaration de guerre, mise en vente sur le marché).'
			},
			{
				kind: 'improvement',
				text: 'Le nombre maximum d’enfants se règle désormais en pourcentage du nombre d’adultes de la civilisation (et non plus en valeur fixe), pour une croissance proportionnelle à la population.'
			},
			{
				kind: 'fix',
				text: 'Les personnes affectées à la construction d’un bâtiment ne font plus aucun autre travail (cueillette, recherche) tant que le chantier n’est pas terminé.'
			},
			{
				kind: 'feature',
				text: 'Le bloc « Constructions en cours » affiche désormais qui construit quoi : la liste des citoyens sur un chantier, leur métier, le bâtiment construit et le temps restant.'
			}
		]
	},
	{
		date: '2026-06-15',
		title: 'Vie du marché',
		changes: [
			{
				kind: 'feature',
				text: 'Les joueurs sont désormais notifiés lorsqu’une ressource est mise en vente sur le marché.'
			},
			{
				kind: 'improvement',
				text: 'L’aperçu du cimetière a été retiré de la page de civilisation pour la rendre plus lisible.'
			},
			{
				kind: 'improvement',
				text: 'Le rapport homme/femme affiche maintenant le pourcentage d’enfants.'
			}
		]
	},
	{
		date: '2026-05-30',
		title: 'Colonies, recherche et cimetière',
		changes: [
			{
				kind: 'feature',
				text: 'Arbre de technologies : recherchez des améliorations pour booster production, stockage, militaire et natalité.'
			},
			{
				kind: 'feature',
				text: 'Possibilité de récupérer les ressources d’une civilisation abandonnée.'
			},
			{
				kind: 'feature',
				text: 'Un cimetière retrace désormais l’histoire de vos citoyens disparus.'
			},
			{
				kind: 'improvement',
				text: 'Un sélecteur de période a été ajouté aux graphiques de progression.'
			}
		]
	},
	{
		date: '2026-05-10',
		title: 'Suivi en direct & confort de jeu',
		changes: [
			{
				kind: 'feature',
				text: 'Rafraîchissement automatique en direct : les civilisations se mettent à jour dès que le monde avance d’un mois.'
			},
			{
				kind: 'feature',
				text: 'Récapitulatif « pendant ton absence » au retour dans une civilisation.'
			},
			{
				kind: 'feature',
				text: 'Notifications push pour prévenir les défenseurs d’une attaque imminente.'
			},
			{
				kind: 'improvement',
				text: 'Les citoyens portent désormais des noms, et un fil d’Ariane facilite la navigation.'
			}
		]
	}
]
