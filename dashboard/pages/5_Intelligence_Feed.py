import streamlit as st
from neo4j import GraphDatabase

URI="bolt://localhost:7687"
USER="neo4j"
PASSWORD="chaitanyaneo"

driver=GraphDatabase.driver(URI,auth=(USER,PASSWORD))

st.title("📰 Global Intelligence Feed")

query="""
MATCH (a)-[r]->(b)
RETURN a.name,r.type,b.name,r.domain
LIMIT 50
"""

with driver.session() as session:

    results=session.run(query)

    for r in results:

        st.markdown(
        f"""
        **{r[0]}**  
        {r[1]} → **{r[2]}**  
        Domain: `{r[3]}`
        """
        )