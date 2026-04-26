# 💪 GymTracker

> PWA personnelle de suivi d'entraînement en musculation. Stockage 100 % local, design iOS, installable sur téléphone.

🌐 **App en ligne :** [https://nintyx.github.io/TrackGym/](https://nintyx.github.io/TrackGym/)

---

## ✨ Vue d'ensemble

GymTracker est une application web installable (PWA) qui me permet de suivre mes séances de musculation, mes records personnels et ma progression dans le temps.

- **100 % personnel** — pas de comptes, pas de backend, pas de partage
- **Stockage local** — toutes mes données restent dans le navigateur (`localStorage`)
- **Hors ligne** — fonctionne sans connexion une fois installée
- **Design iOS** — interface inspirée des dernières apps iOS (clair/sombre/auto)
- **Multiplateforme** — installable sur Android et iPhone

---

## 📱 Les 5 onglets de l'application

### 🏋️ Séance

L'onglet principal pour logger mes séances en temps réel.

- **Sélection du programme** : Original ou Amélioré (modifiables dans Réglages)
- **Sélecteur de jour** : Lundi, Mardi, etc., propre à chaque programme
- **Sélecteur de semaine** : 1 à 8 (pour suivre ma progression sur un cycle)
- **Cartes d'exercice** :
  - Nom, muscles ciblés, volume cible (séries × reps)
  - Saisie poids et reps pour chaque série
  - Suggestion automatique du poids de la semaine précédente
  - Bouton "Repos" qui lance un timer circulaire avec son et vibration
  - Note libre par exercice
  - Indicateur 🏆 quand je bats un record sur une série
- **Mode abdos maison** : exercices au poids du corps avec checkbox + difficulté RPE 1-10

### 📊 Stats

Visualisation de mes performances et records.

- **Tuiles résumé** : nombre de séances, séries totales, volume total (en tonnes), nombre de records
- **Liste de mes records (PR)** triés par 1RM estimé
- **Détection automatique** des records sur 3 métriques :
  - 🏋️ Max de poids brut
  - 📈 1RM estimé (formule Brzycki : `weight × 36 / (37 - reps)`)
  - 📦 Volume max d'une série (poids × reps)
- **Toast orange** qui s'affiche quand je bats un record en live
- **Graphique d'évolution** par exercice, avec 3 modes au choix :
  - 1RM estimé
  - Poids max
  - Volume total par séance
- **Sommaire** sous le graphique : min, max, % d'évolution

### 📅 Calendrier

Vue mensuelle de mes séances effectuées.

- Grille classique 7×6 (semaines)
- Jours entraînés en **vert plein**
- Jour actuel en **orange** s'il a été entraîné
- Stats en bas : séances cette semaine / 30 derniers jours / total

### ⏱️ Timers

4 modes de timer pour les workouts intensifs.

| Mode | Usage | Affichage |
|------|-------|-----------|
| **EMOM** | Every Minute On the Minute — un nouveau round chaque minute | Round actuel + temps restant dans la minute |
| **AMRAP** | As Many Rounds As Possible — autant de tours que possible sur un temps fixe | Compte à rebours + bouton "+1 Round" |
| **Tabata** | Alternance work/rest classique HIIT | Phase actuelle (work/rest) avec couleur, round X/Y |
| **Chipper** | Chronomètre pour finir un workout le plus vite possible | Temps écoulé + cap optionnel |

Tous avec **son** (Web Audio API) + **vibration** (sur mobile) à chaque transition.

### ⚙️ Réglages

- **Apparence** : thème clair / sombre / automatique (selon les préférences système)
- **Programmes** : éditeur complet pour modifier mes programmes
  - Ajouter / supprimer / réordonner des exercices
  - Modifier nom, muscles, volume, nombre de séries, repos, description
- **Log libre** : logger n'importe quel exercice hors-programme + bouton **"Copier pour Claude"** pour formater mes données et les coller dans une conversation Claude
- **Données** :
  - Export JSON (backup complet de toutes mes données)
  - Import JSON (restaurer une sauvegarde)
  - Reset semaine (effacer une semaine spécifique)

---

## 🛠️ Stack technique

- **React 18.3** + **TypeScript 5.5** — UI et typage
- **Vite 5.4** — build tool
- **Tailwind CSS 3.4** — styling avec variables CSS pour les thèmes
- **Framer Motion** — animations
- **Lucide React** — icônes (style SF Symbols)
- **Recharts** — graphiques d'évolution
- **PWA** — manifest + service worker pour l'install et le hors-ligne
- **GitHub Actions + GitHub Pages** — déploiement automatique

---

## 📂 Architecture du code

```
src/
├── App.tsx                    Shell principal + 5 onglets + thème
├── main.tsx                   Point d'entrée React
├── types/index.tsx            Tous les types TypeScript du projet
│
├── store/
│   ├── useStore.ts            Logique d'état, détection PR, mutations
│   ├── StoreContext.tsx       Provider + hook d'accès au store
│   └── index.ts               load/save/export/import localStorage
│
├── data/
│   └── programs.ts            Programmes par défaut (Original + Amélioré)
│
├── components/
│   ├── TabBar.tsx             Barre de navigation iOS (5 onglets)
│   ├── RestTimer.tsx          Timer de repos circulaire avec audio
│   ├── PRToast.tsx            Toast de notification quand on bat un PR
│   └── ui/GlassCard.tsx       Carte glassmorphism réutilisable
│
└── tabs/
    ├── Seance/
    │   ├── index.tsx          Onglet Séance principal
    │   ├── ExerciseCard.tsx   Carte d'un exercice
    │   └── SetRow.tsx         Ligne de saisie d'une série
    ├── Stats/
    │   └── index.tsx          Onglet Stats avec graphiques
    ├── Calendar/
    │   └── index.tsx          Calendrier mensuel
    ├── Timers/
    │   ├── index.tsx          Sélecteur de mode timer
    │   └── CircleProgress.tsx Cercle de progression SVG
    └── Reglages/
        ├── index.tsx          Onglet Réglages principal
        ├── ProgramEditor.tsx  CRUD des programmes
        └── FreeLogSection.tsx Log libre + export Claude
```

---

## 💾 Modèle de données

Toutes les données sont stockées dans `localStorage` sous la clé **`gym_tracker_v1`**.

Structure principale :

- **Program** → contient des **Day[]**
- **Day** → contient des **Exercise[]**
- **Exercise** → sets, repsRange, restSeconds, muscles, tag éventuel
- **SessionLog** (date, programId, dayId, week) → contient des **ExerciseLog[]**
- **ExerciseLog** → contient des **SetLog[]** (poids, reps, timestamp)
- **PR** → exerciseId, maxWeight, estimated1RM, maxVolume, date
- **FreeLogEntry** → exos hors-programme avec leurs séries
- **Settings** → theme, currentProgramId, currentWeek, currentDayId

Une session est créée au premier input dans une combinaison (programme, jour, semaine, date).

---

## 🚀 Développement local

### Prérequis

- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- **Git** ([git-scm.com](https://git-scm.com))

### Lancer en dev

```bash
git clone https://github.com/NiNtyx/TrackGym.git
cd TrackGym
npm install
npm run dev
```

L'app se lance sur `http://localhost:5173/` avec **Hot Module Replacement** (HMR) — les modifs apparaissent en temps réel sans recharger.

### Tester en mode production (avec le base path `/TrackGym/`)

```bash
npm run build
npm run preview
```

App disponible sur `http://localhost:4173/TrackGym/`.

### Tester sur mon téléphone (même WiFi que le PC)

```bash
npm run dev -- --host
```

Vite affiche une URL `Network: http://192.168.x.x:5173/`. J'ouvre cette URL sur le téléphone pour voir l'app en temps réel.

---

## 📤 Déploiement

Le déploiement est **automatique** via GitHub Actions à chaque push sur la branche `main`.

```bash
git add .
git commit -m "Mes modifications"
git push
```

→ GitHub Actions build l'app et la déploie sur GitHub Pages en 1-2 minutes.

L'app s'auto-met à jour sur les téléphones grâce au service worker (au prochain lancement).

---

## 📲 Installation sur téléphone

### Android (Chrome / Brave)

1. Ouvrir [https://nintyx.github.io/TrackGym/](https://nintyx.github.io/TrackGym/)
2. Le bouton **"Installer"** apparaît en bas, OU menu (⋮) → **"Installer l'application"**
3. L'icône GymTracker apparaît sur l'écran d'accueil

### iPhone (Safari uniquement)

1. Ouvrir l'URL dans **Safari** (pas Chrome)
2. Bouton **Partager** (carré avec flèche vers le haut)
3. **"Sur l'écran d'accueil"**

---

## 🔧 Conventions du projet

- **IDs déterministes** dans `data/programs.ts` (pas de random) → évite d'orphaniser les sessions au reload
- **Écriture immédiate** dans localStorage à chaque mutation (pas de debounce)
- **Pas de backend** — l'app est strictement client-side
- **Textes UI en français**
- **Variables CSS** pour le thème (`--bg-primary`, `--text-primary`, etc.) — pas de couleurs en dur dans les composants

---

## 📝 Licence

Projet personnel — usage privé uniquement.