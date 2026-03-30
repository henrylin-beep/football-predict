"""
main.py — Backend FastAPI pour Football Predict
Lance avec : uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import httpx
import asyncio
import os
from datetime import datetime, timedelta
import json
from predictor import run_model

# ─── CONFIG ──────────────────────────────────────────────────
# Clé depuis dashboard.api-football.com
APISPORTS_KEY = os.getenv("APISPORTS_KEY", "VOTRE_CLE_ICI")
BASE_URL      = "https://v3.football.api-sports.io"
HEADERS       = {"x-apisports-key": APISPORTS_KEY}

# ─── APP ─────────────────────────────────────────────────────
app = FastAPI(title="Football Predict API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod : remplace par ton domaine
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── CACHE SIMPLE EN MÉMOIRE ─────────────────────────────────
_cache: dict = {}

def cache_get(key: str, ttl_minutes: int = 60):
    if key in _cache:
        data, ts = _cache[key]
        if datetime.now() - ts < timedelta(minutes=ttl_minutes):
            return data
    return None

def cache_set(key: str, data):
    _cache[key] = (data, datetime.now())

# ─── CLIENT HTTP ─────────────────────────────────────────────
async def api_get(endpoint: str, params: dict = {}, ttl: int = 60):
    key = endpoint + str(sorted(params.items()))
    cached = cache_get(key, ttl)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{BASE_URL}/{endpoint}",
            headers=HEADERS,
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()
        cache_set(key, data)
        return data

# ─── ROUTES ──────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/fixtures/today")
async def fixtures_today(
    timezone: str = "Europe/Paris",
    country: Optional[str] = None,
    league: Optional[int] = None,
):
    """Tous les matchs du jour avec prédictions."""
    today = datetime.now().strftime("%Y-%m-%d")
    params = {"date": today, "timezone": timezone}
    if league:
        params["league"] = league

    data = await api_get("fixtures", params, ttl=30)
    fixtures = data.get("response", [])

    if country:
        fixtures = [f for f in fixtures if f["league"]["country"] == country]

    # Ajouter prédictions
    results = []
    for fix in fixtures:
        hg = fix.get("teams", {}).get("home", {}).get("statistics", {})
        hAtt = float(hg.get("goals", {}).get("for", {}).get("average", {}).get("total") or 1.35)
        hDef = float(hg.get("goals", {}).get("against", {}).get("average", {}).get("total") or 1.20)
        ag = fix.get("teams", {}).get("away", {}).get("statistics", {})
        aAtt = float(ag.get("goals", {}).get("for", {}).get("average", {}).get("total") or 1.20)
        aDef = float(ag.get("goals", {}).get("against", {}).get("average", {}).get("total") or 1.35)
        pred = run_model(hAtt, hDef, aAtt, aDef)
        results.append({**fix, "prediction": pred})

    results.sort(key=lambda x: x["prediction"]["conf"], reverse=True)
    return {"total": len(results), "fixtures": results}


@app.get("/fixtures/{fixture_id}/analysis")
async def fixture_analysis(fixture_id: int):
    """Analyse détaillée d'un match : stats réelles + prédiction."""
    data = await api_get("fixtures", {"id": fixture_id}, ttl=60)
    fixtures = data.get("response", [])
    if not fixtures:
        raise HTTPException(404, "Match introuvable")

    fix = fixtures[0]
    league_id = fix["league"]["id"]
    season    = fix["league"]["season"]
    home_id   = fix["teams"]["home"]["id"]
    away_id   = fix["teams"]["away"]["id"]

    # Récupérer stats et H2H en parallèle
    hs_task  = api_get("teams/statistics", {"team": home_id, "league": league_id, "season": season}, ttl=360)
    as_task  = api_get("teams/statistics", {"team": away_id, "league": league_id, "season": season}, ttl=360)
    h2h_task = api_get("fixtures/headtohead", {"h2h": f"{home_id}-{away_id}", "last": 5}, ttl=1440)

    hs_data, as_data, h2h_data = await asyncio.gather(hs_task, as_task, h2h_task)

    hs = hs_data.get("response", {})
    as_ = as_data.get("response", {})

    hAtt = float((hs.get("goals", {}).get("for", {}).get("average", {}).get("total")) or 1.35)
    hDef = float((hs.get("goals", {}).get("against", {}).get("average", {}).get("total")) or 1.20)
    aAtt = float((as_.get("goals", {}).get("for", {}).get("average", {}).get("total")) or 1.20)
    aDef = float((as_.get("goals", {}).get("against", {}).get("average", {}).get("total")) or 1.35)

    pred = run_model(hAtt, hDef, aAtt, aDef)

    return {
        "fixture": fix,
        "home_stats": hs,
        "away_stats": as_,
        "h2h": h2h_data.get("response", []),
        "prediction": pred,
    }


@app.get("/teams/search")
async def search_teams(q: str = Query(..., min_length=2)):
    """Recherche d'une équipe par nom."""
    data = await api_get("teams", {"search": q}, ttl=1440)
    return {"teams": data.get("response", [])}


@app.get("/compare")
async def compare_teams(home_id: int, away_id: int, league_id: int = 39):
    """Compare deux équipes avec prédiction et H2H."""
    season = datetime.now().year
    hs_task  = api_get("teams/statistics", {"team": home_id, "league": league_id, "season": season}, ttl=360)
    as_task  = api_get("teams/statistics", {"team": away_id, "league": league_id, "season": season}, ttl=360)
    h2h_task = api_get("fixtures/headtohead", {"h2h": f"{home_id}-{away_id}", "last": 5}, ttl=1440)

    hs_data, as_data, h2h_data = await asyncio.gather(hs_task, as_task, h2h_task)

    hs  = hs_data.get("response", {})
    as_ = as_data.get("response", {})

    hAtt = float((hs.get("goals", {}).get("for", {}).get("average", {}).get("total")) or 1.35)
    hDef = float((hs.get("goals", {}).get("against", {}).get("average", {}).get("total")) or 1.20)
    aAtt = float((as_.get("goals", {}).get("for", {}).get("average", {}).get("total")) or 1.20)
    aDef = float((as_.get("goals", {}).get("against", {}).get("average", {}).get("total")) or 1.35)

    return {
        "prediction": run_model(hAtt, hDef, aAtt, aDef),
        "home_stats": hs,
        "away_stats": as_,
        "h2h": h2h_data.get("response", []),
    }


@app.get("/standings/{league_id}")
async def standings(league_id: int, season: Optional[int] = None):
    """Classement d'une ligue."""
    if not season:
        season = datetime.now().year
    data = await api_get("standings", {"league": league_id, "season": season}, ttl=720)
    resp = data.get("response", [])
    if not resp:
        raise HTTPException(404, "Classement introuvable")
    return {"standings": resp[0]["league"]["standings"]}


@app.get("/countries")
async def countries():
    """Liste tous les pays disponibles."""
    data = await api_get("countries", {}, ttl=1440 * 7)
    return {"countries": data.get("response", [])}


@app.get("/leagues")
async def leagues(country: Optional[str] = None, search: Optional[str] = None):
    """Liste toutes les ligues, filtrable par pays ou recherche."""
    params = {}
    if country:
        params["country"] = country
    if search:
        params["search"] = search
    data = await api_get("leagues", params, ttl=1440)
    return {"leagues": data.get("response", [])}
