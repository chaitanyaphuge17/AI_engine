"""
Global Ontology Intelligence Engine — FastAPI Server
Run from the project root:  uvicorn main:app --reload
"""

import os
import sys
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# ── Make sure the project root is on the Python path so that
#    `from backend.xxx import ...` works when running from root.
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv()

# ── Lazy-import backend modules so the server still starts even if
#    optional heavy deps (neo4j, spacy, google-genai) are missing.
def _try_import(module, name):
    try:
        mod = __import__(module, fromlist=[name])
        return getattr(mod, name)
    except Exception as e:
        print(f"[WARN] Could not import {module}.{name}: {e}")
        return None

fetch_news       = _try_import("backend.data_collector",   "fetch_news")
extract_entities = _try_import("backend.entity_extractor", "extract_entities")
map_entities     = _try_import("backend.ontology_mapper",  "map_entities")
write_graph      = _try_import("backend.graph_writer",     "write_graph")
classify_domain  = _try_import("backend.domain_classifier","classify_domain")
analyze_news     = _try_import("backend.ai_engine",        "analyze_news")
predict_conflict = _try_import("backend.conflict_predictor","predict_conflict")

# ── Neo4j driver (optional) ─────────────────────────────────────────────
try:
    from neo4j import GraphDatabase
    NEO4J_URI      = os.getenv("NEO4J_URI",      "bolt://localhost:7687")
    NEO4J_USER     = os.getenv("NEO4J_USER",     "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
    _driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    # quick connectivity check
    _driver.verify_connectivity()
    neo4j_available = True
    print("[INFO] Neo4j connected successfully.")
except Exception as e:
    _driver = None
    neo4j_available = False
    print(f"[WARN] Neo4j not available: {e}")


# ── App ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Global Ontology Intelligence Engine API",
    description="AI-powered geopolitical intelligence backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Global Ontology Intelligence Engine",
        "neo4j": neo4j_available,
    }


@app.get("/health")
def health():
    return {
        "status":  "ok",
        "neo4j":   neo4j_available,
        "modules": {
            "data_collector":   fetch_news is not None,
            "entity_extractor": extract_entities is not None,
            "ai_engine":        analyze_news is not None,
            "conflict_predictor": predict_conflict is not None,
        }
    }


# ── Graph: read from Neo4j ────────────────────────────────────────────────
@app.get("/graph")
def get_graph(limit: int = 200):
    """Return nodes + edges from Neo4j (or empty lists if DB unavailable)."""

    if not neo4j_available or _driver is None:
        # Return the sample data from graph.html so the frontend still works
        return _sample_graph()

    try:
        query = """
        MATCH (a)-[r]->(b)
        RETURN a.name AS src, a.type AS src_type,
               r.type AS rel, r.domain AS domain,
               b.name AS tgt, b.type AS tgt_type
        LIMIT $limit
        """
        nodes_map = {}
        edges = []

        with _driver.session() as session:
            results = session.run(query, limit=limit)
            for record in results:
                src    = record["src"]
                src_type = record["src_type"] or "Entity"
                tgt    = record["tgt"]
                tgt_type = record["tgt_type"] or "Entity"
                
                if not src or not tgt:
                    continue

                rel    = record["rel"]    or "RELATION"
                domain = record["domain"] or "general"

                nodes_map[src] = {"id": src, "label": src, "type": src_type}
                nodes_map[tgt] = {"id": tgt, "label": tgt, "type": tgt_type}
                edges.append({
                    "source": src,
                    "target": tgt,
                    "type":   rel,
                    "label":  rel,
                    "domain": domain,
                })

        return {"nodes": list(nodes_map.values()), "edges": edges}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Influence Analytics: centrality scores ────────────────────────────────
