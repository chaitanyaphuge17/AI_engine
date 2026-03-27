import streamlit as st
from neo4j import GraphDatabase
from backend.conflict_predictor import predict_conflict

URI="bolt://localhost:7687"
USER="neo4j"
PASSWORD="chaitanyaneo"

driver=GraphDatabase.driver(URI,auth=(USER,PASSWORD))

st.title("🤖 AI Prediction")

query="""
MATCH (a)-[r]->(b)
RETURN a.name,r.type,b.name,r.domain
LIMIT 200
"""

edges=[]

with driver.session() as session:

    results=session.run(query)

    for r in results:

        edges.append((r[0],r[2],r[1],r[3]))

st.write("Analyze geopolitical relationships using AI")

if st.button("Run  Prediction"):

    prediction=predict_conflict(edges)

    for p in prediction:

        st.subheader(f"{p['source']} → {p['target']}")
        st.write("Relation:", p["relation"])
        st.info(p["analysis"])