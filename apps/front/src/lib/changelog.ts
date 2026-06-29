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