@app.get("/analytics/influence")
def get_influence(limit: int = 200):
    """Compute degree centrality from graph edges."""

    if not neo4j_available or _driver is None:
        return _sample_influence()

    try:
        query = """
        MATCH (a)-[r]->(b)
        RETURN a.name AS src, b.name AS tgt
        LIMIT $limit
        """
        degree: dict = {}
        with _driver.session() as session:
            results = session.run(query, limit=limit)
            for record in results:
                src = record["src"]
                tgt = record["tgt"]
                for node in [src, tgt]:
                    if node:
                        degree[node] = degree.get(node, 0) + 1

        n = max(len(degree) - 1, 1)
        ranked = sorted(
            [
                {"country": k, "score": round(v / n, 4), "connections": v}
                for k, v in degree.items()
            ],
            key=lambda x: x["score"],
            reverse=True,
        )
        return {"data": ranked}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Intelligence Feed ────────────────────────────────────────────────────
@app.get("/feed")
def get_feed(limit: int = 50):
    """Return the most recent graph edges as an intelligence feed."""

    if not neo4j_available or _driver is None:
        return _sample_feed(limit)

    try:
        query = """
        MATCH (a)-[r]->(b)
        RETURN a.name AS src, r.type AS rel, b.name AS tgt, r.domain AS domain
        LIMIT $limit
        """
        feed = []
        with _driver.session() as session:
            results = session.run(query, limit=limit)
            for record in results:
                src = record["src"]
                tgt = record["tgt"]
                if not src or not tgt:
                    continue
                
                feed.append({
                    "source":   src,
                    "relation": record["rel"]    or "RELATION",
                    "target":   tgt,
                    "domain":   record["domain"] or "general",
                    "ts":       "live",
                })
        return {"feed": feed}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AI Conflict Prediction ────────────────────────────────────────────────
class EdgeItem(BaseModel):
    source:   str
    target:   str
    relation: str
    domain:   Optional[str] = "general"

class PredictRequest(BaseModel):
    edges: List[EdgeItem]


@app.post("/predict")
def run_prediction(body: PredictRequest):
    """Run AI conflict analysis on the provided edges."""

    if predict_conflict is None or analyze_news is None:
        # Fallback: deterministic mock analysis
        results = []
        for e in body.edges:
            risk = _mock_risk(e.relation)
            results.append({
                "source":   e.source,
                "target":   e.target,
                "relation": e.relation,
                "domain":   e.domain,
                "analysis": risk,
            })
        return results

    raw_edges = [
        (e.source, e.relation, e.target, e.domain)
        for e in body.edges
    ]

    try:
        predictions = predict_conflict(raw_edges)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Pipeline trigger ──────────────────────────────────────────────────────
@app.post("/pipeline/run")
def trigger_pipeline(background_tasks: BackgroundTasks):
    """Kick off the full data-collection → graph-write pipeline in background."""
    if fetch_news is None:
        raise HTTPException(status_code=503, detail="Pipeline modules not loaded")

    background_tasks.add_task(_run_pipeline_task)
    return {"status": "started", "message": "Pipeline running in background"}


def _run_pipeline_task():
    try:
        print("[Pipeline] Fetching news...")
        articles = fetch_news()
        for article in articles:
            text   = article["text"]
            domain = classify_domain(text) if classify_domain else "general"
            print(f"[Pipeline] Processing: {article['title']}")
            result   = extract_entities(text)
            entities = map_entities(result["entities"]) if map_entities else result["entities"]
            write_graph(entities, result["relations"], domain)
        print("[Pipeline] Done.")
    except Exception as e:
        print(f"[Pipeline ERROR] {e}")


