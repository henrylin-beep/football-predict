"""
predictor.py — Modèle de Poisson + ELO
"""

import math


def poisson_prob(lam: float, k: int) -> float:
    result = math.exp(-lam)
    for i in range(1, k + 1):
        result *= lam / i
    return result


def run_model(h_att: float, h_def: float, a_att: float, a_def: float) -> dict:
    avg  = 1.35
    hadv = 1.12

    lh = max(0.3, min(4.0, (h_att / avg) * (a_def / avg) * avg * hadv))
    la = max(0.3, min(4.0, (a_att / avg) * (h_def / avg) * avg))

    ph = pd = pa = 0.0
    best_score = (1, 0)
    best_prob  = 0.0

    for h in range(9):
        for a in range(9):
            p = poisson_prob(lh, h) * poisson_prob(la, a)
            if h > a:   ph += p
            elif h == a: pd += p
            else:        pa += p
            if p > best_prob:
                best_prob  = p
                best_score = (h, a)

    total = ph + pd + pa
    ph /= total; pd /= total; pa /= total

    et     = lh + la
    over25 = 1.0 - sum(poisson_prob(et, k) for k in range(3))
    btts   = (1 - poisson_prob(lh, 0)) * (1 - poisson_prob(la, 0))

    conf   = round(max(ph, pd, pa) * 100)
    winner = "home" if ph > pa and ph > pd else "away" if pa > pd else "draw"

    return {
        "ph":     round(ph * 100),
        "pd":     round(pd * 100),
        "pa":     round(pa * 100),
        "over25": round(over25 * 100),
        "under25":round((1 - over25) * 100),
        "btts":   round(btts * 100),
        "no_btts":round((1 - btts) * 100),
        "xgh":    round(lh, 2),
        "xga":    round(la, 2),
        "score":  f"{best_score[0]}-{best_score[1]}",
        "conf":   conf,
        "winner": winner,
    }
