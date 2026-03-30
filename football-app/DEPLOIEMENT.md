# 🚀 Guide déploiement — Zéro installation

## Résumé
- Backend → Railway.app (gratuit)
- Frontend → Vercel (gratuit)
- Durée totale : ~20 minutes

---

## ÉTAPE 1 — GitHub

1. Va sur github.com → connecte-toi
2. Clique le "+" en haut à droite → "New repository"
3. Nom : "football-predict" → Public → "Create repository"
4. Clique "uploading an existing file"
5. Extrais le zip football-app.zip sur ton bureau
6. Glisse TOUT le contenu extrait dans la page GitHub
7. Clique "Commit changes" (bouton vert en bas)

---

## ÉTAPE 2 — Backend sur Railway

1. Va sur railway.app
2. "Start a New Project" → "Deploy from GitHub repo"
3. Autorise Railway à accéder à GitHub si demandé
4. Sélectionne "football-predict"
5. Clique sur le service créé → onglet "Settings"
6. Root Directory → tape : backend
7. Onglet "Variables" → "New Variable" :
   - Name  : APISPORTS_KEY
   - Value : (ta clé depuis dashboard.api-football.com)
8. Onglet "Settings" → "Generate Domain" → copie l'URL
   (format : https://football-predict-xxx.railway.app)

---

## ÉTAPE 3 — Frontend sur Vercel

1. Va sur vercel.com → "Continue with GitHub"
2. "New Project" → importe "football-predict"
3. Avant de déployer, configure :
   - Framework Preset : Vite
   - Root Directory   : frontend
4. "Environment Variables" → ajoute :
   - Name  : VITE_API_BASE
   - Value : (l'URL Railway copiée à l'étape 2)
5. Clique "Deploy"
6. Vercel te donne une URL publique :
   https://football-predict-xxx.vercel.app

---

## RÉSULTAT

Ton app est accessible depuis n'importe quel navigateur,
sur PC, tablette ou téléphone, sans rien installer.

URL Vercel → tout le monde peut y accéder
URL Railway → uniquement le backend (API)

---

## En cas de problème

- Backend ne démarre pas → vérifie que Root Directory = "backend"
- Erreur CORS → l'URL VITE_API_BASE doit correspondre exactement
- Erreur API → vérifie que APISPORTS_KEY est correct dans Railway
