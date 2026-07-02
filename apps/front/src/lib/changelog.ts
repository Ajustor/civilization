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
		date: '2026-07-02',
		title: 'Grands travaux : constructeurs, évolutions de bâtiments et métiers refondus',
		changes: [
			{
				kind: 'feature',
				text: 'Nouveau métier : le Constructeur. C’est désormais le seul métier habilité à bâtir — chaque chantier mobilise des constructeurs (voir « Construit par » dans les règles), et sans eux rien ne se construit. Une jauge lui est dédiée dans la répartition des métiers (10 % par défaut). Un constructeur sans chantier ne produit rien : sa part est un vrai arbitrage.'
			},
			{
				kind: 'feature',
				text: 'Le métier produit, le bâtiment booste : le Fermier produit 12 nourriture/mois à la main et 20 avec une place en Ferme ; l’Érudit produit 0,2 point de recherche/mois seul (5 érudits = 1 point) et 1 point avec une place en Bibliothèque. Leurs bâtiments ne sont plus des prérequis mais des accélérateurs, construits automatiquement quand des travailleurs ne sont pas boostés. Le Mineur, le Commis de cuisine, le Charpentier et le Charbonnier continuent d’exiger leur bâtiment.'
			},
			{
				kind: 'feature',
				text: 'Évolutions de bâtiments : certains bâtiments évoluent désormais à partir d’un bâtiment de base, consommé au lancement du chantier. Les civilisations démarrent sous des Tentes (2 citoyens logés) ; la Maison (4 citoyens) se débloque via la nouvelle recherche « Construction » et consomme 1 tente par maison.'
			},
			{
				kind: 'feature',
				text: 'L’Entrepôt fait son entrée : l’ancien « Entrepôt » s’appelle désormais Cache, et le nouvel Entrepôt — débloqué par la recherche « Entreposage » — évolue à partir de 2 caches et stocke 3× plus. Comme la cache, il est indestructible et protège les ressources des événements.'
			},
			{
				kind: 'improvement',
				text: 'Répartition des métiers : les jauges du Fermier et de l’Érudit ne sont plus plafonnées par les bâtiments existants — les citoyens évoluent d’abord, les bâtiments suivent pour les booster. Les répartitions enregistrées avant l’arrivée du Constructeur sont réinitialisées à la répartition par défaut (pensez à repasser par la configuration).'
			},
			{
				kind: 'fix',
				text: 'Les caches empilées ne retombaient plus à une seule au rechargement de la civilisation.'
			}
		]
	},
	{
		date: '2026-07-02',
		title: 'Fondateurs de tous âges & recherche au long cours',
		changes: [
			{
				kind: 'feature',
				text: 'Succès & classement : les civilisations débloquent désormais des succès (jalons de population, longévité, découvertes, prospérité, faits d’armes…) qui rapportent des points. Une page « Classement » publique départage toutes les civilisations, et chaque civilisation a sa page de succès. Un succès débloqué reste acquis pour toujours.'
			},
			{
				kind: 'feature',
				text: 'Les 50 fondateurs d’une nouvelle civilisation n’ont plus tous 16 ans : ils forment désormais une vraie pyramide des âges — enfants, jeunes actifs, adultes, âge mûr et quelques anciens — tirée au sort à la création. Les plus jeunes commencent enfants et évolueront en grandissant.'
			},
			{
				kind: 'feature',
				text: 'L’arbre des technologies s’ouvre sur une ère moderne : trois nouvelles découvertes de fin de partie — Électricité, Médecine Moderne et Mondialisation.'
			},
			{
				kind: 'improvement',
				text: 'La recherche devient une aventure au long cours : les coûts des technologies grimpent fortement de palier en palier et les bonus de savoir ont été assagis (×5 cumulés au maximum, contre ×85 auparavant). Comptez environ deux semaines réelles pour compléter l’arbre en mode rapide — les premières découvertes restent accessibles dès les premières heures.'
			},
			{
				kind: 'improvement',
				text: 'La page des règles liste désormais l’intégralité de l’arbre technologique (coûts, prérequis et effets), toujours à jour, et décrit la composition de la population fondatrice.'
			},
			{
				kind: 'improvement',
				text: 'Tous les réglages en pourcentage (répartition des métiers, ratio militaire, pourcentage d’enfants, colonie) se font désormais au curseur, avec la possibilité de taper une valeur précise. Dans la répartition des métiers, les autres jauges se recalculent en direct pour que le total fasse toujours 100 %.'
			},
			{
				kind: 'improvement',
				text: 'Le choix du prochain bâtiment indique désormais en direct ce qui bloque le chantier : stocks de ressources (en stock / requis) et ouvriers disponibles, avec un rappel que la demande est conservée et réessayée chaque mois. Fini les chantiers qui semblent ignorés sans explication.'
			},
			{
				kind: 'improvement',
				text: 'L’Entrepôt est enfin constructible : son chantier démesuré (200 bois, 600 planches et 15 récolteurs libres en même temps !) est ramené au niveau des autres bâtiments — 30 bois, 20 planches et 4 récolteurs, toujours en 6 mois.'
			},
			{
				kind: 'feature',
				text: 'Les nouvelles civilisations ne reçoivent plus d’entrepôt à la fondation : le construire devient l’un des premiers objectifs, car sans lui aucune ressource n’est à l’abri des incendies et des invasions de rats.'
			}
		]
	},
	{
		date: '2026-07-02',
		title: 'Mine unique, pyramide des âges & cimetière',
		changes: [
			{
				kind: 'feature',
				text: 'Nouvelle pyramide des âges sur la page de votre civilisation : répartition des hommes et des femmes par tranche de 5 ans, avec une vue agrandie et le détail des effectifs.'
			},
			{
				kind: 'fix',
				text: 'Une civilisation ne peut plus posséder qu’une seule mine à la fois : il était possible d’en empiler plusieurs alors qu’elles partageaient le même gisement. La mine doit désormais s’épuiser (et disparaître) avant qu’une nouvelle puisse être creusée — le sélecteur de bâtiment grise l’option en attendant.'
			},
			{
				kind: 'fix',
				text: 'Le bilan du cimetière (âmes disparues et causes de décès) reflète désormais l’intégralité de l’histoire de la civilisation, au lieu d’être limité aux 200 dernières tombes conservées.'
			}
		]
	},
	{
		date: '2026-07-01',
		title: 'Cimetière, construction & protections',
		changes: [
			{
				kind: 'feature',
				text: 'Le cimetière indique désormais l’âge auquel chaque citoyen est mort.'
			},
			{
				kind: 'fix',
				text: 'Les constructions repartent : un bug d’affectation de la main-d’œuvre empêchait tout nouveau bâtiment de se construire une fois les ouvriers occupés dans le mois. C’est corrigé.'
			},
			{
				kind: 'fix',
				text: 'L’invasion de rats fonctionne correctement (elle pouvait auparavant augmenter la nourriture au lieu de la réduire) et la technologie de lutte contre les nuisibles s’applique enfin.'
			},
			{
				kind: 'improvement',
				text: 'Priorité à la survie : une civilisation qui ne parvient pas à nourrir toute sa population un mois ne lance aucun nouveau chantier ce mois-là — sa main-d’œuvre reste concentrée sur la récolte (les chantiers déjà en cours se poursuivent).'
			}
		]
	},
	{
		date: '2026-06-30',
		title: 'Événements rééquilibrés, migrations & mondes',
		changes: [
			{
				kind: 'feature',
				text: 'La page « Mes civilisations » regroupe désormais vos civilisations par monde, avec une section par monde.'
			},
			{
				kind: 'improvement',
				text: 'Les échanges ne sont possibles qu’entre civilisations d’un même monde : la sélection des partenaires ne propose plus que les civilisations du bon monde.'
			},
			{
				kind: 'improvement',
				text: 'Le mode rapide est désormais activé par défaut pour les nouvelles civilisations.'
			},
			{
				kind: 'improvement',
				text: 'Événements rééquilibrés : les grandes catastrophes (séisme, famine, vague de migration) sont nettement plus rares, les autres événements un peu plus fréquents.'
			},
			{
				kind: 'feature',
				text: 'Anti-répétition : un même événement ne tombe quasiment plus plusieurs mois d’affilée — chaque répétition réduit fortement ses chances de revenir.'
			},
			{
				kind: 'feature',
				text: 'Soldats gardes-frontières : pendant une vague de migration, les soldats retiennent une partie des citoyens qui partiraient (jusqu’à 100 % des départs si la garnison est suffisante).'
			},
			{
				kind: 'improvement',
				text: 'Migration enrichie : les gens quittent les civilisations en difficulté pour les plus prospères, et plus aucune population n’est perdue dans le vide (les migrants sans terre d’accueil rentrent chez eux).'
			},
			{
				kind: 'fix',
				text: 'La liste des civilisations se met à jour immédiatement après une suppression ou une récupération de ressources (plus besoin de rafraîchir la page).'
			}
		]
	},
	{
		date: '2026-06-29',
		title: 'Mode rapide & vue du monde enrichie',
		changes: [
			{
				kind: 'feature',
				text: 'Quatre événements bénéfiques font leur apparition (récolte abondante, caravane prospère, découverte fortuite et âge d’or). Plus leur bonus est important, plus ils sont rares.'
			},
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