# ── Sample / fallback data ────────────────────────────────────────────────
def _sample_graph():
    nodes = [
        {"id": n, "label": n, "type": t}
        for n, t in [
            ("USA","Country"),("Iran","Country"),("Russia","Country"),
            ("India","Country"),("China","Country"),("Israel","Country"),
            ("UK","Country"),("Ukraine","Country"),("France","Country"),
            ("Canada","Country"),("Mexico","Country"),("Australia","Country"),
            ("UAE","Country"),("UN","Organization"),("NATO","Organization"),
            ("EU","Organization"),("IMF","Organization"),("WHO","Organization"),
            ("NSA","Organization"),("AI","Technology"),("Intel","Organization"),
            ("Apple","Organization"),("Meta","Organization"),
            ("Donald Trump","Leader"),
        ]
    ]
    edges = [
        {"source":"USA",      "target":"Iran",        "type":"CONFLICT",         "label":"CONFLICT",         "domain":"defense"},
        {"source":"Russia",   "target":"India",       "type":"SANCTIONS",        "label":"SANCTIONS",        "domain":"economy"},
        {"source":"Russia",   "target":"UN",          "type":"SANCTIONS",        "label":"SANCTIONS",        "domain":"defense"},
        {"source":"Russia",   "target":"Iran",        "type":"CONFLICT",         "label":"CONFLICT",         "domain":"defense"},
        {"source":"Russia",   "target":"Israel",      "type":"CONFLICT",         "label":"CONFLICT",         "domain":"defense"},
        {"source":"India",    "target":"Iran",        "type":"CONFLICT",         "label":"CONFLICT",         "domain":"defense"},
        {"source":"China",    "target":"UN",          "type":"TECH_DEVELOPMENT", "label":"TECH_DEVELOPMENT", "domain":"technology"},
        {"source":"UN",       "target":"EU",          "type":"TECH_DEVELOPMENT", "label":"TECH_DEVELOPMENT", "domain":"technology"},
        {"source":"UN",       "target":"AI",          "type":"TECH_DEVELOPMENT", "label":"TECH_DEVELOPMENT", "domain":"technology"},
        {"source":"UN",       "target":"IMF",         "type":"CONFLICT",         "label":"CONFLICT",         "domain":"economy"},
        {"source":"Intel",    "target":"UN",          "type":"TECH_DEVELOPMENT", "label":"TECH_DEVELOPMENT", "domain":"technology"},
        {"source":"Intel",    "target":"EU",          "type":"CONFLICT",         "label":"CONFLICT",         "domain":"economy"},
        {"source":"NATO",     "target":"UN",          "type":"ALLY",             "label":"ALLY",             "domain":"defense"},
        {"source":"Iran",     "target":"UN",          "type":"TECH_DEVELOPMENT", "label":"TECH_DEVELOPMENT", "domain":"technology"},
        {"source":"Iran",     "target":"UAE",         "type":"TECH_DEVELOPMENT", "label":"TECH_DEVELOPMENT", "domain":"technology"},
        {"source":"Iran",     "target":"EU",          "type":"CONFLICT",         "label":"CONFLICT",         "domain":"defense"},
        {"source":"Israel",   "target":"Iran",        "type":"TECH_DEVELOPMENT", "label":"TECH_DEVELOPMENT", "domain":"defense"},
        {"source":"Israel",   "target":"Donald Trump","type":"CONFLICT",         "label":"CONFLICT",         "domain":"defense"},
        {"source":"UK",       "target":"UN",          "type":"CONFLICT",         "label":"CONFLICT",         "domain":"defense"},
        {"source":"UK",       "target":"Ukraine",     "type":"CONFLICT",         "label":"CONFLICT",         "domain":"defense"},
        {"source":"Canada",   "target":"Mexico",      "type":"TRADE",            "label":"TRADE",            "domain":"economy"},
        {"source":"Australia","target":"UN",          "type":"SANCTIONS",        "label":"SANCTIONS",        "domain":"economy"},
        {"source":"WHO",      "target":"EU",          "type":"TRADE",            "label":"TRADE",            "domain":"economy"},
        {"source":"WHO",      "target":"AI",          "type":"ALLY",             "label":"ALLY",             "domain":"technology"},
        {"source":"Apple",    "target":"UN",          "type":"TECH_DEVELOPMENT", "label":"TECH_DEVELOPMENT", "domain":"technology"},
        {"source":"Meta",     "target":"UN",          "type":"TRADE",            "label":"TRADE",            "domain":"economy"},
        {"source":"NSA",      "target":"AI",          "type":"ALLY",             "label":"ALLY",             "domain":"technology"},
    ]
    return {"nodes": nodes, "edges": edges}


