# Guide d'administration — CEFC Alost

Bienvenue! Ce guide explique comment utiliser le nouveau panneau d'administration pour gérer le contenu du site CEFC Alost.

## 🔐 Accès à l'administration

1. Allez à `https://votre-site.netlify.app/admin/`
2. Connectez-vous avec votre compte Netlify Identity
3. Vous verrez le tableau de bord avec plusieurs onglets

## 📋 Onglets et sections

### 📢 Annonces
Gérez les annonces affichées sur la page d'accueil et autres sections.

**Pour ajouter une annonce:**
1. Cliquez sur le bouton "+ Ajouter une annonce"
2. Remplissez les champs:
   - **Titre**: Le titre de l'annonce
   - **Date**: La date de l'annonce (JJ/MM/YYYY)
   - **Description**: Le texte complet de l'annonce
   - **Image**: URL ou chemin vers l'image (ex: `/images/annonce.jpg`)
   - **À la une**: Cochez si vous voulez que l'annonce soit mise en avant

3. Cliquez sur "💾 Enregistrer" pour sauvegarder

**Pour modifier une annonce existante:**
1. Cliquez dans le champ que vous voulez modifier
2. Les changements sont enregistrés automatiquement
3. Cliquez "💾 Enregistrer" en bas

**Pour supprimer une annonce:**
1. Cliquez sur "🗑️ Supprimer"
2. Confirmez la suppression

### ⏰ Horaires
Gérez les horaires des services religieux.

**Pour modifier un créneau:**
1. Cliquez dans les champs pour modifier:
   - Jour (en français et néerlandais)
   - Horaire (heure de début)
   - Description détaillée (ce qui se passe)

2. Chaque créneau a des traductions en FR, NL et EN

**Pour ajouter un créneau:**
1. Cliquez "+ Ajouter un créneau"
2. Remplissez les informations en français et néerlandais
3. Cliquez "💾 Enregistrer"

### 📺 Live
Gérez le statut et les liens du stream YouTube en direct.

**Champs:**
- **URL YouTube Live**: Lien vers la chaîne YouTube (ex: https://www.youtube.com/@CE_laFamilleChretienne)
- **Statut du Live**: Cochez "Actif" pour activer le badge live sur le site
- **Titre du Live**: Titre affiché sur la page

### 💬 Messages
Gérez les messages du pasteur et les bannières.

**Message du Pasteur:**
- Texte en français et néerlandais
- Affiché sur la page d'accueil dans une section dédiée

**Bannière:**
- Titre et sous-titre en FR et NL
- Image affiché en haut du site

### 👥 Jeunesse
Gérez les informations de la JEFC (Jeunesse Évangélique).

**Champs:**
- Titre de la section
- Description du groupe
- Fréquence de réunion
- Lieu de réunion

Les réseaux sociaux (Instagram, TikTok) sont gérés séparément dans le code.

### 🏢 Départements
Gérez les 9 départements de l'église (Technique, Media, Chorale, etc.).

**Pour ajouter un département:**
1. Cliquez "+ Ajouter un département"
2. Remplissez tous les champs:
   - **ID**: Identifiant unique (ex: "technique")
   - **Nom**: Nom du département en FR, NL, EN
   - **Description**: Description détaillée en FR, NL, EN
   - **Photo**: Nom du fichier image (ex: "technique.jpg")

3. Cliquez "💾 Enregistrer"

**Photos des départements:**
Les images doivent être placées dans `/assets/departements/` avec les noms spécifiés.

### ⚙️ Divers
Gérez le contenu avancé (Vision, Mission, Footer).

**Vision & Mission:**
- Texte en français et néerlandais
- Affiché sur la page d'accueil

**Footer:**
- Verset biblique affiché en bas
- Référence du verset
- Texte de copyright

## 💾 Sauvegarde et déploiement

### Après chaque modification:

1. **Enregistrer localement**: Cliquez le bouton "💾 Enregistrer" en bas de l'onglet
2. **Télécharger le JSON**: Cliquez "⬇️ Télécharger JSON" pour obtenir le fichier mis à jour
3. **Remplacer le fichier**: Remplacez le fichier `contenu.json` à la racine du site
4. **Commit et Push**: 
   ```bash
   git add contenu.json
   git commit -m "Mise à jour du contenu"
   git push origin main
   ```

Le site se redéploiera automatiquement sur Netlify après le push.

## 🖼️ Gestion des images

### Annonces
- Placez les images dans `/images/`
- Référencez-les dans l'admin avec: `/images/nom-du-fichier.jpg`

### Départements
- Placez les images dans `/assets/departements/`
- Noms standards: `technique.jpg`, `media.jpg`, `chorale.jpg`, etc.

### Photos du culte (galerie)
- Placées dans `/photos/culte/`
- Gérées par le fichier `photos_culte.json`
- Les noms doivent correspondre exactement au fichier physique

## 🌐 Support multilingue

Tous les contenus importants doivent avoir des traductions:
- **FR** (Français): Texte principal
- **NL** (Néerlandais): Traduction néerlandaise
- **EN** (Anglais): Traduction anglaise (optionnel pour certains contenus)

Chaque onglet montre les champs dans les trois langues pour faciliter la traduction.

## ⚙️ Structure du fichier contenu.json

Le fichier `contenu.json` contient toutes les données du site:

```json
{
  "annonces": { "liste": [...] },
  "horaires": { "liste": [...] },
  "live": {...},
  "message_pasteur": {...},
  "banniere": {...},
  "jefc": {...},
  "departements": { "liste": [...] },
  "vision_mission": {...},
  "footer": {...}
}
```

Chaque section peut être éditée indépendamment via l'admin.

## 🔄 Flux de travail complet

1. **Connexion** → `/admin/`
2. **Choix de l'onglet** → Sélectionner la section à modifier
3. **Édition** → Modifier les contenus
4. **Enregistrement** → Cliquer "💾 Enregistrer"
5. **Téléchargement** → Télécharger le JSON mis à jour
6. **Remplacement** → Remplacer `contenu.json` dans le dossier racine
7. **Commit & Push** → Pousser les changements vers git
8. **Déploiement** → Netlify redéploie automatiquement

## 📱 Accès mobile

L'admin est accessible sur tous les appareils (desktop, tablette, mobile).
L'interface s'adapte automatiquement à la taille de l'écran.

## 🆘 Dépannage

**Problème: Je ne peux pas me connecter**
- Assurez-vous d'avoir un compte utilisateur créé dans Netlify
- Vérifiez que vous êtes invité comme administrateur

**Problème: Mes changements ne s'affichent pas**
- Attendez quelques secondes après le déploiement
- Videz le cache de votre navigateur (Ctrl+Maj+Suppr)
- Vérifiez que le fichier contenu.json a bien été poussé

**Problème: Les images ne s'affichent pas**
- Vérifiez que le chemin d'image est correct
- Assurez-vous que le fichier image existe dans le bon dossier
- Vérifiez les permissions du fichier

## 📞 Support

Pour toute question ou problème:
1. Vérifiez cette documentation
2. Consultez les commentaires dans le code (`admin.js`)
3. Contactez le développeur

---

**Version**: 2.0  
**Dernière mise à jour**: 2026  
**Site**: CEFC Alost
