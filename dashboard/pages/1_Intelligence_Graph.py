import streamlit as st
from neo4j import GraphDatabase
from pyvis.network import Network
import streamlit.components.v1 as components

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "chaitanyaneo"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

st.title("🕸 Global Intelligence Graph")

query = """
MATCH (a)-[r]->(b)
RETURN a.name, a.type, r.type, r.domain, b.name, b.type
LIMIT 200
"""

edges = []
nodes = {}

with driver.session() as session:

    results = session.run(query)

    for r in results:

        src = r[0]
        src_type = r[1]
        rel = r[2]
        domain = r[3]
        tgt = r[4]
        tgt_type = r[5]

        edges.append((src,tgt,rel))
        nodes[src] = src_type
        nodes[tgt] = tgt_type

net = Network(height="700px", width="100%", bgcolor="#0f172a", font_color="white")

for node in nodes:
    net.add_node(node,label=node)

for src,tgt,rel in edges:
    net.add_edge(src,tgt,label=rel)

net.force_atlas_2based()

net.save_graph("graph.html")

HtmlFile=open("graph.html",'r',encoding='utf-8')

components.html(HtmlFile.read(),height=700)