def _sample_influence():
    edges = [
        ("USA","Israel"),("USA","Ukraine"),("China","Pakistan"),
        ("Russia","Iran"),("India","USA"),("North Korea","China"),
        ("South Korea","USA"),("Iran","Russia"),("Pakistan","China"),
        ("Ukraine","EU"),("USA","NATO"),("UK","USA"),
        ("France","EU"),("Germany","EU"),("Saudi Arabia","USA"),
        ("Turkey","NATO"),("Brazil","USA"),("Japan","USA"),
    ]
    degree: dict = {}
    for a, b in edges:
        degree[a] = degree.get(a, 0) + 1
        degree[b] = degree.get(b, 0) + 1
    n = max(len(degree) - 1, 1)
    ranked = sorted(
        [{"country": k, "score": round(v/n, 4), "connections": v} for k, v in degree.items()],
        key=lambda x: x["score"], reverse=True
    )
    return {"data": ranked}


def _sample_feed(limit: int = 50):
    feed = [
        {"source":"USA",          "relation":"CONFLICT",         "target":"Iran",        "domain":"defense",    "ts":"2 min ago"},
        {"source":"Russia",       "relation":"CONFLICT",         "target":"Ukraine",     "domain":"defense",    "ts":"5 min ago"},
        {"source":"China",        "relation":"TECH_DEVELOPMENT", "target":"UN",          "domain":"technology", "ts":"9 min ago"},
        {"source":"India",        "relation":"TRADE",            "target":"Russia",      "domain":"economy",    "ts":"13 min ago"},
        {"source":"Israel",       "relation":"CONFLICT",         "target":"Iran",        "domain":"defense",    "ts":"17 min ago"},
        {"source":"Iran",         "relation":"TECH_DEVELOPMENT", "target":"UAE",         "domain":"technology", "ts":"20 min ago"},
        {"source":"USA",          "relation":"SANCTIONS",        "target":"China",       "domain":"economy",    "ts":"24 min ago"},
        {"source":"NATO",         "relation":"ALLY",             "target":"UN",          "domain":"defense",    "ts":"28 min ago"},
        {"source":"Australia",    "relation":"SANCTIONS",        "target":"UN",          "domain":"economy",    "ts":"31 min ago"},
        {"source":"Intel",        "relation":"TECH_DEVELOPMENT", "target":"EU",          "domain":"technology", "ts":"35 min ago"},
        {"source":"NSA",          "relation":"ALLY",             "target":"AI",          "domain":"technology", "ts":"39 min ago"},
        {"source":"Meta",         "relation":"TRADE",            "target":"UN",          "domain":"economy",    "ts":"43 min ago"},
        {"source":"Apple",        "relation":"TECH_DEVELOPMENT", "target":"UN",          "domain":"technology", "ts":"47 min ago"},
        {"source":"UK",           "relation":"CONFLICT",         "target":"Ukraine",     "domain":"defense",    "ts":"51 min ago"},
        {"source":"France",       "relation":"CONFLICT",         "target":"Middle East", "domain":"defense",    "ts":"55 min ago"},
        {"source":"Canada",       "relation":"TRADE",            "target":"Mexico",      "domain":"economy",    "ts":"1 hr ago"},
        {"source":"WHO",          "relation":"ALLY",             "target":"AI",          "domain":"technology", "ts":"1 hr ago"},
        {"source":"Donald Trump", "relation":"CONFLICT",         "target":"Iran",        "domain":"defense",    "ts":"1 hr ago"},
    ]
    return {"feed": feed[:limit]}


def _mock_risk(relation: str) -> str:
    mapping = {
        "CONFLICT":         "Conflict Risk Level: **High**\nOngoing territorial disputes and energy resource competition have intensified bilateral tensions beyond negotiated thresholds.",
        "SANCTIONS":        "Conflict Risk Level: **Medium**\nSanctions represent calibrated economic pressure. Target may retaliate through asymmetric means, raising proxy conflict risk.",
        "ALLY":             "Conflict Risk Level: **Low**\nAlliance partnership is stable and mutually reinforcing. Collective security mechanisms provide strong deterrence.",
        "TRADE":            "Conflict Risk Level: **Low**\nEconomic interdependence creates mutual deterrents against confrontation. Both parties benefit significantly from continued trade flows.",
        "TECH_DEVELOPMENT": "Conflict Risk Level: **Low**\nTechnology partnerships are largely cooperative. Minor IP disputes managed through multilateral frameworks.",
    }
    return mapping.get(relation, "Conflict Risk Level: **Medium**\nRelationship requires further intelligence assessment.")
