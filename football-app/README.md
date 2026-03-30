# 🚀 Football Predict — Guide d'installation complète

## Architecture
```
Navigateur → Frontend React → Backend FastAPI → API-Football
```

---

## INSTALLATION EN LOCAL (développement)

### 1. Backend Python

```bash
cd football-app/backend

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'environnement
cp .env.example .env
# Édite .env et mets ta clé RAPIDAPI_KEY

# Lancer le backend
uvicorn main:app --reload --port 8000
```

Le backend tourne sur http://localhost:8000
Tu peux voir la doc API sur http://localhost:8000/docs

### 2. Frontend React

```bash
cd football-app/frontend

# Installer les dépendances
npm install

# Lancer le frontend
npm run dev
```

Le site tourne sur http://localhost:5173

---

## DÉPLOIEMENT EN PRODUCTION

### Option A — Railway.app (recommandé, ~5$/mois)

#### Backend :
1. Crée un compte sur railway.app
2. "New Project" → "Deploy from GitHub"
3. Sélectionne le dossier `backend/`
4. Ajoute la variable d'environnement : `RAPIDAPI_KEY=ta_cle`
5. Railway détecte automatiquement FastAPI et le lance

#### Frontend :
1. "New Service" → "Deploy from GitHub" → dossier `frontend/`
2. Build command : `npm run build`
3. Dans `frontend/src/App.jsx`, remplace la ligne :
   ```js
   const API_BASE = "http://localhost:8000";
   ```
   par l'URL de ton backend Railway :
   ```js
   const API_BASE = "https://ton-backend.railway.app";
   ```

---

### Option B — Render.com (gratuit avec limitations)

#### Backend :
1. render.com → "New Web Service"
2. Connecte ton GitHub → dossier `backend/`
3. Build command : `pip install -r requirements.txt`
4. Start command : `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Ajoute `RAPIDAPI_KEY` dans Environment Variables

#### Frontend :
1. "New Static Site" → dossier `frontend/`
2. Build command : `npm install && npm run build`
3. Publish directory : `dist`

---

### Option C — VPS (Ubuntu, ~5€/mois)

```bash
# Sur le serveur
sudo apt update && sudo apt install python3-pip nodejs npm nginx -y

# Backend
cd /var/www/football-app/backend
pip3 install -r requirements.txt
# Lancer avec systemd ou screen :
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd /var/www/football-app/frontend
npm install && npm run build
# Copier dist/ dans /var/www/html/
```

---

## VARIABLES D'ENVIRONNEMENT

| Variable      | Valeur                          |
|---------------|----------------------------------|
| RAPIDAPI_KEY  | Ta clé API-Football (RapidAPI)  |

---

## ENDPOINTS BACKEND

| Méthode | Route                          | Description                    |
|---------|--------------------------------|--------------------------------|
| GET     | /health                        | Vérification de santé          |
| GET     | /fixtures/today                | Matchs du jour + prédictions   |
| GET     | /fixtures/{id}/analysis        | Analyse détaillée d'un match   |
| GET     | /teams/search?q=Arsenal        | Recherche d'équipe             |
| GET     | /compare?home_id=42&away_id=33 | Comparer deux équipes          |
| GET     | /standings/{league_id}         | Classement d'une ligue         |
| GET     | /leagues?country=France        | Ligues par pays                |
| GET     | /countries                     | Tous les pays                  |

---

## STRUCTURE DU PROJET

```
football-app/
├── backend/
│   ├── main.py           ← FastAPI + toutes les routes
│   ├── predictor.py      ← Modèle Poisson + ELO
│   ├── requirements.txt
│   └── .env              ← Ta clé API (ne pas commiter !)
└── frontend/
    ├── src/
    │   ├── App.jsx       ← Application React complète
    │   └── main.jsx      ← Point d'entrée
    ├── index.html
    ├── package.json
    └── vite.config.js
```
